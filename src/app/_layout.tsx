import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  // TODO: Agregar inicialización de base de datos SQLite aquí.

  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen
          name="login"
          options={{ headerShown: false, title: "Ingresar" }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="linea/[id]"
          options={{ title: "Detalle de Línea" }}
        />
        <Stack.Screen
          name="parada/[id]"
          options={{ title: "Detalle de Parada" }}
        />
        <Stack.Screen name="aviso/[id]" options={{ title: "Aviso" }} />
        <Stack.Screen
          name="reporte/[id_linea]/[id_parada]"
          options={{ title: "Reportar Demora", presentation: "modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
