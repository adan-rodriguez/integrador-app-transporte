import FlechaRumbo from '@/componentes/FlechaRumbo';
import { useRumbo } from '@/hooks/useRumbo';
import { confirmarReporte, obtenerHorariosParada, obtenerLineasDeParada, obtenerParada, obtenerReportesParada } from '@/servicios/api';
import { Horario, Linea, MotivoDemora, Parada, ReporteDeDemora } from '@/tipos';
import { formatearDistancia } from '@/utilidades/coordenadas';
import { haceCuanto } from '@/utilidades/fechas';
import { agruparPorLinea } from '@/utilidades/horarios';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

// ESTILO: componentes y valores del tema
import { BannerSinRed, Boton, Tarjeta, Texto } from '@/componentes/ui';
import { espacio, radio, useColores } from '@/tema';

//FAVORITO============================================================================================================
import { agregarParadaFavorita, quitarParadaFavorita } from '@/servicios/cuenta';
import { useSesion } from '@/sesion';
import Ionicons from '@react-native-vector-icons/ionicons';
//=======================================================================================================================

//NOTIFICACIO ALERTA============================================================================================================
import { programarRecordatorio } from '@/servicios/recordatorios';
//=======================================================================================================================


const MOTIVO_TEXTO: Record<MotivoDemora, string> = {
  no_paso: 'no pasó',
  paso_lleno: 'pasó lleno y no paró',
  demorado: 'viene demorado',
  unidad_rota: 'unidad rota',
  calle_cortada: 'calle cortada',
};

