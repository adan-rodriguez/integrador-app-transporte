import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import MapaRecorrido from '@/componentes/MapaRecorrido';
import { obtenerAviso, obtenerLineas } from '@/servicios/api';
import { Aviso, Gravedad, Linea } from '@/tipos';
import { formatearFechaHora } from '@/utilidades/fechas';

import { descargarVideo, videoGuardado } from '@/servicios/videos';

// ESTILO: componentes y valores del tema
import { Cargando, Texto } from '@/componentes/ui';
import { espacio, radio, textoSobre, useColores } from '@/tema';

// ESTILO: acá queda solo el texto; el color sale del tema (cambia en modo oscuro)
const GRAVEDAD = {
  suspension: { texto: 'Suspensión' },
  desvio: { texto: 'Desvío' },
  informativo: { texto: 'Informativo' },
} as const;

export default function AvisoDetailScreen() {
  const c = useColores(); // ESTILO: colores según modo claro/oscuro

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

  // ESTILO: color de texto y de fondo para cada gravedad
  function coloresGravedad(gr: Gravedad) {
    if (gr === 'suspension') return { color: c.suspension, fondo: c.suspensionFondo };
    if (gr === 'desvio') return { color: c.desvio, fondo: c.desvioFondo };
    return { color: c.informativo, fondo: c.informativoFondo };
  }

  if (cargando) return <Cargando />;
  if (!aviso) {
    return (
      <View style={[styles.center, { backgroundColor: c.fondo }]}>
        <Texto>{error ?? 'No encontramos este aviso.'}</Texto>
      </View>
    );
  }

  const g = GRAVEDAD[aviso.gravedad];
  const col = coloresGravedad(aviso.gravedad);
  const afectadas = lineas.filter((l) => aviso.lineaIds.includes(l.id));

  return (
    <ScrollView
      style={{ backgroundColor: c.fondo }}
      contentContainerStyle={{ padding: espacio.l, gap: espacio.m, paddingBottom: espacio.xl * 2 }}
    >
      <Stack.Screen options={{ title: g.texto }} />

      {guardadoEn && (
        <View style={[styles.avisoGuardado, { backgroundColor: c.acentoSuave }]}>
          <Texto variante="secundario" style={{ color: c.acento }}>
             {enTelefono ? 'Guardado en el teléfono: se puede ver sin conexión.' : 'Guardando para ver sin conexión…'}
          </Texto>
        </View>
      )}

      <View style={{ gap: espacio.xs }}>
        <View style={[styles.etiqueta, { backgroundColor: col.fondo }]}>
          <Texto variante="etiqueta" style={{ color: col.color }}>{g.texto.toUpperCase()}</Texto>
        </View>
        <Texto variante="titulo">{aviso.titulo}</Texto>
        <Texto variante="secundario" secundario>
          Desde {formatearFechaHora(aviso.desde)}
          {aviso.hasta ? ` hasta ${formatearFechaHora(aviso.hasta)}` : ' · sin fecha de fin'}
        </Texto>
      </View>

      <Texto style={{ lineHeight: 24 }}>{aviso.detalle}</Texto>

      <View style={{ gap: espacio.s }}>
        <Texto variante="subtitulo">Líneas afectadas</Texto>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s }}>
          {afectadas.map((l) => (
            <Link key={l.id} href={`/linea/${l.id}`} asChild>
              <Pressable style={StyleSheet.flatten([styles.chip, { backgroundColor: l.color }])}>
                <Texto variante="cuerpoNegrita" style={{ color: textoSobre(l.color) }}>Línea {l.numero}</Texto>
              </Pressable>
            </Link>
          ))}
        </View>
      </View>

      {aviso.videoUrl && (
        <View style={{ gap: espacio.s }}>
          <Texto variante="subtitulo">Video del desvío</Texto>
          <VideoView player={player} style={styles.video} nativeControls />
        </View>
      )}

      {aviso.trazadoAlternativo && aviso.trazadoAlternativo.length > 1 && (
        <View style={{ gap: espacio.s }}>
          <Texto variante="subtitulo">Recorrido alternativo</Texto>
          <View style={[styles.mapa, { borderColor: c.borde }]}>
            <MapaRecorrido trazado={aviso.trazadoAlternativo} paradas={[]} color={col.color} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ESTILO: solo distribución; los colores salen de useColores()
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: espacio.xl },
  etiqueta: { alignSelf: 'flex-start', borderRadius: radio.s, paddingHorizontal: espacio.s, paddingVertical: 2 },
  chip: { paddingVertical: espacio.s, paddingHorizontal: espacio.m, borderRadius: radio.m },
  // El fondo negro del video se deja a propósito: es el "marco" del reproductor en ambos modos
  video: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', borderRadius: radio.m },
  mapa: { height: 260, borderRadius: radio.m, overflow: 'hidden', borderWidth: 1 },
  avisoGuardado: { padding: espacio.m, borderRadius: radio.m },
});