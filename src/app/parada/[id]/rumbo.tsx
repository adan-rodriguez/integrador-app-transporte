import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, View } from "react-native";

import FlechaRumbo from "@/componentes/FlechaRumbo";
import { useRumbo } from "@/hooks/useRumbo";
import { obtenerParada } from "@/servicios/api";
import { Parada } from "@/tipos";
import { formatearDistancia } from "@/utilidades/coordenadas";

// ESTILO: componentes y valores del tema
import { Boton, Cargando, Texto } from "@/componentes/ui";
import { espacio, fuentes, useColores } from "@/tema";

export default function Rumbo() {
  const c = useColores(); // ESTILO: colores según modo claro/oscuro

  const { id } = useLocalSearchParams<{ id: string }>();
  const [parada, setParada] = useState<Parada | null>(null);
  const { estado, hayBrujula, angulo, distancia } = useRumbo(parada?.coordenadas ?? null);

  useEffect(() => {
    obtenerParada(id).then((res) => {
      if ("datos" in res) setParada(res.datos);
    });
  }, [id]);

  function abrirMapas() {
    if (!parada) return;
    const { latitud, longitud } = parada.coordenadas;
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${latitud},${longitud}&travelmode=walking`
    );
  }

  if (!parada || estado === "cargando") return <Cargando />;

  const llegaste = distancia !== null && distancia < 20;

  return (
    <View
      style={{
        flex: 1,
        padding: espacio.xl,
        alignItems: "center",
        justifyContent: "center",
        gap: espacio.xl,
        backgroundColor: c.fondo,
      }}
    >
      <Texto variante="titulo" style={{ textAlign: "center" }}>{parada.nombre}</Texto>

      {estado !== "concedido" ? (
        <Texto secundario style={{ textAlign: "center" }}>Necesitamos tu ubicación para guiarte hasta la parada.</Texto>
      ) : llegaste ? (
        <Texto variante="titulo" style={{ color: c.exito }}>Ya estás en la parada</Texto>
      ) : (
        <>
          {hayBrujula ? (
            <FlechaRumbo angulo={angulo} tamano={160} color={c.acento} />
          ) : (
            <Texto secundario>Tu teléfono no tiene brújula.</Texto>
          )}
          <Texto style={{ fontFamily: fuentes.negrita, fontSize: 40, fontVariant: ["tabular-nums"] }}>
            {formatearDistancia(distancia ?? 0)}m
          </Texto>
          <Texto secundario>Caminá hacia donde apunta la flecha</Texto>
        </>
      )}

      <Boton titulo="Abrir en la app de mapas" onPress={abrirMapas} style={{ alignSelf: "stretch" }} />
    </View>
  );
}