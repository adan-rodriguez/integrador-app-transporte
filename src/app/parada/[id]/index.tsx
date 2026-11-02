import { obtenerHorariosParada, obtenerLineasDeParada, obtenerParada } from '@/servicios/api';
import { Horario, Linea, Parada } from '@/tipos';
import { agruparPorLinea } from '@/utilidades/horarios';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRumbo } from '@/hooks/useRumbo';
import FlechaRumbo from '@/componentes/FlechaRumbo';

export default function ParadaDetailScreen() {
  const { id } = useLocalSearchParams();
  const [parada, setParada] = useState<Parada | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const { angulo, distancia } = useRumbo(parada?.coordenadas ?? null);


  useEffect(() => {
    Promise.all([
      obtenerParada(id as string),
      obtenerHorariosParada(id as string)
    ]).then(([resParada, resHorarios]) => {
      if ('datos' in resParada) {
        setParada(resParada.datos);
        obtenerLineasDeParada(resParada.datos.lineaIds)
          .then((r) => setLineas(r.datos))
          .catch(() => { }); // si falla, mostramos el id como hasta ahora
      }
      if ('datos' in resHorarios) setHorarios(resHorarios.datos);
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

  return (
    <View style={styles.container}>
      <View style={styles.encabezado}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{parada.nombre}</Text>
          <Text>
            Líneas que pasan: {parada.lineaIds.map((id) => lineas.find((l) => l.id === id)?.numero ?? id).join(', ')}
          </Text>
        </View>
        <Link href={`/parada/${parada.id}/rumbo`} asChild>
          <Pressable style={styles.rumbo} accessibilityLabel="Cómo llego a la parada">
            <FlechaRumbo angulo={angulo} />
            <Text style={{ fontSize: 12 }}>
              {distancia !== null ? `${Math.round(distancia)} m` : '...'}
            </Text>
          </Pressable>
        </Link>
      </View>

      <Text style={styles.subtitle}>Próximos horarios (según tabla)</Text>
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
                <Text style={styles.horaTexto}>
                  {g.horarios[0].hora} (en {g.minutosAlPrimero} min según tabla)
                </Text>
                <Text>{g.horarios.slice(1).map((h) => h.hora).join('   ')}</Text>
              </>
            )}
          </View>
        )}
        ListEmptyComponent={<Text>No hay servicio hoy ni mañana en esta parada.</Text>}
      />

      <Link href={`/reporte/lin-05/${parada.id}`} asChild>
        <Button title="Reportar una demora" color="orange" />
      </Link>
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
});