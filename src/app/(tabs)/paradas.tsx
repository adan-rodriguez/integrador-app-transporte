import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";

import { useUbicacion } from "@/hooks/useUbicacion";
import { obtenerParadas, obtenerParadasCercanas } from "@/servicios/api";
import { Parada } from "@/tipos";
import MapaParadas from "@/componentes/MapaParadas";
import { formatearDistancia } from "@/utilidades/coordenadas";

type Fila = Parada & { distanciaMetros?: number };

// TODO: permitir un radio manual (TextInput numérico, entre 1 y 50000 m, que es el límite de la API)
const RADIOS: (number | null)[] = [null, 100, 300, 500];

export default function Paradas() {
  const { estado, posicion, reintentar } = useUbicacion();
  const [radio, setRadio] = useState<number | null>(300);
  const [paradas, setParadas] = useState<Fila[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<"lista" | "mapa">("lista");
  const [busqueda, setBusqueda] = useState("");
  const [q, setQ] = useState("");




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
      conUbicacion && radio !== null
        ? obtenerParadasCercanas(posicion.coords.latitude, posicion.coords.longitude, radio, q)
        : obtenerParadas(q);
    pedido
      .then((res) => setParadas(res.datos))
      .catch((e) => setError(e.message))
      .finally(() => setBuscando(false));
  }, [estado, posicion, radio, q]);


  if (estado === "cargando") return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      {!conUbicacion && (
        <Pressable onPress={reintentar} style={{ padding: 10, borderWidth: 1, borderRadius: 8 }}>
          <Text>
            {estado === "denegado" ? "Sin permiso de ubicación." : "No pudimos obtener tu ubicación."}{" "}
            Mostramos todas. Tocá para reintentar.
          </Text>
        </Pressable>
      )}


      <TextInput
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder="Buscar parada por nombre o calle"
        autoCorrect={false}
        clearButtonMode="while-editing"
        style={{ borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 44 }}
      />
      <View style={{ flexDirection: "row", borderWidth: 1, borderRadius: 10, overflow: "hidden" }}>
        {(["lista", "mapa"] as const).map((v) => (
          <Pressable
            key={v}
            onPress={() => setVista(v)}
            style={{ flex: 1, padding: 10, backgroundColor: vista === v ? "#ddd" : "transparent" }}
          >
            <Text style={{ textAlign: "center" }}>{v === "lista" ? "Lista" : "Mapa"}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        {RADIOS.map((r) => {
          const activo = conUbicacion ? radio === r : r === null;
          return (
            <Pressable
              key={String(r)}
              disabled={!conUbicacion && r !== null}
              onPress={() => setRadio(r)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 16,
                borderWidth: 1,
                opacity: !conUbicacion && r !== null ? 0.4 : 1,
                backgroundColor: activo ? "#ddd" : "transparent",
              }}
            >
              <Text>{r === null ? "Todas" : `${r} m`}</Text>
            </Pressable>
          );
        })}
      </View>
      

      {error && <Text>{error}</Text>}

      {vista === "lista" ? (
        <FlatList
          data={paradas}
          keyExtractor={(p) => p.id}
          refreshing={buscando}
          onRefresh={reintentar}
          ListEmptyComponent={
            !buscando ? <Text>{q ? `No encontramos paradas con "${q}".` : "No hay paradas en ese radio."}</Text> : undefined
          }
          renderItem={({ item }) => (
            <Link href={`/parada/${item.id}`} asChild>
              <Pressable style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: "#ddd" }}>
                <Text style={{ fontWeight: "600" }}>{item.nombre}</Text>
                <Text>
                  {item.distanciaMetros !== undefined ? `${formatearDistancia(item.distanciaMetros)} · ` : ""}
                  {item.lineaIds.join(", ")}
                </Text>
              </Pressable>
            </Link>
          )}
        />
      ) : (
        <View style={{ flex: 1, borderRadius: 10, overflow: "hidden" }}>
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
        <Pressable style={{ padding: 14, borderWidth: 1, borderRadius: 10 }}>
          <Text style={{ textAlign: "center" }}>Escanear QR de una parada</Text>
        </Pressable>
      </Link>
    </View>
  );
}