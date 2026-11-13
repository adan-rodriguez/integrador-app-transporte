import { useNetworkState } from "expo-network";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cantidadPendientes, sincronizarCola } from "@/servicios/colaReportes";
import { useSesion } from "@/sesion";

// ESTILO: componentes y valores del tema
import { Texto } from "@/componentes/ui";
import { useColores } from "@/tema";

export default function EstadoRed() {
  const c = useColores(); // ESTILO: colores según modo claro/oscuro

  const red = useNetworkState(); // expo-network: se actualiza solo cuando cambia la conexión
  const { estado } = useSesion();
  const insets = useSafeAreaInsets();
  const [pendientes, setPendientes] = useState(cantidadPendientes);

  const sinRed = red.isConnected === false || red.isInternetReachable === false;
  const conRed = red.isConnected === true && !sinRed;

  // Cuando vuelve la red (y hay sesión), mandamos lo que quedó en la cola
  useEffect(() => {
    setPendientes(cantidadPendientes());
    if (conRed && estado === "con_sesion") {
      sincronizarCola().then(() => setPendientes(cantidadPendientes()));
    }
  }, [conRed, estado]);

  // Sin red, revisamos cada tanto por si se encoló un reporte nuevo
  useEffect(() => {
    if (!sinRed) return;
    const t = setInterval(() => setPendientes(cantidadPendientes()), 5000);
    return () => clearInterval(t);
  }, [sinRed]);

  if (!sinRed && pendientes === 0) return null;

  return (
    <View style={{ backgroundColor: c.desvioFondo, paddingTop: insets.top, paddingBottom: 6, paddingHorizontal: 16 }}>
      <Texto variante="secundario" style={{ color: c.desvio, textAlign: "center" }}>
        {sinRed ? "Sin conexión. Mostramos la información guardada." : "Enviando reportes pendientes…"}
        {pendientes > 0 ? ` · ${pendientes} ${pendientes === 1 ? "reporte" : "reportes"} por enviar` : ""}
      </Texto>
    </View>
  );
}