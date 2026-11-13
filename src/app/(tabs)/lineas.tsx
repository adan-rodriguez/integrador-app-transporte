import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { obtenerAvisos, obtenerLineas } from '@/servicios/api';
import { Gravedad, Linea } from '@/tipos';
import { haceCuanto } from '@/utilidades/fechas';

// ESTILO: componentes y valores del tema
import { BannerSinRed, Boton, Cargando, Texto } from '@/componentes/ui';
import { espacio, radio, useColores } from '@/tema';

export default function LineasScreen() {
  const c = useColores(); // ESTILO: colores según modo claro/oscuro

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

  if (cargando && lineas.length === 0) return <Cargando />;

  if (error && lineas.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: c.fondo }]}>
        <Texto style={{ textAlign: 'center' }}>{error}</Texto>
        <Boton titulo="Reintentar" onPress={cargar} />
      </View>
    );
  }

  // ESTILO: etiqueta de estado (fondo suave + texto del mismo tono)
  function Etiqueta({ texto, color, fondo }: { texto: string; color: string; fondo: string }) {
    return (
      <View style={[styles.etiqueta, { backgroundColor: fondo }]}>
        <Texto variante="etiqueta" style={{ color }}>{texto}</Texto>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.fondo }]}>
      {guardadoEn && (
        <BannerSinRed mensaje={`Sin conexión. Mostramos lo guardado ${haceCuanto(guardadoEn)}.`} />
      )}
      <FlatList
        data={lineas}
        keyExtractor={(item) => item.id}
        refreshing={cargando}
        onRefresh={cargar}
        contentContainerStyle={{ gap: espacio.s, paddingBottom: espacio.l }}
        ListEmptyComponent={<Texto secundario>No hay líneas cargadas.</Texto>}
        renderItem={({ item }) => (
          <Link href={`/linea/${item.id}`} asChild>
            <Pressable
              style={StyleSheet.flatten([
                styles.item,
                { borderLeftColor: item.color, backgroundColor: c.tarjeta, borderColor: c.borde },
              ])}
            >
              <View style={styles.fila}>
                <Texto variante="subtitulo">Línea {item.numero}</Texto>
                {!item.activa ? (
                  <Etiqueta texto="Sin servicio" color={c.suspension} fondo={c.suspensionFondo} />
                ) : estados.get(item.id) === 'suspension' ? (
                  <Etiqueta texto="Suspendida" color={c.suspension} fondo={c.suspensionFondo} />
                ) : estados.get(item.id) === 'desvio' ? (
                  <Etiqueta texto="Desvío" color={c.desvio} fondo={c.desvioFondo} />
                ) : null}
              </View>
              <Texto>{item.nombre}</Texto>
              <Texto variante="secundario" secundario>{item.empresa}</Texto>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}

// ESTILO: solo distribución; los colores salen de useColores()
const styles = StyleSheet.create({
  container: { flex: 1, padding: espacio.l, gap: espacio.s },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: espacio.xl, gap: espacio.m },
  item: { padding: espacio.l, borderWidth: 1, borderLeftWidth: 8, borderRadius: radio.m, gap: 2 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  etiqueta: { borderRadius: radio.s, paddingHorizontal: espacio.s, paddingVertical: 2 },
});