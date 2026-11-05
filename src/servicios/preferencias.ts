import Storage from "expo-sqlite/kv-store";

// Preferencias chicas del usuario. Para el token se usa secure-store, no esto.
const CLAVES = {
  vistaParadas: "pref.paradas.vista",
  radioParadas: "pref.paradas.radio",
} as const;

export function leerVistaParadas(): "lista" | "mapa" {
  return Storage.getItemSync(CLAVES.vistaParadas) === "mapa" ? "mapa" : "lista";
}

export function guardarVistaParadas(vista: "lista" | "mapa") {
  Storage.setItemSync(CLAVES.vistaParadas, vista);
}

export function leerRadioParadas(): number | null {
  const valor = Storage.getItemSync(CLAVES.radioParadas);
  if (valor === null) return 300; // por defecto
  return valor === "todas" ? null : Number(valor);
}

export function guardarRadioParadas(radio: number | null) {
  Storage.setItemSync(CLAVES.radioParadas, radio === null ? "todas" : String(radio));
}