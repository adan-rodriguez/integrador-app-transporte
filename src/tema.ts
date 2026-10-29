import { useColorScheme } from "react-native";

const claro = {
  fondo: "#FFFFFF",
  tarjeta: "#F3F4F6",
  texto: "#111827",
  textoSecundario: "#6B7280",
  borde: "#E5E7EB",
  acento: "#1B6CA8",
  textoSobreAcento: "#FFFFFF",
  error: "#B91C1C",
  exito: "#15803D",
};

const oscuro = {
  fondo: "#111315",
  tarjeta: "#1C1F22",
  texto: "#F3F4F6",
  textoSecundario: "#9CA3AF",
  borde: "#2A2E32",
  acento: "#5BA3DB",
  textoSobreAcento: "#0B1620",
  error: "#F87171",
  exito: "#4ADE80",
};

export function useColores() {
  return useColorScheme() === "dark" ? oscuro : claro;
}

