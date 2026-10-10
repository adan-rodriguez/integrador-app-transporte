import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { obtenerAvisos } from '../../servicios/api';
import { Aviso } from '../../tipos';

export default function AvisoDetailScreen() {
  const { id } = useLocalSearchParams();
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    obtenerAvisos().then(res => {
      const encontrado = res.datos.find(a => a.id === id);
      if (encontrado) setAviso(encontrado);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <View style={styles.center}><Text>Cargando aviso...</Text></View>;
  if (!aviso) return <View style={styles.center}><Text>Error: Aviso no encontrado.</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{aviso.titulo}</Text>
      <Text style={styles.gravedad}>Gravedad: {aviso.gravedad}</Text>
      <Text style={styles.detalle}>{aviso.detalle}</Text>

      {/* TODO: 
          1. Usar expo-video para reproducir 'aviso.videoUrl' si no es null.
          2. Mostrar 'aviso.trazadoAlternativo' en el mapa con expo-location / react-native-maps.
      */}
      {aviso.videoUrl && (
        <View style={styles.videoPlaceholder}>
          <Text>Reproductor de video (expo-video) aquí</Text>
        </View>
      )}

      {aviso.trazadoAlternativo && (
        <View style={styles.mapPlaceholder}>
          <Text>Mapa del desvío aquí</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  gravedad: { color: 'red', fontWeight: 'bold', marginVertical: 8 },
  detalle: { fontSize: 16, marginBottom: 16 },
  videoPlaceholder: { height: 200, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  mapPlaceholder: { height: 200, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }
});

