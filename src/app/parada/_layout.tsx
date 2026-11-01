import { Stack } from "expo-router";
import { useColores } from "@/tema";

export default function LayoutParadas() {
  const colores = useColores();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colores.fondo },
        headerTintColor: colores.texto,
        contentStyle: { backgroundColor: colores.fondo },
      }}
    >
      <Stack.Screen name="escanear" options={{ title: "Escanear QR" }} />
      <Stack.Screen name="[id]/index" options={{ title: "Detalle de parada" }} />
      <Stack.Screen name="[id]/rumbo" options={{ title: "Cómo llego" }} />
      
    </Stack>
  );
}