import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { obtenerAvisos, obtenerLineas } from '@/servicios/api';
import { Aviso, Gravedad, Linea } from '@/tipos';
import { formatearFechaHora, haceCuanto } from '@/utilidades/fechas';

// ESTILO: componentes y valores del tema
import { BannerSinRed, Boton, Cargando, Texto } from '@/componentes/ui';
import { espacio, radio, useColores } from '@/tema';

// ESTILO: acá queda solo el texto; el color sale del tema (cambia en modo oscuro)
const GRAVEDAD: Record<Gravedad, { texto: string }> = {
  suspension: { texto: 'Suspensión' },
  desvio: { texto: 'Desvío' },
  informativo: { texto: 'Informativo' },
};

export default function AvisosScreen() {
  const c = useColores(); // ESTILO: colores según modo claro/oscuro

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

  // ESTILO: color de texto y de fondo para cada gravedad
  function coloresGravedad(g: Gravedad) {
    if (g === 'suspension') return { color: c.suspension, fondo: c.suspensionFondo };
    if (g === 'desvio') return { color: c.desvio, fondo: c.desvioFondo };
    return { color: c.informativo, fondo: c.informativoFondo };
  }

  if (cargando && avisos.length === 0) return <Cargando />;

  if (error && avisos.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: c.fondo }]}>
        <Texto style={{ textAlign: 'center' }}>{error}</Texto>
        <Boton titulo="Reintentar" onPress={cargar} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.fondo }]}>
      {guardadoEn && (
        <BannerSinRed
          mensaje={`Sin conexión. Avisos guardados ${haceCuanto(guardadoEn)}: pueden no estar al día.`}
        />
      )}
      <FlatList
        data={avisos}
        keyExtractor={(a) => a.id}
        refreshing={cargando}
        onRefresh={cargar}
        contentContainerStyle={{ gap: espacio.s, paddingBottom: espacio.l }}
        ListEmptyComponent={
          <Texto secundario>No hay avisos vigentes. Todas las líneas funcionan normal.</Texto>
        }
        renderItem={({ item }) => {
          const g = GRAVEDAD[item.gravedad];
          const col = coloresGravedad(item.gravedad);
          return (
            <Link href={`/aviso/${item.id}`} asChild>
              <Pressable
                style={StyleSheet.flatten([
                  styles.item,
                  { borderLeftColor: col.color, backgroundColor: c.tarjeta, borderColor: c.borde },
                ])}
              >
                <View style={[styles.etiqueta, { backgroundColor: col.fondo }]}>
                  <Texto variante="etiqueta" style={{ color: col.color }}>{g.texto.toUpperCase()}</Texto>
                </View>
                <Texto variante="subtitulo">{item.titulo}</Texto>
                <Texto>
                  Líneas: {item.lineaIds.map((id) => lineas.get(id)?.numero ?? id).join(', ')}
                </Texto>
                <Texto variante="secundario" secundario>
                  Desde {formatearFechaHora(item.desde)}
                  {item.hasta ? ` hasta ${formatearFechaHora(item.hasta)}` : ' · sin fecha de fin'}
                  {item.videoUrl ? ' · con video' : ''}
                </Texto>
              </Pressable>
            </Link>
          );
        }}
      />
    </View>
  );
}

// ESTILO: solo distribución; los colores salen de useColores()
const styles = StyleSheet.create({
  container: { flex: 1, padding: espacio.l, gap: espacio.s },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: espacio.xl, gap: espacio.m },
  item: { padding: espacio.l, borderWidth: 1, borderLeftWidth: 6, borderRadius: radio.m, gap: espacio.xs },
  etiqueta: { alignSelf: 'flex-start', borderRadius: radio.s, paddingHorizontal: espacio.s, paddingVertical: 2 },
});