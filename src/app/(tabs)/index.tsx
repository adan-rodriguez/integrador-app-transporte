import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import MapaParadas from '@/componentes/MapaParadas';
import { useUbicacion } from '@/hooks/useUbicacion';
import { obtenerAvisos, obtenerLineas, obtenerParadas, obtenerParadasCercanas } from '@/servicios/api';
import { useSesion } from '@/sesion';
import { Aviso, Gravedad, Linea, Parada } from '@/tipos';

import { Boton, ChipLinea, Tarjeta, Texto } from '@/componentes/ui';
import { espacio, radio, useColores } from '@/tema';

const TEXTO_GRAVEDAD: Record<Gravedad, string> = {
  suspension: 'Suspensión',
  desvio: 'Desvío',
  informativo: 'Informativo',
};

// Cuántos avisos mostrar en Inicio antes del "Ver todos"
const MAX_AVISOS = 3;

export default function InicioScreen() {
  const c = useColores();
  const { usuario } = useSesion();
  const { posicion } = useUbicacion();

  const [cercanas, setCercanas] = useState<Parada[]>([]);
  const [paradas, setParadas] = useState<Map<string, Parada>>(new Map());
  const [lineas, setLineas] = useState<Map<string, Linea>>(new Map());
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorAvisos, setErrorAvisos] = useState(false);

  // Datos para armar favoritas y avisos: todas las paradas y líneas (por id) y los avisos vigentes
  useEffect(() => {
    Promise.all([
      obtenerParadas().catch(() => null),
      obtenerLineas().catch(() => null),
      obtenerAvisos().catch(() => null),
    ]).then(([resParadas, resLineas, resAvisos]) => {
      if (resParadas) setParadas(new Map(resParadas.datos.map((p) => [p.id, p])));
      if (resLineas) setLineas(new Map(resLineas.datos.map((l) => [l.id, l])));
      if (resAvisos) setAvisos(resAvisos.datos);
      else setErrorAvisos(true);
      setCargando(false);
    });
  }, []);

  useEffect(() => {
    if (!posicion) return;
    // TODO: definir con el equipo si el mapa de Inicio muestra solo las cercanas (500 m) o todas las paradas
    obtenerParadasCercanas(posicion.coords.latitude, posicion.coords.longitude, 500)
      .then((res) => setCercanas(res.datos))
      .catch(() => { }); // si falla, el mapa queda sin marcadores
  }, [posicion]);

  // Las favoritas se leen de la sesión: si se agrega o quita una estrella, Inicio se actualiza solo
  const favoritas = (usuario?.paradasFavoritas ?? [])
    .map((id) => paradas.get(id))
    .filter((p): p is Parada => p !== undefined);

  function coloresGravedad(g: Gravedad) {
    if (g === 'suspension') return { color: c.suspension, fondo: c.suspensionFondo };
    if (g === 'desvio') return { color: c.desvio, fondo: c.desvioFondo };
    return { color: c.informativo, fondo: c.informativoFondo };
  }

  return (
    <ScrollView
      style={{ backgroundColor: c.fondo }}
      contentContainerStyle={{ padding: espacio.l, gap: espacio.m, paddingBottom: espacio.xl * 2 }}
    >
      <Texto variante="titulo">Transporte Público Paraná</Texto>
      <Boton titulo="Escanear parada" variante="primario" onPress={() => router.push('/parada/escanear')} />

      {/* ---------- Paradas favoritas ---------- */}
      <Texto variante="subtitulo" style={styles.subtitulo}>Tus paradas (Favoritos)</Texto>
      {!usuario ? (
        <Tarjeta style={{ gap: espacio.s }}>
          <Texto secundario>Ingresá para guardar tus paradas favoritas y verlas acá.</Texto>
          <Boton titulo="Ingresar" onPress={() => router.push('/ingresar')} />
        </Tarjeta>
      ) : cargando ? (
        <ActivityIndicator color={c.acento} />
      ) : favoritas.length === 0 ? (
        <Texto secundario>Tocá la estrella en una parada para tenerla siempre a mano.</Texto>
      ) : (
        favoritas.map((p) => (
          <Link key={p.id} href={`/parada/${p.id}`} asChild>
            <Pressable
              style={StyleSheet.flatten([
                styles.fila,
                { backgroundColor: c.tarjeta, borderColor: c.borde },
              ])}
            >
              <Texto variante="cuerpoNegrita">{p.nombre}</Texto>
              <View style={styles.chips}>
                {p.lineaIds.map((id) => {
                  const l = lineas.get(id);
                  return l ? (
                    <ChipLinea key={id} numero={l.numero} color={l.color} />
                  ) : (
                    <Texto key={id} variante="secundario" secundario>{id}</Texto>
                  );
                })}
              </View>
            </Pressable>
          </Link>
        ))
      )}

      {/* ---------- Avisos de hoy ---------- */}
      <Texto variante="subtitulo" style={styles.subtitulo}>Avisos de hoy</Texto>
      {cargando ? (
        <ActivityIndicator color={c.acento} />
      ) : errorAvisos ? (
        <Texto secundario>No pudimos cargar los avisos.</Texto>
      ) : avisos.length === 0 ? (
        <Texto secundario>No hay avisos vigentes. Todas las líneas funcionan normal.</Texto>
      ) : (
        <>
          {avisos.slice(0, MAX_AVISOS).map((a) => {
            const col = coloresGravedad(a.gravedad);
            return (
              <Link key={a.id} href={`/aviso/${a.id}`} asChild>
                <Pressable style={StyleSheet.flatten([styles.aviso, { backgroundColor: col.fondo }])}>
                  <Texto variante="etiqueta" style={{ color: col.color }}>
                    {TEXTO_GRAVEDAD[a.gravedad].toUpperCase()} · L
                    {a.lineaIds.map((id) => lineas.get(id)?.numero ?? id).join(' L')}
                  </Texto>
                  <Texto variante="cuerpoNegrita" style={{ color: col.color }}>{a.titulo}</Texto>
                </Pressable>
              </Link>
            );
          })}
          {avisos.length > MAX_AVISOS && (
            <Boton titulo={`Ver los ${avisos.length} avisos`} onPress={() => router.push('/avisos')} />
          )}
        </>
      )}

      {/* ---------- Mapa ---------- */}
      <Texto variante="subtitulo" style={styles.subtitulo}>Mapa de paradas cerca tuyo</Texto>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  subtitulo: { marginTop: espacio.s },
  fila: { padding: espacio.m, borderWidth: 1, borderRadius: radio.m, gap: espacio.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.xs },
  aviso: { padding: espacio.m, borderRadius: radio.m, gap: 2 },
  mapa: { height: 240, borderRadius: radio.m, overflow: 'hidden', borderWidth: 1 },
});