export default function ParadaDetailScreen() {
  const c = useColores(); // ESTILO: colores según modo claro/oscuro

  const { id } = useLocalSearchParams();
  const [parada, setParada] = useState<Parada | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const { angulo, distancia } = useRumbo(parada?.coordenadas ?? null);

  //FAVORITO============================================================================================================

  const { usuario, reemplazarUsuario } = useSesion();
  const esFavorita = !!parada && !!usuario?.paradasFavoritas.includes(parada.id);

  //REPORTE============================================================================================================
  const [reportes, setReportes] = useState<ReporteDeDemora[]>([]);


  const [guardadoEn, setGuardadoEn] = useState<Date | null>(null);

  async function alternarFavorita() {
    if (!parada) return;
    if (!usuario) {
      router.push('/ingresar'); // sin sesión no hay favoritos
      return;
    }
    if (esFavorita) {
      await quitarParadaFavorita(parada.id);
      reemplazarUsuario({
        ...usuario,
        paradasFavoritas: usuario.paradasFavoritas.filter((p) => p !== parada.id),
      });
    } else {
      const { datos } = await agregarParadaFavorita(parada.id);
      reemplazarUsuario(datos);
    }
  }

  function cargarReportes() {
    obtenerReportesParada(id as string)
      .then(setReportes)
      .catch(() => { }); // sin red no hay reportes: necesitan conexión
  }

  async function confirmar(reporteId: string) {
    if (!usuario) return router.push('/ingresar');
    try {
      await confirmarReporte(reporteId);
      cargarReportes();
    } catch (e: any) {
      Alert.alert('No se pudo confirmar', e.message);
    }
  }

  //=======================================================================================================================

  useEffect(() => {
    cargarReportes();
    Promise.all([
      obtenerParada(id as string),
      obtenerHorariosParada(id as string).catch(() => null), // sin red y sin nada guardado
    ]).then(([resParada, resHorarios]) => {
      if ('datos' in resParada) {
        setParada(resParada.datos);
        obtenerLineasDeParada(resParada.datos.lineaIds)
          .then((r) => setLineas(r.datos))
          .catch(() => { }); // si falla, mostramos el id como hasta ahora
      }
      if (resHorarios) {
        setHorarios(resHorarios.datos);
        setGuardadoEn(resHorarios.guardadoEn);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return <View style={[styles.center, { backgroundColor: c.fondo }]}><Texto secundario>Cargando información de la parada...</Texto></View>;
  if (!parada) return <View style={[styles.center, { backgroundColor: c.fondo }]}><Texto>Error: Parada no encontrada.</Texto></View>;

  function nombreLinea(lineaId: string) {
    const l = lineas.find((x) => x.id === lineaId);
    if (!l) return `Línea ${lineaId}`;
    const recorrido =
      l.recorridos.find((r) => r.paradaIds.includes(parada!.id)) ??
      l.recorridos.find((r) => r.sentido === parada!.sentido);
    return `Línea ${l.numero}${recorrido ? ' ' + recorrido.destino : ''}`;
  }

  // ESTILO: color de la línea para la franja de su tarjeta (gris si todavía no cargó)
  function colorLinea(lineaId: string) {
    return lineas.find((x) => x.id === lineaId)?.color ?? c.borde;
  }

  function pedirRecordatorio(hora: string, lineaId: string) {
    Alert.alert('Recordatorio', `¿Te avisamos 10 minutos antes del de las ${hora}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Avisarme',
        onPress: async () => {
          const r = await programarRecordatorio(hora, nombreLinea(lineaId), parada!.nombre);
          if (r === 'ok') Alert.alert('Listo', `Te avisamos 10 minutos antes de las ${hora}.`);
          if (r === 'falta-poco') Alert.alert('Falta muy poco', 'Quedan menos de 10 minutos para ese horario.');
          if (r === 'sin-permiso') Alert.alert('Sin permiso', 'Activá las notificaciones para recibir recordatorios.');
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: c.fondo }]}>
      <View style={styles.encabezado}>
        <View style={{ flex: 1 }}>
          <Texto variante="titulo">{parada.nombre}</Texto>
          <Texto variante="secundario" secundario>
            Líneas que pasan: {parada.lineaIds.map((id) => lineas.find((l) => l.id === id)?.numero ?? id).join(', ')}
          </Texto>
        </View>
        <Pressable
          onPress={alternarFavorita}
          style={{ padding: 8 }}
          accessibilityLabel={esFavorita ? 'Quitar de favoritas' : 'Agregar a favoritas'}
        >
          <Ionicons name={esFavorita ? 'star' : 'star-outline'} size={28} color={c.acento} />
        </Pressable>
        <Link href={`/parada/${parada.id}/rumbo`} asChild>
          <Pressable
                        style={StyleSheet.flatten([styles.rumbo, { borderColor: c.borde, backgroundColor: c.tarjeta }])}
            accessibilityLabel="Cómo llego a la parada"
          >
            <FlechaRumbo angulo={angulo} color={c.acento} />
            <Texto variante="etiqueta" secundario>
              {distancia !== null ? formatearDistancia(distancia) : '...'}
            </Texto>
          </Pressable>
        </Link>
      </View>

      {guardadoEn && (
        <View style={{ marginTop: espacio.s }}>
          <BannerSinRed mensaje={`Sin conexión. Horarios calculados con la tabla guardada ${haceCuanto(guardadoEn)}.`} />
        </View>
      )}

      <Texto variante="subtitulo" style={styles.subtitle}>Próximos horarios (según tabla)</Texto>
      <Texto variante="secundario" secundario style={{ marginBottom: espacio.s }}>
        Tocá un horario para que te avisemos 10 min antes.
      </Texto>
      <FlatList
        data={agruparPorLinea(horarios)}
        keyExtractor={(g) => g.lineaId}
        contentContainerStyle={{ gap: espacio.s }}
        renderItem={({ item: g }) => (
          <Tarjeta style={[styles.grupo, { borderLeftColor: colorLinea(g.lineaId) }]}>
            <Texto variante="cuerpoNegrita">{nombreLinea(g.lineaId)}</Texto>
            {g.primeroEsManana ? (
              <Texto secundario>No hay más servicio hasta mañana a las {g.horarios[0].hora}</Texto>
            ) : (
              <>
                <Pressable onPress={() => pedirRecordatorio(g.horarios[0].hora, g.lineaId)}>
                  <Texto variante="horario">
                    {g.horarios[0].hora}
                    <Texto variante="secundario" secundario>
                      {' '}(en {g.minutosAlPrimero} min según tabla)
                    </Texto>
                  </Texto>
                </Pressable>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  {g.horarios.slice(1).map((h) => (
                    <Pressable key={h.id} onPress={() => pedirRecordatorio(h.hora, g.lineaId)} hitSlop={8}>
                      <Texto secundario style={{ fontVariant: ['tabular-nums'] }}>{h.hora}</Texto>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </Tarjeta>
        )}
        ListEmptyComponent={<Texto secundario>No hay servicio hoy ni mañana en esta parada.</Texto>}
      />

      {/* TODO (Noelia): elegir la línea a reportar entre las que pasan por la parada, no lin-05 fija */}
      <View style={{ gap: 8, marginTop: 12 }}>
        
        {reportes.length > 0 && (
          <View style={{ gap: 6, marginTop: 12 }}>
            <Texto variante="subtitulo" style={styles.subtitle}>Reportes de pasajeros</Texto>
            {reportes.map((r) => (
              <View key={r.id} style={[styles.reporte, { backgroundColor: c.acentoSuave }]}>
                <Texto variante="cuerpoNegrita" style={{ color: c.acento }}>
                  {nombreLinea(r.lineaId)}: {MOTIVO_TEXTO[r.motivo]}
                </Texto>
                <Texto variante="secundario" style={{ color: c.acento }}>
                  {haceCuanto(new Date(r.fechaHora))} · {r.confirmaciones} confirmaron
                </Texto>
                {r.comentario && <Texto>{r.comentario}</Texto>}
                {r.usuarioId !== usuario?.id && (
                  <Boton
                    titulo="Yo también lo veo"
                    onPress={() => confirmar(r.id)}
                    style={styles.botonConfirmar}
                  />
                )}
              </View>
            ))}
          </View>
        )}
        <Texto variante="subtitulo" style={styles.subtitle}>¿Tu colectivo está demorado?</Texto>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {parada.lineaIds.map((lid) => (
            <Link key={lid} href={`/reporte/${lid}/${parada.id}`} asChild>
              <Boton
                titulo={`Reportar línea ${lineas.find((l) => l.id === lid)?.numero ?? lid}`}
                variante="primario"
              />
            </Link>
          ))}
        </View>
      </View>
    </View>
  );
}

// ESTILO: acá solo queda la distribución (márgenes, tamaños, bordes).
// Los colores van aparte, desde useColores(), para que cambien con el modo oscuro.
const styles = StyleSheet.create({
  container: { flex: 1, padding: espacio.l },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  subtitle: { marginTop: espacio.l, marginBottom: espacio.xs },
  grupo: { borderLeftWidth: 6, gap: 2 },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: espacio.m },
  rumbo: { alignItems: 'center', padding: espacio.s, borderWidth: 1, borderRadius: radio.m, minWidth: 64 },
  reporte: { padding: espacio.m, borderRadius: radio.m, gap: 2 },
  botonConfirmar: { alignSelf: 'flex-start', marginTop: 4, paddingVertical: 6, paddingHorizontal: 10 },
});