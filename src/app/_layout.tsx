// Layout raíz: envuelve la app con la sesión y define la navegación principal
import {
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
} from "@expo-google-fonts/atkinson-hyperlegible";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";

import Desbloqueo from "@/componentes/desbloqueo";
import { SesionProvider, useSesion } from "@/sesion";
import { useColores } from "@/tema";

import EstadoRed from "@/componentes/EstadoRed";

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
    <View style={{ flex: 1 }}>
      <EstadoRed />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colores.fondo },
          headerTintColor: colores.texto,
          headerTitleStyle: { fontFamily: "AtkinsonHyperlegible_700Bold" },
          contentStyle: { backgroundColor: colores.fondo },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="linea/[id]" options={{ title: "Detalle de Línea" }} />
        <Stack.Screen name="parada" options={{ headerShown: false }} />
        <Stack.Screen name="aviso/[id]" options={{ title: "Aviso" }} />
        <Stack.Screen
          name="reporte/[id_linea]/[id_parada]"
          options={{ title: "Reportar Demora", presentation: "modal" }}
        />
        <Stack.Screen name="ingresar" options={{ title: "Ingresar" }} />
        <Stack.Screen name="registro" options={{ title: "Crear cuenta" }} />
      </Stack>
    </View>
  );
}

export default function LayoutRaiz() {
  // Los archivos de la fuente vienen de @expo-google-fonts;
  // la carga la hace expo-font, el módulo oficial que usa el proyecto.
  const [fuentesListas] = useFonts({
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
  });

  // Hasta que la fuente esté lista no dibujamos nada (dura milisegundos).
  if (!fuentesListas) return null;

  return (
    <SesionProvider>
      <StatusBar style="auto" />
      <Contenido />
    </SesionProvider>
  );
}