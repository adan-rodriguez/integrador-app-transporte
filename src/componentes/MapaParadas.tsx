import { router } from "expo-router";
import MapView, { Marker } from "react-native-maps";

import { Parada } from "@/tipos";

type Props = {
  paradas: Parada[];
  centro: { latitud: number; longitud: number } | null;
};

// Centro de Paraná, por si no hay ubicación
const PARANA = { latitud: -31.7413, longitud: -60.5115 };

export default function MapaParadas({ paradas, centro }: Props) {
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