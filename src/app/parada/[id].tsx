import { View, Text, StyleSheet, Button, FlatList } from 'react-native';
import { useLocalSearchParams, Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { obtenerParada, obtenerHorariosParada } from '../../servicios/api';
import { Parada, Horario } from '../../tipos';

export default function ParadaDetailScreen() {
  const { id } = useLocalSearchParams();
  const [parada, setParada] = useState<Parada | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Manejar el estado de error o vacio de ambas promesas
    Promise.all([
      obtenerParada(id as string),
      obtenerHorariosParada(id as string)
    ]).then(([resParada, resHorarios]) => {
      if ('datos' in resParada) setParada(resParada.datos);
      if ('datos' in resHorarios) setHorarios(resHorarios.datos);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <View style={styles.center}><Text>Cargando información de la parada...</Text></View>;
  if (!parada) return <View style={styles.center}><Text>Error: Parada no encontrada.</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{parada.nombre}</Text>
      <Text>Líneas que pasan: {parada.lineaIds.join(', ')}</Text>
      
      {/* TODO: 
          1. Calcular los "próximos 3 horarios" comparando con la hora actual.
          2. Mostrar si ya pasó el último colectivo.
          3. Agrupar los horarios por línea.
      */}
      <Text style={styles.subtitle}>Próximos horarios (según tabla)</Text>
      <FlatList
        data={horarios}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.horarioItem}>
            <Text style={styles.horaTexto}>{item.hora}</Text>
            <Text>Línea {item.lineaId}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No hay más servicio por hoy.</Text>}
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
  horarioItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 8, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  horaTexto: { fontSize: 18, fontWeight: 'bold' }
});

