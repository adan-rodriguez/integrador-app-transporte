import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, Text, View } from "react-native";

import FlechaRumbo from "@/componentes/FlechaRumbo";
import { useRumbo } from "@/hooks/useRumbo";
import { obtenerParada } from "@/servicios/api";
import { Parada } from "@/tipos";

export default function Rumbo() {
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

  if (!parada || estado === "cargando") return <ActivityIndicator style={{ flex: 1 }} />;

  const llegaste = distancia !== null && distancia < 20;

  return (
    <View style={{ flex: 1, padding: 24, alignItems: "center", justifyContent: "center", gap: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: "600", textAlign: "center" }}>{parada.nombre}</Text>

      {estado !== "concedido" ? (
        <Text style={{ textAlign: "center" }}>Necesitamos tu ubicación para guiarte hasta la parada.</Text>
      ) : llegaste ? (
        <Text style={{ fontSize: 22, fontWeight: "600" }}>Ya estás en la parada</Text>
      ) : (
        <>
          {hayBrujula ? (
            <FlechaRumbo angulo={angulo} tamano={160} />
          ) : (
            <Text>Tu teléfono no tiene brújula.</Text>
          )}
          <Text style={{ fontSize: 36, fontWeight: "700" }}>{Math.round(distancia ?? 0)} m</Text>
          <Text>Caminá hacia donde apunta la flecha</Text>
        </>
      )}

      <Pressable onPress={abrirMapas} style={{ padding: 14, borderWidth: 1, borderRadius: 10, alignSelf: "stretch" }}>
        <Text style={{ textAlign: "center" }}>Abrir en la app de mapas</Text>
      </Pressable>
    </View>
  );
}