import { Horario } from "@/tipos";

export type GrupoLinea = {
  lineaId: string;
  horarios: Horario[];
  minutosAlPrimero: number;
  primeroEsManana: boolean;
};

// Minutos desde ahora hasta "HH:MM". Si la hora ya pasó, es de mañana.
export function minutosHasta(hora: string, ahora = new Date()): number {
  const [h, m] = hora.split(":").map(Number);
  const actual = ahora.getHours() * 60 + ahora.getMinutes();
  const destino = h * 60 + m;
  return destino >= actual ? destino - actual : destino + 1440 - actual;
}

// Agrupa los horarios por línea, respetando el orden en que vienen de la API.
export function agruparPorLinea(horarios: Horario[], ahora = new Date()): GrupoLinea[] {
  const grupos = new Map<string, Horario[]>();
  for (const h of horarios) {
    grupos.set(h.lineaId, [...(grupos.get(h.lineaId) ?? []), h]);
  }
  const actual = ahora.getHours() * 60 + ahora.getMinutes();
  return [...grupos.entries()].map(([lineaId, lista]) => {
    const [h, m] = lista[0].hora.split(":").map(Number);
    return {
      lineaId,
      horarios: lista,
      minutosAlPrimero: minutosHasta(lista[0].hora, ahora),
      primeroEsManana: h * 60 + m < actual,
    };
  });
}