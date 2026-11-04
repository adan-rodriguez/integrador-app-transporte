import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import MapaRecorrido from '@/componentes/MapaRecorrido';
import { obtenerAvisos, obtenerFeriados, obtenerHorariosLinea, obtenerLinea, obtenerParadas } from '@/servicios/api';
import { Aviso, Horario, Linea, Parada, Sentido, TipoDeDia } from '@/tipos';
import { haceCuanto } from '@/utilidades/fechas';
import { tipoDeDia } from '@/utilidades/horarios';


// Opciones del selector de tipo de día: [valor, texto]
const TIPOS: [TipoDeDia, string][] = [
  ['habil', 'Hábiles'],
  ['sabado', 'Sábados'],
  ['domingo', 'Domingos'],
  ['feriado', 'Feriados'],
];

export default function LineaDetailScreen() {
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

  if (cargando) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!linea) {
    return (
      <View style={styles.center}>
        <Text>{error ?? 'No encontramos esta línea.'}</Text>
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

  return (
    <>
      <Stack.Screen options={{ title: `Línea ${linea.numero}` }} />
      <FlatList
        data={paradasDelRecorrido}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, gap: 4 }}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 8 }}>
            <View>
              <Text style={[styles.title, { color: linea.color }]}>Línea {linea.numero}</Text>
              <Text>{linea.nombre} · {linea.empresa}</Text>
              {!linea.activa && <Text style={styles.sinServicio}>Hoy sin servicio</Text>}
            </View>

            {guardadoEn && (
              <Text style={styles.avisoSinRed}>Sin conexión. Recorrido guardado {haceCuanto(guardadoEn)}.</Text>
            )}

            {avisos.map((a) => (
              <Link key={a.id} href={`/aviso/${a.id}`} asChild>
                <Pressable style={styles.aviso}>
                  <Text style={{ fontWeight: '700', color: '#b35c00' }}>
                    {a.gravedad === 'suspension' ? 'SUSPENSIÓN' : a.gravedad === 'desvio' ? 'DESVÍO' : 'AVISO'}
                  </Text>
                  <Text>{a.titulo}</Text>
                  <Text style={{ fontSize: 12 }}>Tocá para ver el detalle</Text>
                </Pressable>
              </Link>
            ))}

            <View style={styles.selector}>
              {linea.recorridos.map((r) => (
                <Pressable
                  key={r.sentido}
                  onPress={() => setSentido(r.sentido)}
                  style={[styles.opcion, sentido === r.sentido && { backgroundColor: '#ddd' }]}
                >
                  <Text style={{ fontWeight: '600', textAlign: 'center' }}>{r.sentido === 'ida' ? 'Ida' : 'Vuelta'}</Text>
                  <Text style={{ fontSize: 12, textAlign: 'center' }}>{r.destino}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.mapa}>
              {recorrido && (
                <MapaRecorrido trazado={recorrido.trazado} paradas={paradasDelRecorrido} color={linea.color} />
              )}
            </View>

            <Text style={styles.subtitle}>Paradas {recorrido?.destino}</Text>
          </View>
        }
        ListEmptyComponent={<Text>No pudimos cargar las paradas de este recorrido.</Text>}
        ListFooterComponent={
          <View style={{ gap: 8, marginTop: 16 }}>
            <Text style={styles.subtitle}>
              Horarios desde {cabecera ? paradas.get(cabecera)?.nombre : 'la cabecera'}
            </Text>
            <View style={styles.selector}>
              {TIPOS.map(([valor, texto]) => (
                <Pressable
                  key={valor}
                  onPress={() => setTipo(valor)}
                  style={[styles.opcion, tipo === valor && { backgroundColor: '#ddd' }]}
                >
                  <Text style={{ textAlign: 'center', fontSize: 13 }}>{texto}</Text>
                </Pressable>
              ))}
            </View>
            {salidas.length === 0 ? (
              <Text>No hay servicio ese día.</Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {salidas.map((h) => (
                  <Text key={h}>{h}</Text>
                ))}
              </View>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <Link href={`/parada/${item.id}`} asChild>
            <Pressable style={styles.parada}>
              <Text style={styles.numero}>{index + 1}</Text>
              <Text style={{ flex: 1 }}>{item.nombre}</Text>
            </Pressable>
          </Link>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 18, fontWeight: '600' },
  sinServicio: { color: '#b00020', fontWeight: '600', marginTop: 4 },
  avisoSinRed: { padding: 8, borderRadius: 8, backgroundColor: '#fff3cd', color: '#5c4400' },
  selector: { flexDirection: 'row', borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  opcion: { flex: 1, padding: 10 },
  mapa: { height: 260, borderRadius: 10, overflow: 'hidden' },
  parada: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  numero: { width: 24, textAlign: 'center', fontWeight: '600' },
  aviso: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#b35c00', backgroundColor: '#fff4e5', gap: 2 },
});