import { router } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import MapView, { Marker, Polyline } from "react-native-maps";

import MapaWeb from "@/componentes/MapaWeb";
import { Coordenadas, Parada } from "@/tipos";
import { aLatLng } from "@/utilidades/coordenadas";

type Props = {
  trazado: Coordenadas[];
  paradas: Parada[];
  color: string;
};

const MARGEN = { top: 40, right: 40, bottom: 40, left: 40 };

// ---------- Versión Google (react-native-maps): en el APK necesita clave de Google Maps ----------
function MapaRecorridoGoogle({ trazado, paradas, color }: Props) {
  const mapa = useRef<MapView>(null);
  const puntos = trazado.map(aLatLng);

  // Cada vez que cambia el recorrido (ida/vuelta), encuadra el mapa para que entre entero
  function encuadrar() {
    if (puntos.length > 1) mapa.current?.fitToCoordinates(puntos, { edgePadding: MARGEN, animated: true });
  }
  useEffect(encuadrar, [trazado]);

  return (
    <MapView ref={mapa} style={{ flex: 1 }} showsUserLocation onMapReady={encuadrar}>
      <Polyline coordinates={puntos} strokeColor={color} strokeWidth={5} />
      {paradas.map((p) => (
        <Marker
          key={p.id}
          coordinate={aLatLng(p.coordenadas)}
          title={p.nombre}
          description="Tocá para ver horarios"
          pinColor={color}
          onCalloutPress={() => router.push(`/parada/${p.id}`)}
        />
      ))}
    </MapView>
  );
}

// ---------- Versión web (MapLibre + OpenFreeMap): sin clave ----------
function MapaRecorridoWeb({ trazado, paradas, color }: Props) {
  // MapaWeb recibe [lat, lng]; la API manda { latitud, longitud }
  const linea = useMemo(
    () => ({ puntos: trazado.map((c) => [c.latitud, c.longitud] as [number, number]), color }),
    [trazado, color]
  );

  const marcadores = useMemo(
    () =>
      paradas.map((p) => ({
        id: p.id,
        lat: p.coordenadas.latitud,
        lng: p.coordenadas.longitud,
        titulo: p.nombre,
        color,
      })),
    [paradas, color]
  );

  return <MapaWeb trazado={linea} marcadores={marcadores} onMarcadorPress={(id) => router.push(`/parada/${id}`)} />;
}

// Para volver a Google, cambiá esta línea por: export default MapaRecorridoGoogle;
export default MapaRecorridoWeb;