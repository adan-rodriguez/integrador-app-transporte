import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

// ESTILO: componentes y valores del tema
import { Boton, Texto } from '@/componentes/ui';
import { espacio, radio, useColores } from '@/tema';

export default function Escanear() {
  const c = useColores(); // ESTILO: colores según modo claro/oscuro

  const [permiso, pedirPermiso] = useCameraPermissions();
  const yaLeyo = useRef(false);

  // Caso 1: todavía no sabemos si hay permiso
  if (!permiso) {
    return (
      <View style={[styles.centro, { backgroundColor: c.fondo }]}>
        <Texto secundario>Cargando cámara...</Texto>
      </View>
    );
  }

  // Caso 2: no hay permiso → explicamos y lo pedimos
  if (!permiso.granted) {
    return (
      <View style={[styles.centro, { backgroundColor: c.fondo }]}>
        <Texto style={{ textAlign: 'center' }}>
          Necesitamos la cámara para leer el código QR de la parada.
        </Texto>
        <Boton titulo="Dar permiso" variante="primario" onPress={pedirPermiso} />
      </View>
    );
  }

  // Caso 3: hay permiso → mostramos la cámara
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => {
          if (yaLeyo.current) return;   // ya leímos uno → ignoramos
          yaLeyo.current = true;        // cerramos el candado
          console.log('QR leído:', data);

          // No es un QR de parada → avisamos y reabrimos al cerrar el cartel
          if (!data.startsWith('PARANA:')) {
            Alert.alert(
              'QR inválido',
              'Ese código no es de una parada.',
              [{ text: 'OK', onPress: () => { yaLeyo.current = false; } }],
              { cancelable: false },
            );
            return;
          }
          
          // Es de parada → sacamos el id
          const id = data.replace('PARANA:', '');
          console.log('Parada:', id);
          router.replace({ pathname: '/parada/[id]', params: {id} });
        }}
      />

      {/* ESTILO: marco guía sobre la cámara (no recibe toques) */}
      <View pointerEvents="none" style={styles.capa}>
        <View style={[styles.marco, { borderColor: c.acento }]} />
      </View>
    </View>
  );
}

// ESTILO: solo distribución
const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: espacio.xl, gap: espacio.l },
    capa: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  marco: { width: 240, height: 240, borderWidth: 4, borderRadius: radio.l },
});