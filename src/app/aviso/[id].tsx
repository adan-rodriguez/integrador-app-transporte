import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import MapaRecorrido from '@/componentes/MapaRecorrido';
import { obtenerAviso, obtenerLineas } from '@/servicios/api';
import { Aviso, Linea } from '@/tipos';
import { formatearFechaHora, haceCuanto } from '@/utilidades/fechas';

import { descargarVideo, videoGuardado } from '@/servicios/videos';

const GRAVEDAD = {
  suspension: { texto: 'Suspensión', color: '#b00020' },
  desvio: { texto: 'Desvío', color: '#b35c00' },
  informativo: { texto: 'Informativo', color: '#1a5fb4' },
} as const;

export default function AvisoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardadoEn, setGuardadoEn] = useState<Date | null>(null);

  const [fuente, setFuente] = useState<string | null>(null); // local o de la API
  const [enTelefono, setEnTelefono] = useState(false);

  // El reproductor se crea siempre (los hooks no pueden ir después de un return).
  // Mientras no hay video, la fuente es null y no reproduce nada.
  const player = useVideoPlayer(fuente, (p) => {
    p.loop = false;
  });

   useEffect(() => {
    Promise.all([obtenerAviso(id), obtenerLineas().catch(() => null)]).then(([resAviso, resLineas]) => {
      if ('datos' in resAviso) {
        setAviso(resAviso.datos);
        setGuardadoEn(resAviso.guardadoEn ?? null);

        const a = resAviso.datos;
        const local = videoGuardado(a.id);
        if (local) {
          // Ya está en el teléfono: se reproduce desde el archivo, con o sin red
          setFuente(local);
          setEnTelefono(true);
        } else if (a.videoUrl) {
          // Primera vez: se ve desde la API y se baja en segundo plano para la próxima
          setFuente(a.videoUrl);
          descargarVideo(a.id, a.videoUrl)
            .then(() => setEnTelefono(true))
            .catch(() => {}); // sin red no se puede bajar; se intentará la próxima vez
        }
      } else {
        setError(resAviso.error.mensaje);
      }
      if (resLineas) setLineas(resLineas.datos);
      setCargando(false);
    });
  }, [id]);

  if (cargando) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!aviso) {
    return (
      <View style={styles.center}>
        <Text>{error ?? 'No encontramos este aviso.'}</Text>
      </View>
    );
  }

  const g = GRAVEDAD[aviso.gravedad];
  const afectadas = lineas.filter((l) => aviso.lineaIds.includes(l.id));

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Stack.Screen options={{ title: g.texto }} />

      {guardadoEn && (
        <Text style={styles.avisoSinRed}>
           {enTelefono ? 'Guardado en el teléfono: se puede ver sin conexión.' : 'Guardando para ver sin conexión…'}
        </Text>
      )}

      <View style={{ gap: 4 }}>
        <Text style={{ color: g.color, fontWeight: '700' }}>{g.texto.toUpperCase()}</Text>
        <Text style={styles.titulo}>{aviso.titulo}</Text>
        <Text style={{ fontSize: 13 }}>
          Desde {formatearFechaHora(aviso.desde)}
          {aviso.hasta ? ` hasta ${formatearFechaHora(aviso.hasta)}` : ' · sin fecha de fin'}
        </Text>
      </View>

      <Text style={{ fontSize: 16, lineHeight: 22 }}>{aviso.detalle}</Text>

      <View style={{ gap: 6 }}>
        <Text style={styles.subtitulo}>Líneas afectadas</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {afectadas.map((l) => (
            <Link key={l.id} href={`/linea/${l.id}`} asChild>
              <Pressable style={StyleSheet.flatten([styles.chip, { borderColor: l.color }])}>
                <Text style={{ fontWeight: '600' }}>Línea {l.numero}</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      </View>

      {aviso.videoUrl && (
        <View style={{ gap: 6 }}>
          <Text style={styles.subtitulo}>Video del desvío</Text>
          <VideoView player={player} style={styles.video} nativeControls />
        </View>
      )}

      {aviso.trazadoAlternativo && aviso.trazadoAlternativo.length > 1 && (
        <View style={{ gap: 6 }}>
          <Text style={styles.subtitulo}>Recorrido alternativo</Text>
          <View style={styles.mapa}>
            <MapaRecorrido trazado={aviso.trazadoAlternativo} paradas={[]} color={g.color} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  titulo: { fontSize: 22, fontWeight: 'bold' },
  subtitulo: { fontSize: 17, fontWeight: '600' },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 2, borderRadius: 16 },
  video: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', borderRadius: 8 },
  mapa: { height: 260, borderRadius: 10, overflow: 'hidden' },
  avisoSinRed: { padding: 8, borderRadius: 8, backgroundColor: '#fff3cd', color: '#5c4400' },
});