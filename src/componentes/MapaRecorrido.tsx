import { router } from "expo-router";
import { useEffect, useRef } from "react";
import MapView, { Marker, Polyline } from "react-native-maps";

import { Coordenadas, Parada } from "@/tipos";
import { aLatLng } from "@/utilidades/coordenadas";

type Props = {
  trazado: Coordenadas[];
  paradas: Parada[];
  color: string;
};

const MARGEN = { top: 40, right: 40, bottom: 40, left: 40 };

export default function MapaRecorrido({ trazado, paradas, color }: Props) {
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