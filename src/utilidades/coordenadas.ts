import { Coordenadas } from "@/tipos";
import type { LatLng } from "react-native-maps";

// Distancia en metros entre dos puntos (fórmula de Haversine)
export function distanciaMetros(a: Coordenadas, b: Coordenadas): number {
  const R = 6371000;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.latitud - a.latitud);
  const dLon = rad(b.longitud - a.longitud);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitud)) * Math.cos(rad(b.latitud)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Rumbo en grados (0 = norte, 90 = este) desde "a" hacia "b"
export function rumboGrados(a: Coordenadas, b: Coordenadas): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLon = rad(b.longitud - a.longitud);
  const y = Math.sin(dLon) * Math.cos(rad(b.latitud));
  const x =
    Math.cos(rad(a.latitud)) * Math.sin(rad(b.latitud)) -
    Math.sin(rad(a.latitud)) * Math.cos(rad(b.latitud)) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// "120 m" o "2,4 km" modularisado
export function formatearDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros)} m`;
  return `${(metros / 1000).toFixed(1).replace('.', ',')} km`;
}


// La API usa latitud/longitud; react-native-maps pide latitude/longitude
export function aLatLng(c: Coordenadas): LatLng {
  return { latitude: c.latitud, longitude: c.longitud };
}