import { View, Text, Pressable, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef } from 'react';

export default function Escanear() {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const yaLeyo = useRef(false);

  // Caso 1: todavía no sabemos si hay permiso
  if (!permiso) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cargando cámara...</Text>
      </View>
    );
  }

  // Caso 2: no hay permiso → explicamos y lo pedimos
  if (!permiso.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 }}>
        <Text style={{ textAlign: 'center' }}>
          Necesitamos la cámara para leer el código QR de la parada.
        </Text>
        <Pressable
          onPress={pedirPermiso}
          style={{ backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Dar permiso</Text>
        </Pressable>
      </View>
    );
  }

  // Caso 3: hay permiso → mostramos la cámara
  return (
    <View style={{ flex: 1 }}>
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
        }}
      />
    </View>
  );
}