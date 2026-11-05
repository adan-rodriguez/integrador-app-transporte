import { confirmarReporte, obtenerHorariosParada, obtenerLineasDeParada, obtenerParada, obtenerReportesParada } from '@/servicios/api';
import { Horario, Linea, MotivoDemora, Parada, ReporteDeDemora } from '@/tipos';
import { agruparPorLinea } from '@/utilidades/horarios';
import { Link, useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Button, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRumbo } from '@/hooks/useRumbo';
import FlechaRumbo from '@/componentes/FlechaRumbo';
import { formatearDistancia } from '@/utilidades/coordenadas';
import { haceCuanto } from '@/utilidades/fechas';

//FAVORITO============================================================================================================
import Ionicons from '@react-native-vector-icons/ionicons';
import { agregarParadaFavorita, quitarParadaFavorita } from '@/servicios/cuenta';
import { useSesion } from '@/sesion';
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
  // TODO: usar useColores() de @/tema en vez de colores fijos (en modo oscuro se ve mal)

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

  if (loading) return <View style={styles.center}><Text>Cargando información de la parada...</Text></View>;
  if (!parada) return <View style={styles.center}><Text>Error: Parada no encontrada.</Text></View>;

  function nombreLinea(lineaId: string) {
    const l = lineas.find((x) => x.id === lineaId);
    if (!l) return `Línea ${lineaId}`;
    const recorrido =
      l.recorridos.find((r) => r.paradaIds.includes(parada!.id)) ??
      l.recorridos.find((r) => r.sentido === parada!.sentido);
    return `Línea ${l.numero}${recorrido ? ' ' + recorrido.destino : ''}`;
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
    <View style={styles.container}>
      <View style={styles.encabezado}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{parada.nombre}</Text>
          <Text>
            Líneas que pasan: {parada.lineaIds.map((id) => lineas.find((l) => l.id === id)?.numero ?? id).join(', ')}
          </Text>
        </View>
        <Pressable
          onPress={alternarFavorita}
          style={{ padding: 8 }}
          accessibilityLabel={esFavorita ? 'Quitar de favoritas' : 'Agregar a favoritas'}
        >
          <Ionicons name={esFavorita ? 'star' : 'star-outline'} size={28} color="#f5a623" />
        </Pressable>
        <Link href={`/parada/${parada.id}/rumbo`} asChild>
          <Pressable style={styles.rumbo} accessibilityLabel="Cómo llego a la parada">
            <FlechaRumbo angulo={angulo} />
            <Text style={{ fontSize: 12 }}>
              {distancia !== null ? formatearDistancia(distancia) : '...'}
            </Text>
          </Pressable>
        </Link>
      </View>

      {guardadoEn && (
        <Text style={styles.avisoSinRed}>
          Sin conexión. Horarios calculados con la tabla guardada {haceCuanto(guardadoEn)}.
        </Text>
      )}

      <Text style={styles.subtitle}>Próximos horarios (según tabla)</Text>
      <Text style={{ fontSize: 12, marginBottom: 4 }}>Tocá un horario para que te avisemos 10 min antes.</Text>
      <FlatList
        data={agruparPorLinea(horarios)}
        keyExtractor={(g) => g.lineaId}
        renderItem={({ item: g }) => (
          <View style={styles.grupo}>
            <Text style={styles.linea}>{nombreLinea(g.lineaId)}</Text>
            {g.primeroEsManana ? (
              <Text>No hay más servicio hasta mañana a las {g.horarios[0].hora}</Text>
            ) : (
              <>
                <Pressable onPress={() => pedirRecordatorio(g.horarios[0].hora, g.lineaId)}>
                  <Text style={styles.horaTexto}>
                    {g.horarios[0].hora} (en {g.minutosAlPrimero} min según tabla)
                  </Text>
                </Pressable>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  {g.horarios.slice(1).map((h) => (
                    <Pressable key={h.id} onPress={() => pedirRecordatorio(h.hora, g.lineaId)} hitSlop={8}>
                      <Text>{h.hora}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </View>
        )}
        ListEmptyComponent={<Text>No hay servicio hoy ni mañana en esta parada.</Text>}
      />

      {/* TODO (Noelia): elegir la línea a reportar entre las que pasan por la parada, no lin-05 fija */}
      <View style={{ gap: 8, marginTop: 12 }}>
        
        {reportes.length > 0 && (
          <View style={{ gap: 6, marginTop: 12 }}>
            <Text style={styles.subtitle}>Reportes de pasajeros</Text>
            {reportes.map((r) => (
              <View key={r.id} style={styles.reporte}>
                <Text style={{ fontWeight: '600' }}>
                  {nombreLinea(r.lineaId)}: {MOTIVO_TEXTO[r.motivo]}
                </Text>
                <Text style={{ fontSize: 12 }}>
                  {haceCuanto(new Date(r.fechaHora))} · {r.confirmaciones} confirmaron
                </Text>
                {r.comentario && <Text>{r.comentario}</Text>}
                {r.usuarioId !== usuario?.id && (
                  <Pressable onPress={() => confirmar(r.id)} style={styles.botonConfirmar}>
                    <Text>Yo también lo veo</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}
        <Text style={styles.subtitle}>¿Tu colectivo está demorado?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {parada.lineaIds.map((lid) => (
            <Link key={lid} href={`/reporte/${lid}/${parada.id}`} asChild>
              <Pressable style={styles.chipReporte}>
                <Text style={{ fontWeight: '600' }}>
                  Reportar línea {lineas.find((l) => l.id === lid)?.numero ?? lid}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 18, marginTop: 16, marginBottom: 8, fontWeight: '600' },
  horaTexto: { fontSize: 18, fontWeight: 'bold' },
  grupo: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ccc', gap: 2 },
  linea: { fontSize: 16, fontWeight: '600' },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rumbo: { alignItems: 'center', padding: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 10, minWidth: 64 },
  avisoSinRed: { padding: 8, borderRadius: 8, backgroundColor: '#fff3cd', color: '#5c4400', marginTop: 8 },
  chipReporte: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#ffe0b2' },
    reporte: { padding: 10, borderRadius: 8, backgroundColor: '#fff4e5', gap: 2 },
  botonConfirmar: { alignSelf: 'flex-start', marginTop: 4, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderRadius: 8 },
});