import { router } from "expo-router";
import { useMemo } from "react";
import MapView, { Marker } from "react-native-maps";

import MapaWeb from "@/componentes/MapaWeb";
import { Parada } from "@/tipos";

type Props = {
  paradas: Parada[];
  centro: { latitud: number; longitud: number } | null;
};

// Centro de Paraná, por si no hay ubicación
const PARANA = { latitud: -31.7413, longitud: -60.5115 };

// ---------- Versión Google (react-native-maps): en el APK necesita clave de Google Maps ----------
function MapaParadasGoogle({ paradas, centro }: Props) {
  const c = centro ?? PARANA;
  return (
    <MapView
      style={{ flex: 1 }}
      showsUserLocation
      initialRegion={{
        latitude: c.latitud,
        longitude: c.longitud,
        latitudeDelta: centro ? 0.01 : 0.08,
        longitudeDelta: centro ? 0.01 : 0.08,
      }}
    >
      {paradas.map((p) => (
        <Marker
          key={p.id}
          coordinate={{ latitude: p.coordenadas.latitud, longitude: p.coordenadas.longitud }}
          title={p.nombre}
          description="Tocá para ver horarios"
          onCalloutPress={() => router.push(`/parada/${p.id}`)}
        />
      ))}
    </MapView>
  );
}

// ---------- Versión web (MapLibre + OpenFreeMap): sin clave ----------
function MapaParadasWeb({ paradas, centro }: Props) {
  const marcadores = useMemo(
    () =>
      paradas.map((p) => ({
        id: p.id,
        lat: p.coordenadas.latitud,
        lng: p.coordenadas.longitud,
        titulo: p.nombre,
      })),
    [paradas]
  );
  const yo = centro ? { lat: centro.latitud, lng: centro.longitud } : null;

  return (
    <MapaWeb
      marcadores={marcadores}
      centro={yo}
      ubicacion={yo}
      onMarcadorPress={(id) => router.push(`/parada/${id}`)}
    />
  );
}

// Para volver a Google, cambiá esta línea por: export default MapaParadasGoogle;
export default MapaParadasWeb;