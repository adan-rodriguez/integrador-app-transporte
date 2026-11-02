import { Magnetometer } from "expo-sensors";
import { useEffect, useState } from "react";

import { useUbicacion } from "@/hooks/useUbicacion";
import { Coordenadas } from "@/tipos";
import { distanciaMetros, rumboGrados } from "@/utilidades/coordenadas";

export function useRumbo(destino: Coordenadas | null) {
  const { estado, posicion } = useUbicacion();
  const [orientacion, setOrientacion] = useState(0); // hacia dónde mira el teléfono
  const [hayBrujula, setHayBrujula] = useState(true);

  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    let activo = true;
    Magnetometer.isAvailableAsync().then((ok) => {
      if (!activo) return;
      setHayBrujula(ok);
      if (!ok) return;
      Magnetometer.setUpdateInterval(200);
      sub = Magnetometer.addListener(({ x, y }) => {
        const angulo = (Math.atan2(y, x) * 180) / Math.PI;
        setOrientacion((angulo - 90 + 360) % 360);
      });
    });
    return () => {
      activo = false;
      sub?.remove();
    };
  }, []);

  if (!destino || !posicion) {
    return { estado, hayBrujula, angulo: null, distancia: null };
  }

  const yo = { latitud: posicion.coords.latitude, longitud: posicion.coords.longitude };
  const haciaParada = rumboGrados(yo, destino);
  return {
    estado,
    hayBrujula,
    angulo: (haciaParada - orientacion + 360) % 360, // cuánto girar la flecha
    distancia: distanciaMetros(yo, destino),
  };
}