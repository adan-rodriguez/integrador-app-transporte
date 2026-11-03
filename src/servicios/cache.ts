import { guardarEnCache, leerDeCache } from "@/db";
import { ErrorApi } from "./cliente";

// guardadoEn: null si los datos vienen recién de la API; una fecha si vienen guardados
export type ConOrigen<T> = { datos: T; guardadoEn: Date | null };

export async function conCache<T>(clave: string, pedir: () => Promise<T>): Promise<ConOrigen<T>> {
  try {
    const datos = await pedir();
    guardarEnCache(clave, datos); // cada respuesta buena se guarda para después
    return { datos, guardadoEn: null };
  } catch (e) {
    // Solo si es un problema de red usamos lo guardado.
    // Si la API respondió con un error (por ejemplo 404), no escondemos el error.
    if (e instanceof ErrorApi && e.esDeRed) {
      const guardado = leerDeCache<T>(clave);
      if (guardado) return guardado;
    }
    throw e;
  }
}