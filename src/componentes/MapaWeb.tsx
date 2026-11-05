import { useMemo } from "react";
import { WebView } from "react-native-webview";

export type Marcador = { id: string; lat: number; lng: number; titulo: string; color?: string };

type Props = {
  marcadores: Marcador[];
  trazado?: { puntos: [number, number][]; color: string } | null; // [lat, lng]
  centro?: { lat: number; lng: number } | null;
  ubicacion?: { lat: number; lng: number } | null;
  onMarcadorPress?: (id: string) => void;
};

const PARANA = { lat: -31.7413, lng: -60.5115 };

export default function MapaWeb({ marcadores, trazado, centro, ubicacion, onMarcadorPress }: Props) {
  const html = useMemo(() => {
    const datos = JSON.stringify({ marcadores, trazado: trazado ?? null, centro: centro ?? null, ubicacion: ubicacion ?? null, parana: PARANA });
    return `<!doctype html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css">
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<style>
  html,body,#mapa{margin:0;height:100%;}
  .punto{width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 2px rgba(0,0,0,.5);}
  .boton{margin-top:6px;padding:6px 10px;border:1px solid #333;border-radius:6px;background:#fff;}
</style>
</head><body><div id="mapa"></div><script>
const d = ${datos};
// OpenFreeMap: mapas de OpenStreetMap, gratis y sin clave
const mapa = new maplibregl.Map({
  container: 'mapa',
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center: [d.parana.lng, d.parana.lat],
  zoom: 13,
  attributionControl: { compact: true }
});
mapa.addControl(new maplibregl.NavigationControl({ showCompass: false }));

function punto(color) {
  const el = document.createElement('div');
  el.className = 'punto';
  el.style.background = color;
  return el;
}

const puntos = []; // [lng, lat] para encuadrar

for (const m of d.marcadores) {
  const caja = document.createElement('div');
  const titulo = document.createElement('div'); titulo.textContent = m.titulo; titulo.style.fontWeight = '600';
  const boton = document.createElement('button'); boton.textContent = 'Ver horarios'; boton.className = 'boton';
  boton.onclick = () => window.ReactNativeWebView.postMessage(m.id);
  caja.append(titulo, boton);
  new maplibregl.Marker({ element: punto(m.color || '#d32f2f') })
    .setLngLat([m.lng, m.lat])
    .setPopup(new maplibregl.Popup({ offset: 10 }).setDOMContent(caja))
    .addTo(mapa);
  puntos.push([m.lng, m.lat]);
}

if (d.ubicacion) {
  new maplibregl.Marker({ element: punto('#1a73e8') }).setLngLat([d.ubicacion.lng, d.ubicacion.lat]).addTo(mapa);
}

const linea = d.trazado && d.trazado.puntos.length > 1 ? d.trazado.puntos.map(([lat, lng]) => [lng, lat]) : null;
if (linea) puntos.push(...linea);

mapa.on('load', () => {
  if (linea) {
    mapa.addSource('recorrido', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: linea } } });
    mapa.addLayer({ id: 'recorrido', type: 'line', source: 'recorrido', paint: { 'line-color': d.trazado.color, 'line-width': 5 } });
  }
});

if (d.centro) {
  mapa.jumpTo({ center: [d.centro.lng, d.centro.lat], zoom: 15 });
} else if (puntos.length > 1) {
  const b = new maplibregl.LngLatBounds(puntos[0], puntos[0]);
  puntos.forEach((p) => b.extend(p));
  mapa.fitBounds(b, { padding: 30, duration: 0 });
} else if (puntos.length === 1) {
  mapa.jumpTo({ center: puntos[0], zoom: 15 });
}
</script></body></html>`;
  }, [marcadores, trazado, centro, ubicacion]);

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html }}
      style={{ flex: 1 }}
      onMessage={(e) => onMarcadorPress?.(e.nativeEvent.data)}
    />
  );
}