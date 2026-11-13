import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";

import MapaParadas from "@/componentes/MapaParadas";
import { useUbicacion } from "@/hooks/useUbicacion";
import { obtenerParadas, obtenerParadasCercanas } from "@/servicios/api";
import { Parada } from "@/tipos";
import { formatearDistancia } from "@/utilidades/coordenadas";

import { guardarRadioParadas, guardarVistaParadas, leerRadioParadas, leerVistaParadas } from "@/servicios/preferencias";
import { haceCuanto } from "@/utilidades/fechas";

// ESTILO: componentes y valores del tema
import { BannerSinRed, Boton, Cargando, Selector, Texto } from "@/componentes/ui";
import { espacio, fuentes, radio, useColores } from "@/tema";

type Fila = Parada & { distanciaMetros?: number };

// TODO: permitir un radio manual (TextInput numérico, entre 1 y 50000 m, que es el límite de la API)
const RADIOS: (number | null)[] = [null, 100, 300, 500];

export default function Paradas() {
  const c = useColores(); // ESTILO: colores según modo claro/oscuro

  const { estado, posicion, reintentar } = useUbicacion();
  const [paradas, setParadas] = useState<Fila[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radio_, setRadio] = useState<number | null>(leerRadioParadas);
  const [vista, setVista] = useState<"lista" | "mapa">(leerVistaParadas);
  const [busqueda, setBusqueda] = useState("");
  const [q, setQ] = useState("");
  const [guardadoEn, setGuardadoEn] = useState<Date | null>(null);




  const conUbicacion = estado === "concedido" && posicion !== null;

  useEffect(() => {
    const t = setTimeout(() => setQ(busqueda.trim()), 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  useEffect(() => {
    if (estado === "cargando") return;
    setBuscando(true);
    setError(null);
    const pedido =
      conUbicacion && radio_ !== null
        ? obtenerParadasCercanas(posicion.coords.latitude, posicion.coords.longitude, radio_, q)
        : obtenerParadas(q);
    pedido
      .then((res) => {
        setParadas(res.datos);
        setGuardadoEn(res.guardadoEn);
      })
      .catch((e) => setError(e.message))
      .finally(() => setBuscando(false));
  }, [estado, posicion, radio_, q]);


  if (estado === "cargando") return <Cargando />;

  return (
    <View style={[styles.pantalla, { backgroundColor: c.fondo }]}>
      {!conUbicacion && (
        <Pressable onPress={reintentar} style={[styles.avisoUbicacion, { backgroundColor: c.acentoSuave }]}>
          <Texto variante="secundario" style={{ color: c.acento }}>
            {estado === "denegado" ? "Sin permiso de ubicación." : "No pudimos obtener tu ubicación."}{" "}
            Mostramos todas. Tocá para reintentar.
          </Texto>
        </Pressable>
      )}


      <TextInput
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder="Buscar parada por nombre o calle"
        placeholderTextColor={c.textoSecundario}
        autoCorrect={false}
        clearButtonMode="while-editing"
        style={[
          styles.buscador,
          { backgroundColor: c.tarjeta, borderColor: c.borde, color: c.texto, fontFamily: fuentes.regular },
        ]}
      />

      <Selector
        opciones={[
          { valor: "lista", texto: "Lista" },
          { valor: "mapa", texto: "Mapa" },
        ]}
        valor={vista}
        onCambiar={(v) => { setVista(v); guardarVistaParadas(v); }}
      />

      <View style={{ flexDirection: "row", gap: espacio.s }}>
        {RADIOS.map((r) => {
          const activo = conUbicacion ? radio_ === r : r === null;
          return (
            <Pressable
              key={String(r)}
              disabled={!conUbicacion && r !== null}
              onPress={() => { setRadio(r); guardarRadioParadas(r); }}
              style={[
                styles.chip,
                {
                  opacity: !conUbicacion && r !== null ? 0.4 : 1,
                  backgroundColor: activo ? c.acento : c.tarjeta,
                  borderColor: activo ? c.acento : c.borde,
                },
              ]}
            >
              <Texto variante="secundario" style={{ color: activo ? c.textoSobreAcento : c.texto }}>
                {r === null ? "Todas" : `${r} m`}
              </Texto>
            </Pressable>
          );
        })}
      </View>


      {error && <Texto style={{ color: c.error }}>{error}</Texto>}
      {guardadoEn && (
        <BannerSinRed mensaje={`Sin conexión. Mostramos lo guardado ${haceCuanto(guardadoEn)}.`} />
      )}

      {vista === "lista" ? (
        <FlatList
          data={paradas}
          keyExtractor={(p) => p.id}
          refreshing={buscando}
          onRefresh={reintentar}
          ListEmptyComponent={
            !buscando ? <Texto secundario>{q ? `No encontramos paradas con "${q}".` : "No hay paradas en ese radio."}</Texto> : undefined
          }
          renderItem={({ item }) => (
            <Link href={`/parada/${item.id}`} asChild>
              <Pressable style={StyleSheet.flatten([styles.fila, { borderColor: c.borde }])}>
                <Texto variante="cuerpoNegrita">{item.nombre}</Texto>
                <Texto variante="secundario" secundario>
                  {item.distanciaMetros !== undefined ? `${formatearDistancia(item.distanciaMetros)} · ` : ""}
                  {item.lineaIds.join(", ")}
                </Texto>
              </Pressable>
            </Link>
          )}
        />
      ) : (
        <View style={[styles.mapa, { borderColor: c.borde }]}>
          <MapaParadas
            paradas={paradas}
            centro={
              conUbicacion && posicion
                ? { latitud: posicion.coords.latitude, longitud: posicion.coords.longitude }
                : null
            }
          />
        </View>
      )}

      <Link href="/parada/escanear" asChild>
        <Boton titulo="Escanear QR de una parada" />
      </Link>
    </View>
  );
}

// ESTILO: solo distribución; los colores salen de useColores()
const styles = StyleSheet.create({
  pantalla: { flex: 1, padding: espacio.l, gap: espacio.m },
  avisoUbicacion: { padding: espacio.m, borderRadius: radio.m },
  buscador: { borderWidth: 1, borderRadius: radio.m, paddingHorizontal: espacio.m, height: 48, fontSize: 16 },
  chip: { paddingVertical: espacio.s, paddingHorizontal: espacio.m, borderRadius: 16, borderWidth: 1 },
  fila: { paddingVertical: espacio.m, borderBottomWidth: 1, gap: 2 },
  mapa: { flex: 1, borderRadius: radio.m, overflow: "hidden", borderWidth: 1 },
});