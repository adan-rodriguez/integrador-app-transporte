import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { obtenerAvisos, obtenerLineas } from '@/servicios/api';
import { Gravedad, Linea } from '@/tipos';
import { haceCuanto } from '@/utilidades/fechas';

export default function LineasScreen() {
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardadoEn, setGuardadoEn] = useState<Date | null>(null);
  const [estados, setEstados] = useState<Map<string, Gravedad>>(new Map());



  function cargar() {
    setCargando(true);
    setError(null);
    Promise.all([obtenerLineas(), obtenerAvisos().catch(() => null)])
      .then(([res, resAvisos]) => {
        setLineas(res.datos);
        setGuardadoEn(res.guardadoEn);
        if (resAvisos) {
          // La API ordena por gravedad (suspensión primero), así que el primero de cada línea es el más grave
          const mapa = new Map<string, Gravedad>();
          for (const a of resAvisos.datos) {
            for (const lid of a.lineaIds) if (!mapa.has(lid)) mapa.set(lid, a.gravedad);
          }
          setEstados(mapa);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  if (cargando && lineas.length === 0) return <ActivityIndicator style={{ flex: 1 }} />;

  if (error && lineas.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ textAlign: 'center' }}>{error}</Text>
        <Pressable onPress={cargar} style={styles.boton}>
          <Text>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {guardadoEn && (
        <Text style={styles.avisoSinRed}>Sin conexión. Mostramos lo guardado {haceCuanto(guardadoEn)}.</Text>
      )}
      <FlatList
        data={lineas}
        keyExtractor={(item) => item.id}
        refreshing={cargando}
        onRefresh={cargar}
        ListEmptyComponent={<Text>No hay líneas cargadas.</Text>}
        renderItem={({ item }) => (
          <Link href={`/linea/${item.id}`} asChild>
            <Pressable style={StyleSheet.flatten([styles.item, { borderLeftColor: item.color }])}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.itemTitle}>Línea {item.numero}</Text>
                {!item.activa ? (
                  <Text style={styles.sinServicio}>Sin servicio</Text>
                ) : estados.get(item.id) === 'suspension' ? (
                  <Text style={styles.sinServicio}>Suspendida</Text>
                ) : estados.get(item.id) === 'desvio' ? (
                  <Text style={styles.desvio}>Desvío</Text>
                ) : null}
              </View>
              <Text>{item.nombre}</Text>
              <Text style={{ fontSize: 12 }}>{item.empresa}</Text>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  boton: { padding: 12, borderWidth: 1, borderRadius: 8 },
  item: { padding: 16, borderLeftWidth: 8, backgroundColor: '#f9f9f9', marginBottom: 8, borderRadius: 4, gap: 2 },
  itemTitle: { fontSize: 18, fontWeight: 'bold' },
  sinServicio: { fontSize: 12, color: '#b00020', fontWeight: '600' },
  avisoSinRed: { padding: 8, borderRadius: 8, backgroundColor: '#fff3cd', color: '#5c4400' },
    desvio: { fontSize: 12, color: '#b35c00', fontWeight: '600' },
});