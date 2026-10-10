import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { obtenerLineas } from '../../servicios/api';
import { Linea } from '../../tipos';

export default function LineasScreen() {
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Manejar estado de error si la API falla o estamos sin conexión
    obtenerLineas().then(res => {
      setLineas(res.datos);
      setLoading(false);
    });
  }, []);

  if (loading) return <View style={styles.center}><Text>Cargando líneas...</Text></View>;

  return (
    <View style={styles.container}>
      {/* TODO: Mejorar la UI usando componentes dedicados y el color real de la línea (item.color) */}
      <FlatList
        data={lineas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={`/linea/${item.id}`} asChild>
            <TouchableOpacity style={StyleSheet.flatten([styles.item, { borderLeftColor: item.color }])}>
              <Text style={styles.itemTitle}>Línea {item.numero}</Text>
              <Text>{item.nombre}</Text>
            </TouchableOpacity>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  item: { padding: 16, borderLeftWidth: 8, backgroundColor: '#f9f9f9', marginBottom: 8, borderRadius: 4 },
  itemTitle: { fontSize: 18, fontWeight: 'bold' }
});

