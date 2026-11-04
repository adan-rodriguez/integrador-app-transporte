import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { obtenerAvisos, obtenerLineas } from '@/servicios/api';
import { Aviso, Gravedad, Linea } from '@/tipos';
import { formatearFechaHora, haceCuanto } from '@/utilidades/fechas';

const GRAVEDAD: Record<Gravedad, { texto: string; color: string }> = {
  suspension: { texto: 'Suspensión', color: '#b00020' },
  desvio: { texto: 'Desvío', color: '#b35c00' },
  informativo: { texto: 'Informativo', color: '#1a5fb4' },
};

export default function AvisosScreen() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [lineas, setLineas] = useState<Map<string, Linea>>(new Map());
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardadoEn, setGuardadoEn] = useState<Date | null>(null);

  function cargar() {
    setCargando(true);
    setError(null);
    Promise.all([obtenerAvisos(), obtenerLineas().catch(() => null)])
      .then(([resAvisos, resLineas]) => {
        setAvisos(resAvisos.datos);
        setGuardadoEn(resAvisos.guardadoEn);
        if (resLineas) setLineas(new Map(resLineas.datos.map((l) => [l.id, l])));
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  if (cargando && avisos.length === 0) return <ActivityIndicator style={{ flex: 1 }} />;

  if (error && avisos.length === 0) {
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
        <Text style={styles.avisoSinRed}>
          Sin conexión. Avisos guardados {haceCuanto(guardadoEn)}: pueden no estar al día.
        </Text>
      )}
      <FlatList
        data={avisos}
        keyExtractor={(a) => a.id}
        refreshing={cargando}
        onRefresh={cargar}
        ListEmptyComponent={<Text>No hay avisos vigentes. Todas las líneas funcionan normal.</Text>}
        renderItem={({ item }) => {
          const g = GRAVEDAD[item.gravedad];
          return (
            <Link href={`/aviso/${item.id}`} asChild>
              <Pressable style={StyleSheet.flatten([styles.item, { borderLeftColor: g.color }])}>
                <Text style={{ color: g.color, fontWeight: '700', fontSize: 12 }}>{g.texto.toUpperCase()}</Text>
                <Text style={styles.titulo}>{item.titulo}</Text>
                <Text>
                  Líneas: {item.lineaIds.map((id) => lineas.get(id)?.numero ?? id).join(', ')}
                </Text>
                <Text style={{ fontSize: 12 }}>
                  Desde {formatearFechaHora(item.desde)}
                  {item.hasta ? ` hasta ${formatearFechaHora(item.hasta)}` : ' · sin fecha de fin'}
                  {item.videoUrl ? ' · con video' : ''}
                </Text>
              </Pressable>
            </Link>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  boton: { padding: 12, borderWidth: 1, borderRadius: 8 },
  item: { padding: 14, borderLeftWidth: 6, backgroundColor: '#f9f9f9', marginBottom: 8, borderRadius: 4, gap: 4 },
  titulo: { fontSize: 16, fontWeight: '600' },
  avisoSinRed: { padding: 8, borderRadius: 8, backgroundColor: '#fff3cd', color: '#5c4400' },
});