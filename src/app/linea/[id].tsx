import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { obtenerLinea } from '../../servicios/api';
import { Linea } from '../../tipos';

export default function LineaDetailScreen() {
  const { id } = useLocalSearchParams();
  const [linea, setLinea] = useState<Linea | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Manejar el caso de que la respuesta sea un error (ApiError) o vacío
    obtenerLinea(id as string).then(res => {
      if ('datos' in res) {
        setLinea(res.datos);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return <View style={styles.center}><Text>Cargando recorrido...</Text></View>;
  if (!linea) return <View style={styles.center}><Text>Error: Línea no encontrada.</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: linea.color }]}>Línea {linea.numero}</Text>
      <Text>{linea.nombre}</Text>
      
      {/* TODO: 
          1. Renderizar el mapa (react-native-maps) con Polyline usando 'linea.recorridos[0].trazado'.
          2. Mostrar botones para cambiar de sentido ("ida" / "vuelta").
          3. Listar paradas ordenadas de ese sentido debajo del mapa.
          4. Mostrar si hay un aviso de desvío vigente para esta línea.
      */}
      <View style={styles.mapPlaceholder}>
        <Text>Mapa del recorrido aquí</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  mapPlaceholder: { height: 300, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', marginTop: 16 }
});

