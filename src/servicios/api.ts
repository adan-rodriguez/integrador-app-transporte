import { mockAvisos, mockLineas } from '../mocks';
import { ApiError, ApiResponse, Aviso, Horario, Linea, Parada, ReporteDeDemora } from '../tipos';
import { distanciaMetros } from '../utilidades/coordenadas';
import { pedirDatos } from './cliente';



// Utilidad para simular latencia de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const obtenerLineas = async (): Promise<ApiResponse<Linea[]>> => {
  await delay(1000);
  return {
    datos: mockLineas,
    meta: { total: mockLineas.length, pagina: 1, porPagina: 20 }
  };
};

export const obtenerLinea = async (id: string): Promise<ApiResponse<Linea> | ApiError> => {
  await delay(800);
  const linea = mockLineas.find(l => l.id === id);
  if (!linea) return { error: { codigo: "LINEA_NO_ENCONTRADA", mensaje: "No existe esa línea." } };
  return { datos: linea };
};

export type ParadaCercana = Parada & { distanciaMetros: number };

export const obtenerParadasCercanas = async (
  lat: number,
  lng: number,
  radioMetros = 500
): Promise<ApiResponse<ParadaCercana[]>> => {
  const res = await pedirDatos<Parada[]>('/paradas', {
    consulta: { latitud: lat, longitud: lng, radioMetros, orden: 'distancia', porPagina: 1000 },
  });
  const yo = { latitud: lat, longitud: lng };
  const datos = res.datos.map((p) => ({ ...p, distanciaMetros: distanciaMetros(yo, p.coordenadas) }));
  return { datos };
};

export const obtenerParadas = async (): Promise<ApiResponse<Parada[]>> => {
  const res = await pedirDatos<Parada[]>('/paradas', {
    consulta: { porPagina: 1000, orden: 'nombre' },
  });
  return { datos: res.datos };
};

export const obtenerParada = async (id: string): Promise<ApiResponse<Parada> | ApiError> => {
  try {
    const res = await pedirDatos<Parada>(`/paradas/${id}`);
    return { datos: res.datos };
  } catch (e: any) {
    return { error: { codigo: e.codigo ?? 'ERROR', mensaje: e.message } };
  }
};

export const obtenerHorariosParada = async (paradaId: string): Promise<ApiResponse<Horario[]>> => {
  const res = await pedirDatos<Horario[]>(`/paradas/${paradaId}/proximos`, {
    consulta: { cantidad: 3 },
  });
  return { datos: res.datos };
};

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

