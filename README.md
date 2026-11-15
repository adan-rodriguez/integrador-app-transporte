# Transporte Paraná

App móvil para pasajeros del transporte público de Paraná: paradas cercanas, recorridos y horarios de cada línea, avisos de desvíos y suspensiones, y reportes de demora entre usuarios. Funciona también sin conexión.

Trabajo integrador de **Desarrollo para Móviles 2026** — Tecnicatura Universitaria en Desarrollo Web, UNER.

## Descargar

- **Build de EAS (nube):** [link del build](https://expo.dev/accounts/arielmoren4/projects/integrador/builds/adc2867b-d243-4fe9-990e-ff7c90ba10cc), generado con `eas build --platform android --profile preview`. El link de EAS vence a los pocos días.
- **APK en GitHub Releases (local):** [última versión](https://github.com/adan-rodriguez/integrador-app-transporte/releases/latest), generado con el mismo perfil pero de forma local (`eas build --platform android --profile preview --local`). Queda como respaldo permanente.

Para instalar, abrir el `.apk` desde un teléfono Android y aceptar la instalación. No necesita Metro ni una computadora.

## Funcionalidades

- **Seguridad:** registro e inicio de sesión, token en SecureStore y desbloqueo con huella o PIN del teléfono (`expo-local-authentication`), con alternativa por contraseña.
- **Paradas:** paradas cercanas por radio con `expo-location`, vista de lista o mapa, escaneo del QR de la parada con `expo-camera`, próximos horarios, recordatorio 10 minutos antes con `expo-notifications` y flecha "Cómo llego" con el magnetómetro de `expo-sensors`.
- **Líneas:** recorrido por sentido en el mapa, paradas en orden y horarios según el tipo de día, incluidos los feriados.
- **Avisos:** desvíos y suspensiones por gravedad, con video del desvío (`expo-video`) que se guarda en el teléfono para verlo sin red.
- **Reportes:** reporte de demora con foto (`expo-image-picker`) y confirmación háptica (`expo-haptics`). Sin conexión, el reporte queda en cola y se envía solo cuando vuelve la red.
- **Sin conexión:** caché de las respuestas de la API en `expo-sqlite`, preferencias en `expo-sqlite/kv-store` y aviso del estado de la red con `expo-network`.

## Stack

Expo SDK 58 · React Native 0.88 · React 19.3 · TypeScript 6 · Expo Router · React Compiler.

Los mapas usan MapLibre con OpenFreeMap, ya que Google Maps requiere una clave paga. La versión con `react-native-maps` también está implementada en `src/componentes/` y se activa cambiando el `export default`.

## Correr el proyecto

```bash
npm install
npx expo start
```

Escanear el QR con **Expo Go**.

La app consume la API de la cátedra. Su dirección se configura en un archivo `.env` en la raíz:

```bash
EXPO_PUBLIC_API_URL=https://api.merlindevs.com
```

Si se usa la API local, poner la IP de la computadora, no `localhost`. El perfil `preview` de `eas.json` ya trae la URL publicada.

Para generar el APK:

```bash
eas build --platform android --profile preview
```

## Estructura

```
src/
├── app/           Pantallas y rutas (Expo Router)
│   ├── (tabs)/    Inicio, Paradas, Líneas, Avisos y Yo
│   ├── parada/    Escanear QR, detalle y "Cómo llego"
│   ├── linea/     Detalle de una línea
│   ├── aviso/     Detalle de un aviso
│   └── reporte/   Reporte de demora
├── componentes/   Mapas, flecha de rumbo, estado de red, desbloqueo y UI
├── hooks/         Hooks propios (useUbicacion, useRumbo)
├── servicios/     Cliente HTTP, API, caché, cola de reportes, recordatorios, videos y preferencias
├── db/            Base SQLite local
├── tipos/         Tipos de la API y de la app
├── utilidades/    Fechas, coordenadas y horarios
├── mocks/         Datos de prueba
├── sesion.tsx     Sesión, token y desbloqueo biométrico
└── tema.ts        Colores y modo oscuro
```

## Integrantes
- Canosa, Micaela.
- Francesquini, Noelia Marisol.
- Moren, Ariel.
- Rodriguez, Adán Gabriel.
