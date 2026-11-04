import { leerDeCache } from '@/db';
import type { Feriado } from '@/tipos/api';
import { mockAvisos } from '../mocks';
import { ApiError, ApiResponse, Aviso, Horario, Linea, Parada, ReporteDeDemora } from '../tipos';
import { distanciaMetros } from '../utilidades/coordenadas';
import { proximosLocales } from '../utilidades/horarios';
import { conCache } from './cache';
import { ErrorApi, pedirDatos } from './cliente';


// Utilidad para simular latencia de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// export const obtenerLineas = async (): Promise<ApiResponse<Linea[]>> => {
//   await delay(1000);
//   return {
//     datos: mockLineas,
//     meta: { total: mockLineas.length, pagina: 1, porPagina: 20 }
//   };
// };

// export const obtenerLinea = async (id: string): Promise<ApiResponse<Linea> | ApiError> => {
//   await delay(800);
//   const linea = mockLineas.find(l => l.id === id);
//   if (!linea) return { error: { codigo: "LINEA_NO_ENCONTRADA", mensaje: "No existe esa línea." } };
//   return { datos: linea };
// };

// PARADAAS=======================================================================================================================================
export type ParadaCercana = Parada & { distanciaMetros: number };


export const obtenerParadasCercanas = async (
  lat: number,
  lng: number,
  radioMetros = 500,
  q?: string
): Promise<ApiResponse<ParadaCercana[]> & { guardadoEn: Date | null }> => {
  const yo = { latitud: lat, longitud: lng };
  const conDistancia = (lista: Parada[]) =>
    lista.map((p) => ({ ...p, distanciaMetros: distanciaMetros(yo, p.coordenadas) }));

  try {
    const res = await pedirDatos<Parada[]>('/paradas', {
      consulta: { latitud: lat, longitud: lng, radioMetros, orden: 'distancia', porPagina: 1000, q },
    });
    return { datos: conDistancia(res.datos), guardadoEn: null };
  } catch (e) {
    // Sin red: filtramos en el teléfono la lista completa que quedó guardada
    const guardado = leerDeCache<Parada[]>('paradas:');
    if (!(e instanceof ErrorApi && e.esDeRed) || !guardado) throw e;
    const datos = conDistancia(guardado.datos)
      .filter((p) => p.distanciaMetros <= radioMetros)
      .filter((p) => !q || p.nombre.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => a.distanciaMetros - b.distanciaMetros);
    return { datos, guardadoEn: guardado.guardadoEn };
  }
};

export const obtenerParadas = async (q?: string) => {
  const r = await conCache(`paradas:${q ?? ''}`, async () => {
    const res = await pedirDatos<Parada[]>('/paradas', {
      consulta: { porPagina: 1000, orden: 'nombre', q },
    });
    return res.datos;
  });
  return { datos: r.datos, guardadoEn: r.guardadoEn };
};

export const obtenerParada = async (id: string): Promise<(ApiResponse<Parada> & { guardadoEn?: Date | null }) | ApiError> => {
  try {
    const r = await conCache(`parada:${id}`, async () => (await pedirDatos<Parada>(`/paradas/${id}`)).datos);
    return { datos: r.datos, guardadoEn: r.guardadoEn };
  } catch (e: any) {
    return { error: { codigo: e.codigo ?? 'ERROR', mensaje: e.message } };
  }
};


export const obtenerHorariosParada = async (
  paradaId: string
): Promise<ApiResponse<Horario[]> & { guardadoEn: Date | null }> => {
  try {
    const res = await pedirDatos<Horario[]>(`/paradas/${paradaId}/proximos`, { consulta: { cantidad: 3 } });
    guardarTablaDeParada(paradaId).catch(() => { }); // en segundo plano, no hace esperar a la pantalla
    return { datos: res.datos, guardadoEn: null };
  } catch (e) {
    // Sin red: calculamos los próximos con la tabla guardada
    const tabla = leerDeCache<Horario[]>(`horarios:${paradaId}`);
    if (!(e instanceof ErrorApi && e.esDeRed) || !tabla) throw e;
    const feriados = leerDeCache<Feriado[]>('feriados');
    const fechas = new Set((feriados?.datos ?? []).map((f) => f.fecha));
    return { datos: proximosLocales(tabla.datos, fechas), guardadoEn: tabla.guardadoEn };
  }
};

