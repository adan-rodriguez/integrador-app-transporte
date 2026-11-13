import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import MapaRecorrido from '@/componentes/MapaRecorrido';
import { obtenerAvisos, obtenerFeriados, obtenerHorariosLinea, obtenerLinea, obtenerParadas } from '@/servicios/api';
import { Aviso, Horario, Linea, Parada, Sentido, TipoDeDia } from '@/tipos';
import { haceCuanto } from '@/utilidades/fechas';
import { tipoDeDia } from '@/utilidades/horarios';

// ESTILO: componentes y valores del tema
import { BannerSinRed, Cargando, Selector, Texto } from '@/componentes/ui';
import { espacio, radio, textoSobre, useColores } from '@/tema';


// Opciones del selector de tipo de día: [valor, texto]
const TIPOS: [TipoDeDia, string][] = [
  ['habil', 'Hábiles'],
  ['sabado', 'Sábados'],
  ['domingo', 'Domingos'],
  ['feriado', 'Feriados'],
];

export default function LineaDetailScreen() {
  const c = useColores(); // ESTILO: colores según modo claro/oscuro

  const { id } = useLocalSearchParams<{ id: string }>();
  const [linea, setLinea] = useState<Linea | null>(null);
  const [paradas, setParadas] = useState<Map<string, Parada>>(new Map());
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [sentido, setSentido] = useState<Sentido>('ida');
  const [tipo, setTipo] = useState<TipoDeDia>('habil');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardadoEn, setGuardadoEn] = useState<Date | null>(null);
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  useEffect(() => {
    Promise.all([
      obtenerLinea(id),
      obtenerParadas().catch(() => null),
      obtenerHorariosLinea(id).catch(() => null),
      obtenerFeriados().catch(() => new Set<string>()),
      obtenerAvisos(id).catch(() => null),
    ]).then(([resLinea, resParadas, resHorarios, feriados, resAvisos]) => {
      if ('datos' in resLinea) {
        setLinea(resLinea.datos);
        setGuardadoEn(resLinea.guardadoEn ?? null);
      } else {
        setError(resLinea.error.mensaje);
      }
      // Un Map por id para encontrar cada parada del recorrido rápido
      if (resParadas) setParadas(new Map(resParadas.datos.map((p) => [p.id, p])));
      if (resHorarios) setHorarios(resHorarios.datos);
      if (resAvisos) setAvisos(resAvisos.datos);
      setTipo(tipoDeDia(new Date(), feriados)); // arranca en el tipo de día de hoy
      setCargando(false);
    });
  }, [id]);

  if (cargando) return <Cargando />;
  if (!linea) {
    return (
      <View style={[styles.center, { backgroundColor: c.fondo }]}>
        <Texto>{error ?? 'No encontramos esta línea.'}</Texto>
      </View>
    );
  }

  const recorrido = linea.recorridos.find((r) => r.sentido === sentido);
  const paradasDelRecorrido = (recorrido?.paradaIds ?? [])
    .map((pid) => paradas.get(pid))
    .filter((p): p is Parada => p !== undefined);

  // Salidas desde la primera parada del sentido elegido, para el tipo de día elegido
  const cabecera = recorrido?.paradaIds[0];
  const salidas = horarios
    .filter((h) => h.paradaId === cabecera && h.sentido === sentido && h.tipoDeDia === tipo)
    .map((h) => h.hora)
    .sort();

  // ESTILO: colores de cada aviso según su gravedad
  function coloresAviso(a: Aviso) {
    if (a.gravedad === 'suspension') return { color: c.suspension, fondo: c.suspensionFondo };
    if (a.gravedad === 'desvio') return { color: c.desvio, fondo: c.desvioFondo };
    return { color: c.informativo, fondo: c.informativoFondo };
  }

  return (
    <>
      <Stack.Screen options={{ title: `Línea ${linea.numero}` }} />
      <FlatList
        data={paradasDelRecorrido}
        keyExtractor={(p) => p.id}
        style={{ backgroundColor: c.fondo }}
        contentContainerStyle={{ padding: espacio.l, gap: 0 }}
        ListHeaderComponent={
          <View style={{ gap: espacio.m, marginBottom: espacio.s }}>
            <View style={{ gap: espacio.xs }}>
              <View style={[styles.titulo, { backgroundColor: linea.color }]}>
                <Texto variante="titulo" style={{ color: textoSobre(linea.color) }}>Línea {linea.numero}</Texto>
              </View>
              <Texto secundario>{linea.nombre} · {linea.empresa}</Texto>
              {!linea.activa && (
                <Texto variante="cuerpoNegrita" style={{ color: c.suspension }}>Hoy sin servicio</Texto>
              )}
            </View>

            {guardadoEn && (
              <BannerSinRed mensaje={`Sin conexión. Recorrido guardado ${haceCuanto(guardadoEn)}.`} />
            )}

            {avisos.map((a) => {
              const col = coloresAviso(a);
              return (
                <Link key={a.id} href={`/aviso/${a.id}`} asChild>
                  <Pressable style={StyleSheet.flatten([styles.aviso, { backgroundColor: col.fondo }])}>
                    <Texto variante="etiqueta" style={{ color: col.color }}>
                      {a.gravedad === 'suspension' ? 'SUSPENSIÓN' : a.gravedad === 'desvio' ? 'DESVÍO' : 'AVISO'}
                    </Texto>
                    <Texto variante="cuerpoNegrita" style={{ color: col.color }}>{a.titulo}</Texto>
                    <Texto variante="secundario" style={{ color: col.color }}>Tocá para ver el detalle</Texto>
                  </Pressable>
                </Link>
              );
            })}

            <Selector
              opciones={linea.recorridos.map((r) => ({
                valor: r.sentido,
                texto: r.sentido === 'ida' ? 'Ida' : 'Vuelta',
                detalle: r.destino,
              }))}
              valor={sentido}
              onCambiar={setSentido}
            />

            <View style={[styles.mapa, { borderColor: c.borde }]}>
              {recorrido && (
                <MapaRecorrido trazado={recorrido.trazado} paradas={paradasDelRecorrido} color={linea.color} />
              )}
            </View>

            <Texto variante="subtitulo">Paradas {recorrido?.destino}</Texto>
          </View>
        }
        ListEmptyComponent={<Texto secundario>No pudimos cargar las paradas de este recorrido.</Texto>}
        ListFooterComponent={
          <View style={{ gap: espacio.m, marginTop: espacio.l }}>
            <Texto variante="subtitulo">
              Horarios desde {cabecera ? paradas.get(cabecera)?.nombre : 'la cabecera'}
            </Texto>
            <Selector
              opciones={TIPOS.map(([valor, texto]) => ({ valor, texto }))}
              valor={tipo}
              onCambiar={setTipo}
            />
            {salidas.length === 0 ? (
              <Texto secundario>No hay servicio ese día.</Texto>
            ) : (
              <View style={styles.salidas}>
                {salidas.map((h) => (
                  <View key={h} style={[styles.salida, { backgroundColor: c.tarjeta, borderColor: c.borde }]}>
                    <Texto style={{ fontVariant: ['tabular-nums'] }}>{h}</Texto>
                  </View>
                ))}
              </View>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <Link href={`/parada/${item.id}`} asChild>
            <Pressable style={StyleSheet.flatten([styles.parada, { borderBottomColor: c.borde }])}>
              <View style={[styles.numero, { borderColor: linea.color }]}>
                <Texto variante="etiqueta">{index + 1}</Texto>
              </View>
              <Texto style={{ flex: 1 }}>{item.nombre}</Texto>
            </Pressable>
          </Link>
        )}
      />
    </>
  );
}

// ESTILO: solo distribución; los colores salen de useColores() o del color de la línea
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: espacio.xl },
  titulo: { alignSelf: 'flex-start', borderRadius: radio.s, paddingHorizontal: espacio.m, paddingVertical: espacio.xs },
  mapa: { height: 260, borderRadius: radio.m, overflow: 'hidden', borderWidth: 1 },
  parada: { flexDirection: 'row', alignItems: 'center', gap: espacio.m, paddingVertical: espacio.m, borderBottomWidth: 1 },
  numero: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  aviso: { padding: espacio.m, borderRadius: radio.m, gap: 2 },
  salidas: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  salida: { borderWidth: 1, borderRadius: radio.s, paddingHorizontal: espacio.s, paddingVertical: espacio.xs },
});