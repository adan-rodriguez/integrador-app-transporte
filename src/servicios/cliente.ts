// Cliente HTTP de la API de la cátedra. Es la única puerta de salida a la red:
// ninguna pantalla hace `fetch` directamente, todo pasa por los servicios de esta carpeta.
import type { Meta, RespuestaError } from '@/tipos/api';

/**
 * Dirección de la API. Se configura en `.env` con EXPO_PUBLIC_API_URL.
 * Desde el teléfono no sirve `localhost`: tiene que ser la IP de la computadora.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

const TIEMPO_MAXIMO_MS = 15000;

/** Error de la API o de la red, con un mensaje listo para mostrar en pantalla. */
export class ErrorApi extends Error {
  constructor(
    readonly codigo: string,
    mensaje: string,
    readonly estado: number | null,
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }

  /** true si no hubo respuesta del servidor (sin red, caído o demasiado lento). */
  get esDeRed(): boolean {
    return this.estado === null;
  }
}

/** Resultado de un pedido: los datos, la paginación y cuándo respondió el servidor. */
export interface Resultado<T, M = Meta | null> {
  datos: T;
  meta: M;
  /** Cabecera `Date` de la respuesta (R17): sirve para decir "información de hace 2 horas". */
  fecha: Date | null;
}

type Parametros = Record<string, string | number | boolean | null | undefined>;

interface Opciones {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  consulta?: Parametros;
  cuerpo?: unknown;
  /** FormData para subir archivos; en ese caso no se fija Content-Type. */
  formulario?: FormData;
  /** Si es false, no manda el token aunque haya sesión. */
  conSesion?: boolean;
  senal?: AbortSignal;
}

let obtenerToken: () => string | null = () => null;
let alSesionVencida: (() => void) | null = null;

/** Lo llama la capa de sesión para que el cliente sepa qué token mandar. */
export function configurarSesion(opciones: {
  token: () => string | null;
  alVencer?: () => void;
}): void {
  obtenerToken = opciones.token;
  alSesionVencida = opciones.alVencer ?? null;
}

function armarUrl(ruta: string, consulta?: Parametros): string {
  const url = new URL(API_URL + ruta);
  if (consulta) {
    for (const [clave, valor] of Object.entries(consulta)) {
      // La API no acepta filtros vacíos: sólo se mandan los que tienen valor.
      if (valor !== undefined && valor !== null && valor !== '') {
        url.searchParams.set(clave, String(valor));
      }
    }
  }
  return url.toString();
}

async function pedir(ruta: string, opciones: Opciones): Promise<Response> {
  const cabeceras: Record<string, string> = { Accept: 'application/json' };
  const token = opciones.conSesion === false ? null : obtenerToken();
  if (token) cabeceras.Authorization = `Bearer ${token}`;

  let cuerpo: BodyInit | undefined;
  if (opciones.formulario) {
    cuerpo = opciones.formulario;
  } else if (opciones.cuerpo !== undefined) {
    cabeceras['Content-Type'] = 'application/json';
    cuerpo = JSON.stringify(opciones.cuerpo);
  }

  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIEMPO_MAXIMO_MS);
  opciones.senal?.addEventListener('abort', () => control.abort());

  try {
    return await fetch(armarUrl(ruta, opciones.consulta), {
      method: opciones.metodo ?? 'GET',
      headers: cabeceras,
      body: cuerpo,
      signal: control.signal,
    });
  } catch {
    throw new ErrorApi(
      'SIN_CONEXION',
      'No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.',
      null,
    );
  } finally {
    clearTimeout(temporizador);
  }
}

async function leerError(respuesta: Response): Promise<ErrorApi> {
  try {
    const cuerpo = (await respuesta.json()) as Partial<RespuestaError>;
    if (cuerpo.error?.codigo && cuerpo.error.mensaje) {
      return new ErrorApi(cuerpo.error.codigo, cuerpo.error.mensaje, respuesta.status);
    }
  } catch {
    // El cuerpo no era JSON: cae al mensaje genérico.
  }
  return new ErrorApi('ERROR_INTERNO', 'Algo salió mal. Intentá de nuevo en un rato.', respuesta.status);
}

/** Pide un recurso o una lista y devuelve el contenido del sobre `{ datos, meta }`. */
export async function pedirDatos<T, M = Meta | null>(
  ruta: string,
  opciones: Opciones = {},
): Promise<Resultado<T, M>> {
  const respuesta = await pedir(ruta, opciones);
  if (!respuesta.ok) {
    const error = await leerError(respuesta);
    if (respuesta.status === 401 && obtenerToken()) alSesionVencida?.();
    throw error;
  }
  const cuerpo = (await respuesta.json()) as { datos: T; meta: M };
  const cabeceraFecha = respuesta.headers.get('Date');
  return {
    datos: cuerpo.datos,
    meta: cuerpo.meta,
    fecha: cabeceraFecha ? new Date(cabeceraFecha) : null,
  };
}

/** Para los DELETE: responden 204 sin cuerpo. */
export async function pedirSinCuerpo(ruta: string, opciones: Opciones = {}): Promise<void> {
  const respuesta = await pedir(ruta, opciones);
  if (!respuesta.ok) {
    const error = await leerError(respuesta);
    if (respuesta.status === 401 && obtenerToken()) alSesionVencida?.();
    throw error;
  }
}

