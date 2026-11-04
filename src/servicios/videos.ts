import { Directory, File, Paths } from "expo-file-system";

// Carpeta donde guardamos los videos de los avisos
const carpeta = new Directory(Paths.document, "videos");

function archivoDe(avisoId: string) {
  return new File(carpeta, `${avisoId}.mp4`);
}

// Si el video ya está en el teléfono, devuelve su dirección local; si no, null
export function videoGuardado(avisoId: string): string | null {
  const archivo = archivoDe(avisoId);
  return archivo.exists ? archivo.uri : null;
}

// Baja el video y lo guarda. Si ya estaba, no lo vuelve a bajar.
export async function descargarVideo(avisoId: string, url: string): Promise<string> {
  if (!carpeta.exists) carpeta.create();
  const destino = archivoDe(avisoId);
  if (destino.exists) return destino.uri;
  const archivo = await File.downloadFileAsync(url, destino);
  return archivo.uri;
}