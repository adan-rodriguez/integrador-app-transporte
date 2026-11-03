import { Horario, TipoDeDia } from "@/tipos";

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

// "AAAA-MM-DD" en la hora del teléfono
function aDia(fecha: Date): string {
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${m}-${d}`;
}

// Prioridad: feriado > domingo > sábado > hábil
export function tipoDeDia(fecha: Date, feriados: Set<string>): TipoDeDia {
  if (feriados.has(aDia(fecha))) return "feriado";
  if (fecha.getDay() === 0) return "domingo";
  if (fecha.getDay() === 6) return "sabado";
  return "habil";
}

// Lo mismo que /paradas/:id/proximos, pero calculado en el teléfono con la tabla guardada
export function proximosLocales(
  tabla: Horario[],
  feriados: Set<string>,
  cantidad = 3,
  ahora = new Date()
): Horario[] {
  const manana = new Date(ahora);
  manana.setDate(ahora.getDate() + 1);
  const tipoHoy = tipoDeDia(ahora, feriados);
  const tipoManana = tipoDeDia(manana, feriados);
  const horaActual = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;

  const resultado: Horario[] = [];
  for (const lineaId of new Set(tabla.map((h) => h.lineaId))) {
    const deLinea = tabla
      .filter((h) => h.lineaId === lineaId)
      .sort((a, b) => a.hora.localeCompare(b.hora));
    const deHoy = deLinea.filter((h) => h.tipoDeDia === tipoHoy && h.hora >= horaActual);
    const deManana = deLinea.filter((h) => h.tipoDeDia === tipoManana);
    resultado.push(...[...deHoy, ...deManana].slice(0, cantidad));
  }
  return resultado.sort((a, b) => minutosHasta(a.hora, ahora) - minutosHasta(b.hora, ahora));
}