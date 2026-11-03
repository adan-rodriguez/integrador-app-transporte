import { View, Text, StyleSheet, Button, Pressable } from 'react-native';
import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import MapaParadas from '@/componentes/MapaParadas';
import { useUbicacion } from '@/hooks/useUbicacion';
import { obtenerParadasCercanas } from '@/servicios/api';
import { Parada } from '@/tipos';

export default function InicioScreen() {
  // TODO: 
  // 1. Mostrar favoritos (líneas y paradas) - requiere persistencia local (sqlite/kv-store).
  // 2. Mostrar "Avisos de hoy" llamando a la API (o a nuestro servicio mock) y filtrando por fecha actual.

  const { posicion } = useUbicacion();
  const [cercanas, setCercanas] = useState<Parada[]>([]);

  useEffect(() => {
    if (!posicion) return;
      // TODO: definir con el equipo si el mapa de Inicio muestra solo las cercanas (500 m) o todas las paradas
    obtenerParadasCercanas(posicion.coords.latitude, posicion.coords.longitude, 500)
      .then((res) => setCercanas(res.datos))
      .catch(() => { }); // si falla, el mapa queda sin marcadores
  }, [posicion]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transporte Público Paraná</Text>
      <Pressable onPress={() => router.push('/parada/escanear')}>
        <Text>Escanear parada</Text>
      </Pressable>

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
      <View style={styles.mapa}>
        <MapaParadas
          paradas={cercanas}
          centro={
            posicion
              ? { latitud: posicion.coords.latitude, longitud: posicion.coords.longitude }
              : null
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  subtitle: { fontSize: 18, marginTop: 16, marginBottom: 8, fontWeight: '600' },
  mapPlaceholder: { height: 200, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  mapa: { height: 240, borderRadius: 10, overflow: 'hidden' },

});