// export const obtenerLineasDeParada = async (lineaIds: string[]): Promise<ApiResponse<Linea[]>> => {
//   const res = await pedirDatos<Linea[]>('/lineas');
//   return { datos: res.datos.filter((l) => lineaIds.includes(l.id)) };
// };

// FIN PARADAAS=======================================================================================================================================

// Feriados de este año y del próximo (por si mañana ya es 1 de enero)
export const obtenerFeriados = async () => {
  const anio = new Date().getFullYear();
  const r = await conCache('feriados', async () => {
    const [este, proximo] = await Promise.all([
      pedirDatos<Feriado[]>('/feriados', { consulta: { anio } }),
      pedirDatos<Feriado[]>('/feriados', { consulta: { anio: anio + 1 } }),
    ]);
    return [...este.datos, ...proximo.datos];
  });
  return new Set(r.datos.map((f) => f.fecha));
};

// Baja la tabla completa de la parada y los feriados, para poder calcular sin red
async function guardarTablaDeParada(paradaId: string) {
  await Promise.all([
    conCache(`horarios:${paradaId}`, async () =>
      (await pedirDatos<Horario[]>('/horarios', { consulta: { paradaId, porPagina: 5000 } })).datos
    ),
    obtenerFeriados(),
  ]);
}



// LINEAS=======================================================================================================================================

export const obtenerLineas = async () => {
  const r = await conCache('lineas', async () =>
    (await pedirDatos<Linea[]>('/lineas', { consulta: { porPagina: 100 } })).datos
  );
  return { datos: r.datos, guardadoEn: r.guardadoEn };
};

export const obtenerLinea = async (
  id: string
): Promise<(ApiResponse<Linea> & { guardadoEn?: Date | null }) | ApiError> => {
  try {
    const r = await conCache(`linea:${id}`, async () => (await pedirDatos<Linea>(`/lineas/${id}`)).datos);
    return { datos: r.datos, guardadoEn: r.guardadoEn };
  } catch (e: any) {
    // Sin red y sin esta línea guardada: la buscamos en el listado guardado
    const listado = leerDeCache<Linea[]>('lineas');
    const linea = listado?.datos.find((l) => l.id === id);
    if (linea && e instanceof ErrorApi && e.esDeRed) return { datos: linea, guardadoEn: listado!.guardadoEn };
    return { error: { codigo: e.codigo ?? 'ERROR', mensaje: e.message } };
  }
};

export const obtenerLineasDeParada = async (lineaIds: string[]) => {
  const r = await obtenerLineas();
  return { datos: r.datos.filter((l) => lineaIds.includes(l.id)) };
};

// Tabla completa de la línea: la pantalla la separa por tipo de día
export const obtenerHorariosLinea = async (lineaId: string) => {
  const r = await conCache(`horarios-linea:${lineaId}`, async () =>
    (await pedirDatos<Horario[]>('/horarios', { consulta: { lineaId, porPagina: 5000 } })).datos
  );
  return { datos: r.datos, guardadoEn: r.guardadoEn };
};

// FIN LINEAS=======================================================================================================================================


export const obtenerAvisos = async (): Promise<ApiResponse<Aviso[]>> => {
  await delay(1000);
  return { datos: mockAvisos };
};

export const enviarReporte = async (reporte: Omit<ReporteDeDemora, 'id' | 'sincronizado'>): Promise<ApiResponse<ReporteDeDemora>> => {
  await delay(1500);
  // Simular error de red feo a veces? Podríamos, pero por ahora solo respondemos éxito.
  const nuevoReporte: ReporteDeDemora = {
    ...reporte,
    id: `rep-${Math.floor(Math.random() * 10000)}`,
    sincronizado: true,
  };
  return { datos: nuevoReporte };
};
