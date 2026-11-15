# Transporte Paraná

App móvil para pasajeros del transporte público de Paraná: paradas cercanas, recorridos y horarios de cada línea, avisos de desvíos y suspensiones, y reportes de demora entre usuarios. Funciona también sin conexión.

Trabajo integrador de **Desarrollo para Móviles 2026** — Tecnicatura Universitaria en Desarrollo Web, UNER.

## Descargar

- **APK (release):** [última versión](https://github.com/adan-rodriguez/integrador-app-transporte/releases/latest)
- **Build de EAS:** [link del build](PEGAR_LINK_DE_EAS)

Para instalar, abrir el `.apk` desde un teléfono Android y aceptar la instalación. No necesita Metro ni una computadora.

## Funcionalidades

- **Seguridad:** registro e inicio de sesión, token en SecureStore y desbloqueo con huella o PIN del teléfono (`expo-local-authentication`), con alternativa por contraseña.
- **Paradas:** paradas cercanas por radio con `expo-location`, vista de lista o mapa, escaneo del QR de la parada con `expo-camera`, próximos horarios, recordatorio 10 minutos antes con `expo-notifications` y flecha "Cómo llego" con el magnetómetro de `expo-sensors`.
- **Líneas:** recorrido por sentido en el mapa, paradas en orden y horarios según el tipo de día, incluidos los feriados.
- **Avisos:** desvíos y suspensiones por gravedad, con video del desvío (`expo-video`) que se guarda en el teléfono para verlo sin red.
- **Reportes:** reporte de demora con foto (`expo-image-picker`) y confirmación háptica (`expo-haptics`). Sin conexión, el reporte queda en cola y se envía solo cuando vuelve la red.
- **Sin conexión:** caché de las respuestas de la API en `expo-sqlite`, preferencias en `expo-sqlite/kv-store` y aviso del estado de la red con `expo-network`.

## Stack

Expo SDK 57 · React Native 0.86 · React 19.2 · TypeScript · Expo Router.

Los mapas usan MapLibre con OpenFreeMap, ya que Google Maps requiere una clave paga. La versión con `react-native-maps` también está implementada en `src/componentes/` y se activa cambiando el `export default`.

## Correr el proyecto

```bash
npm install
npx expo start
```

Escanear el QR con **Expo Go**. La app consume la API de la cátedra publicada en `https://api.merlindevs.com`.

Para generar el APK:

```bash
eas build --platform android --profile preview
```

## Estructura

```
src/
├── app/          Pantallas y rutas (Expo Router)
├── componentes/  Componentes reutilizables
├── hooks/        Hooks propios (useUbicacion, useRumbo)
├── servicios/    API, caché, cola de reportes, recordatorios, preferencias
└── db/           Base SQLite local
```

## Integrantes


- Canosa, Micaela.
- Francesquini, Noelia Marisol.
- Moren, Ariel.
- Rodriguez, Adán Gabriel.
