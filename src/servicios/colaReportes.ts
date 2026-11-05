import { Directory, File, Paths } from "expo-file-system";

import { encolarReporte, leerColaReportes, quitarDeColaReportes } from "@/db";
import { enviarReporte, NuevoReporte, subirFoto } from "./api";
import { ErrorApi } from "./cliente";

// Las fotos de la cámara quedan en una carpeta temporal que Android puede borrar:
// las copiamos a una carpeta propia hasta que se suban
const carpeta = new Directory(Paths.document, "fotos-pendientes");

export function guardarEnCola(reporte: NuevoReporte, fotoTemporal: string | null): void {
  let fotoLocal: string | null = null;
  if (fotoTemporal) {
    if (!carpeta.exists) carpeta.create();
    const destino = new File(carpeta, `${reporte.id}.jpg`);
    new File(fotoTemporal).copy(destino);
    fotoLocal = destino.uri;
  }
  encolarReporte(reporte.id, reporte, fotoLocal);
}

export function cantidadPendientes(): number {
  return leerColaReportes().length;
}

let sincronizando = false; // para no mandar la cola dos veces a la vez

// Manda todo lo pendiente. Devuelve cuántos se enviaron.
export async function sincronizarCola(): Promise<number> {
  if (sincronizando) return 0;
  sincronizando = true;
  let enviados = 0;
  try {
    for (const item of leerColaReportes<NuevoReporte>()) {
      try {
        const fotoUri = item.fotoLocal ? await subirFoto(item.fotoLocal) : null;
        await enviarReporte({ ...item.reporte, fotoUri });
        enviados++;
      } catch (e) {
        // Si sigue sin red, cortamos y lo reintentamos la próxima vez
        if (e instanceof ErrorApi && (e.esDeRed || e.estado === 401)) break;
        // Si la API lo rechazó (por ejemplo, ya enviado), reintentar no sirve: lo sacamos igual
      }
      quitarDeColaReportes(item.id);
      if (item.fotoLocal) {
        const foto = new File(item.fotoLocal);
        if (foto.exists) foto.delete();
      }
    }
  } finally {
    sincronizando = false;
  }
  return enviados;
}