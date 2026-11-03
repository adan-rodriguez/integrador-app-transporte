import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { minutosHasta } from "@/utilidades/horarios";

// Sin esto, con la app abierta la notificación no se muestra
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function pedirPermiso(): Promise<boolean> {
    if (Platform.OS === "android") {
    try {
      // El canal va ANTES del permiso, si no en Android 13+ no aparece el cartel
      await Notifications.setNotificationChannelAsync("recordatorios", {
        name: "Recordatorios de horarios",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    } catch (e) {
      console.log("No se pudo crear el canal de notificaciones", e);
    }
  }
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  const pedido = await Notifications.requestPermissionsAsync();
  return pedido.status === "granted";
}

export async function programarRecordatorio(
  hora: string,
  linea: string,
  parada: string,
  minutosAntes = 10
): Promise<"ok" | "falta-poco" | "sin-permiso"> {
  const faltan = minutosHasta(hora);
  if (faltan <= minutosAntes) return "falta-poco";
  if (!(await pedirPermiso())) return "sin-permiso";

  const fecha = new Date(Date.now() + (faltan - minutosAntes) * 60_000);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${linea} en ${minutosAntes} min`,
      body: `Pasa por ${parada} a las ${hora} (según tabla).`,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fecha, channelId: "recordatorios" },
  });
  return "ok";
}