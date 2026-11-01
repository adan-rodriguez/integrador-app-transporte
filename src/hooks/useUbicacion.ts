import * as Location from "expo-location";
import { useEffect, useState } from "react";

type Estado = "cargando" | "denegado" | "sin_gps" | "concedido";

export function useUbicacion() {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [posicion, setPosicion] = useState<Location.LocationObject | null>(null);

  async function obtener() {

    setEstado("cargando");

    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") {
      ({ status } = await Location.requestForegroundPermissionsAsync());
    }
    if (status !== "granted") {
      setEstado("denegado");
      return;
    }


    if (!(await Location.hasServicesEnabledAsync())) {
      setEstado("sin_gps");
      return;
    }

    // Primero la última conocida: es instantánea------------------------------------------------------------------------------
    const ultima = await Location.getLastKnownPositionAsync();
    if (ultima) {
      setPosicion(ultima);
      setEstado("concedido");
    }

    // Después la precisa, que puede tardar---------------------------------------------------------------------------
    try {
      const pos = await Promise.race([
        Location.getCurrentPositionAsync({}),
        new Promise<never>((_, rechazar) =>
          setTimeout(() => rechazar(new Error("timeout")), 10000)
        ),
      ]);
      setPosicion(pos);
      setEstado("concedido");
    } catch {
      if (!ultima) setEstado("sin_gps");
    }
  }

  useEffect(() => {
    obtener();
  }, []);

  return { estado, posicion, reintentar: obtener };
}