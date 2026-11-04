// "hace 5 min", "hace 2 h", "hace 3 días"
export function haceCuanto(fecha: Date, ahora = new Date()): string {
  const minutos = Math.floor((ahora.getTime() - fecha.getTime()) / 60000);
  if (minutos < 1) return "recién";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
}

// "4/11 09:30" en la hora del teléfono
export function formatearFechaHora(iso: string): string {
  const f = new Date(iso);
  const hh = String(f.getHours()).padStart(2, "0");
  const mm = String(f.getMinutes()).padStart(2, "0");
  return `${f.getDate()}/${f.getMonth() + 1} ${hh}:${mm}`;
}