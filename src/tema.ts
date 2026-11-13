import { StyleSheet, useColorScheme } from "react-native";

// ─────────────────────────────────────────────
// 1. COLORES (modo claro y modo oscuro)
// ─────────────────────────────────────────────

const claro = {
  fondo: "#F6F7F7",
  tarjeta: "#FFFFFF",
  texto: "#111827",
  textoSecundario: "#4B5563",
  borde: "#E2E5E7",
  acento: "#0F5C63",
  acentoSuave: "#E3F1F2",
  textoSobreAcento: "#FFFFFF",
  error: "#B91C1C",
  exito: "#15803D",
  exitoFondo: "#DCF5E3",
  informativo: "#1D4ED8",
  informativoFondo: "#DBE6FD",
  desvio: "#B45309",
  desvioFondo: "#FEF3C7",
  suspension: "#B91C1C",
  suspensionFondo: "#FDE2E2",
};

const oscuro: typeof claro = {
  fondo: "#0E1214",
  tarjeta: "#171C1F",
  texto: "#F1F3F4",
  textoSecundario: "#A3ABB2",
  borde: "#2A3236",
  acento: "#5FC4C9",
  acentoSuave: "#123336",
  textoSobreAcento: "#0E1214",
  error: "#F87171",
  exito: "#4ADE80",
  exitoFondo: "#0F2F1C",
  informativo: "#8AB4FF",
  informativoFondo: "#1A2747",
  desvio: "#FBBF24",
  desvioFondo: "#3A2A0A",
  suspension: "#F87171",
  suspensionFondo: "#3B1414",
};

export type Colores = typeof claro;

export function useColores(): Colores {
  return useColorScheme() === "dark" ? oscuro : claro;
}

// ─────────────────────────────────────────────
// 2. TEXTO SOBRE EL COLOR DE CADA LÍNEA
// ─────────────────────────────────────────────

export function textoSobre(hex: string): "#FFFFFF" | "#111827" {
  const limpio = hex.replace("#", "");
  const r = parseInt(limpio.slice(0, 2), 16) / 255;
  const g = parseInt(limpio.slice(2, 4), 16) / 255;
  const b = parseInt(limpio.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminancia = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminancia > 0.4 ? "#111827" : "#FFFFFF";
}

// ─────────────────────────────────────────────
// 3. TIPOGRAFÍA
// ─────────────────────────────────────────────

export const fuentes = {
  regular: "AtkinsonHyperlegible_400Regular",
  negrita: "AtkinsonHyperlegible_700Bold",
} as const;

export const texto = StyleSheet.create({
  horario: { fontFamily: fuentes.negrita, fontSize: 28, fontVariant: ["tabular-nums"] },
  titulo: { fontFamily: fuentes.negrita, fontSize: 22 },
  subtitulo: { fontFamily: fuentes.negrita, fontSize: 18 },
  cuerpo: { fontFamily: fuentes.regular, fontSize: 16 },
  cuerpoNegrita: { fontFamily: fuentes.negrita, fontSize: 16 },
  secundario: { fontFamily: fuentes.regular, fontSize: 14 },
  etiqueta: { fontFamily: fuentes.negrita, fontSize: 13 },
});

// ─────────────────────────────────────────────
// 4. ESPACIADOS Y BORDES REDONDEADOS
// ─────────────────────────────────────────────

export const espacio = { xs: 4, s: 8, m: 12, l: 16, xl: 24 } as const;
export const radio = { s: 6, m: 12, l: 16 } as const;