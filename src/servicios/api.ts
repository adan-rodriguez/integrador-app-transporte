import { Linea, Parada, Horario, Aviso, ReporteDeDemora, ApiResponse, ApiError } from '../tipos';
import { mockLineas, mockParadas, mockHorarios, mockAvisos, mockReportes } from '../mocks';

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

export const obtenerParadasCercanas = async (lat: number, lng: number): Promise<ApiResponse<Parada[]>> => {
  await delay(1200);
  // Simplemente devolvemos el mock de paradas
  return { datos: mockParadas };
};

export const obtenerParada = async (id: string): Promise<ApiResponse<Parada> | ApiError> => {
  await delay(800);
  const parada = mockParadas.find(p => p.id === id);
  if (!parada) return { error: { codigo: "PARADA_NO_ENCONTRADA", mensaje: "No existe esa parada." } };
  return { datos: parada };
};

export const obtenerHorariosParada = async (paradaId: string): Promise<ApiResponse<Horario[]>> => {
  await delay(1000);
  const horarios = mockHorarios.filter(h => h.paradaId === paradaId);
  return { datos: horarios };
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

