import MapaParadas from '@/componentes/MapaParadas';
import { useUbicacion } from '@/hooks/useUbicacion';
import { obtenerParadasCercanas } from '@/servicios/api';
import { Parada } from '@/tipos';
import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

// ESTILO: componentes y valores del tema
import { Boton, Texto } from '@/componentes/ui';
import { espacio, radio, useColores } from '@/tema';

export default function InicioScreen() {
  // TODO: 
  // 1. Mostrar favoritos (líneas y paradas) - requiere persistencia local (sqlite/kv-store).
  // 2. Mostrar "Avisos de hoy" llamando a la API (o a nuestro servicio mock) y filtrando por fecha actual.

  const c = useColores(); // ESTILO: colores según modo claro/oscuro

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
    <View style={[styles.container, { backgroundColor: c.fondo }]}>
      <Texto variante="titulo" style={styles.title}>Transporte Público Paraná</Texto>
      <Boton titulo="Escanear parada" variante="primario" onPress={() => router.push('/parada/escanear')} />

      {/* TODO: Reemplazar con listas reales usando FlatList y componentes visuales */}
      <Texto variante="subtitulo" style={styles.subtitle}>Tus paradas (Favoritos)</Texto>
      <Link href="/parada/par-101" asChild>
        <Boton titulo="Ir a Parada: Alameda y Urquiza (Mock)" />
      </Link>

      <Texto variante="subtitulo" style={styles.subtitle}>Avisos de hoy</Texto>
      <Link href="/aviso/avi-088" asChild>
        <Boton titulo="Ver aviso: Desvío por obra en calle Corrientes" />
      </Link>

      <Texto variante="subtitulo" style={styles.subtitle}>Mapa de paradas cerca tuyo</Texto>
      <View style={[styles.mapa, { borderColor: c.borde }]}>
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

// ESTILO: solo distribución; los colores salen de useColores()
const styles = StyleSheet.create({
  container: { flex: 1, padding: espacio.l },
  title: { marginBottom: espacio.l },
  subtitle: { marginTop: espacio.l, marginBottom: espacio.s },
  mapa: { height: 240, borderRadius: radio.m, overflow: 'hidden', borderWidth: 1 },
});