// Layout raíz: envuelve la app con la sesión y define la navegación principal
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";

import Desbloqueo from "@/componentes/desbloqueo";
import { SesionProvider, useSesion } from "@/sesion";
import { useColores } from "@/tema";

function Contenido() {
  const { estado } = useSesion();
  const colores = useColores();

  if (estado === "iniciando") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: colores.fondo,
        }}
      >
        <ActivityIndicator color={colores.acento} />
      </View>
    );
  }

  // Con un token guardado, antes de entrar se pide la huella o el rostro.
  if (estado === "bloqueada") return <Desbloqueo />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colores.fondo },
        headerTintColor: colores.texto,
        contentStyle: { backgroundColor: colores.fondo },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="linea/[id]" options={{ title: "Detalle de Línea" }} />
      <Stack.Screen name="parada/[id]" options={{ title: "Detalle de Parada" }} />
      <Stack.Screen name="aviso/[id]" options={{ title: "Aviso" }} />
      <Stack.Screen
        name="reporte/[id_linea]/[id_parada]"
        options={{ title: "Reportar Demora", presentation: "modal" }}
      />
      <Stack.Screen name="ingresar" options={{ title: "Ingresar" }} />
      <Stack.Screen name="registro" options={{ title: "Crear cuenta" }} />
    </Stack>
  );
}

export default function LayoutRaiz() {
  return (
    <SesionProvider>
      <StatusBar style="auto" />
      <Contenido />
    </SesionProvider>
  );
}
