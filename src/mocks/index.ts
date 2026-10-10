import { Linea, Parada, Horario, Aviso, ReporteDeDemora, Usuario } from '../tipos';

export const mockLineas: Linea[] = [
  {
    id: 'lin-05',
    numero: '5',
    nombre: 'Puerto Viejo — San Agustín',
    color: '#1B6CA8',
    empresa: 'Transporte Mariano Moreno',
    activa: true,
    recorridos: [
      {
        sentido: 'ida',
        destino: 'hacia Puerto Viejo',
        trazado: [{ latitud: -31.73, longitud: -60.53 }, { latitud: -31.74, longitud: -60.54 }],
        paradaIds: ['par-101', 'par-102', 'par-103'],
      },
      {
        sentido: 'vuelta',
        destino: 'hacia San Agustín',
        trazado: [{ latitud: -31.74, longitud: -60.54 }, { latitud: -31.73, longitud: -60.53 }],
        paradaIds: ['par-104', 'par-105', 'par-106'],
      }
    ],
  },
  {
    id: 'lin-14',
    numero: '14',
    nombre: 'Aeropuerto — Bajada Grande',
    color: '#D32F2F',
    empresa: 'ERSA Urbano',
    activa: true,
    recorridos: [
      {
        sentido: 'ida',
        destino: 'hacia Bajada Grande',
        trazado: [{ latitud: -31.78, longitud: -60.48 }, { latitud: -31.73, longitud: -60.55 }],
        paradaIds: ['par-201', 'par-202'],
      }
    ],
  }
];

export const mockParadas: Parada[] = [
  {
    id: 'par-101',
    nombre: 'Alameda y Urquiza',
    coordenadas: { latitud: -31.7333, longitud: -60.5241 },
    lineaIds: ['lin-05', 'lin-14'],
    sentido: 'ida',
    refugio: true,
    codigoQr: 'PARANA:par-101',
  },
  {
    id: 'par-102',
    nombre: 'Corrientes y La Paz',
    coordenadas: { latitud: -31.7350, longitud: -60.5250 },
    lineaIds: ['lin-05'],
    sentido: 'ida',
    refugio: false,
    codigoQr: 'PARANA:par-102',
  },
  {
    id: 'par-103', // Parada sin próximos horarios para el mock feo
    nombre: 'Final del recorrido',
    coordenadas: { latitud: -31.7400, longitud: -60.5300 },
    lineaIds: ['lin-05'],
    sentido: 'ida',
    refugio: true,
    codigoQr: null,
  }
];

export const mockHorarios: Horario[] = [
  { id: 'hor-1', lineaId: 'lin-05', paradaId: 'par-101', sentido: 'ida', tipoDeDia: 'habil', hora: '10:42' },
  { id: 'hor-2', lineaId: 'lin-05', paradaId: 'par-101', sentido: 'ida', tipoDeDia: 'habil', hora: '11:02' },
  { id: 'hor-3', lineaId: 'lin-05', paradaId: 'par-101', sentido: 'ida', tipoDeDia: 'habil', hora: '11:22' },
  { id: 'hor-4', lineaId: 'lin-14', paradaId: 'par-101', sentido: 'ida', tipoDeDia: 'habil', hora: '10:51' },
  { id: 'hor-5', lineaId: 'lin-14', paradaId: 'par-101', sentido: 'ida', tipoDeDia: 'habil', hora: '11:21' },
  { id: 'hor-6', lineaId: 'lin-14', paradaId: 'par-101', sentido: 'ida', tipoDeDia: 'habil', hora: '11:51' },
];

export const mockAvisos: Aviso[] = [
  {
    id: 'avi-088',
    titulo: 'Desvío por obra en calle Corrientes',
    detalle: 'Desde el lunes 14 las líneas 2, 7 y 9 desvían por Santa Fe.',
    lineaIds: ['lin-02', 'lin-07', 'lin-09', 'lin-05'], // Incluyo lin-05 para que se vea
    desde: '2026-09-14T00:00:00-03:00',
    hasta: '2026-10-05T23:59:00-03:00',
    gravedad: 'desvio',
    trazadoAlternativo: [{ latitud: -31.7345, longitud: -60.5230 }],
    videoUrl: 'https://api.parana.gob.ar/v/desvio-corrientes.mp4', // Simulado
  },
  {
    id: 'avi-089',
    titulo: 'Línea 14 con demoras',
    detalle: 'Por accidente en Av. Almafuerte, se registran demoras de hasta 40 minutos.',
    lineaIds: ['lin-14'],
    desde: '2026-10-09T08:00:00-03:00',
    hasta: null,
    gravedad: 'informativo',
    trazadoAlternativo: null,
    videoUrl: null, // Aviso sin video, mock feo
  }
];

export const mockReportes: ReporteDeDemora[] = [
  {
    id: 'rep-3390',
    lineaId: 'lin-05',
    paradaId: 'par-101',
    usuarioId: 'usr-320',
    motivo: 'no_paso',
    comentario: 'Hace 25 minutos que espero',
    fotoUri: null,
    confirmaciones: 2,
    fechaHora: '2026-10-09T10:35:00-03:00',
    sincronizado: true,
  }
];

export const mockUsuario: Usuario = {
  id: 'usr-320',
  nombre: 'Julián Ferrari',
  email: 'julian@mail.com',
  lineasFavoritas: ['lin-05'],
  paradasFavoritas: ['par-101'],
  avisosActivos: true,
  tema: 'sistema',
};

