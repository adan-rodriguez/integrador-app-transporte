import { View, Text, StyleSheet, Button } from 'react-native';
import { Link } from 'expo-router';

export default function InicioScreen() {
  // TODO: 
  // 1. Mostrar favoritos (líneas y paradas) - requiere persistencia local (sqlite/kv-store).
  // 2. Mostrar "Avisos de hoy" llamando a la API (o a nuestro servicio mock) y filtrando por fecha actual.
  // 3. Renderizar el "MAPA de paradas" con la ubicación actual del usuario usando `expo-location` y `react-native-maps`.

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transporte Público Paraná</Text>
      
      {/* TODO: Reemplazar con listas reales usando FlatList y componentes visuales */}
      <Text style={styles.subtitle}>Tus paradas (Favoritos)</Text>
      <Link href="/parada/par-101" asChild>
        <Button title="Ir a Parada: Alameda y Urquiza (Mock)" />
      </Link>

      <Text style={styles.subtitle}>Avisos de hoy</Text>
      <Link href="/aviso/avi-088" asChild>
        <Button title="Ver aviso: Desvío por obra en calle Corrientes" />
      </Link>

      <Text style={styles.subtitle}>Mapa de paradas cerca tuyo</Text>
      <View style={styles.mapPlaceholder}>
        <Text>Map Component Here</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  subtitle: { fontSize: 18, marginTop: 16, marginBottom: 8, fontWeight: '600' },
  mapPlaceholder: { height: 200, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }
});

