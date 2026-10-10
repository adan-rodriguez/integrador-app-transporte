import { View, Text, StyleSheet, TextInput, Button, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { enviarReporte } from '../../../servicios/api';
import { MotivoDemora } from '../../../tipos';

export default function ReportarDemoraScreen() {
  const { id_linea, id_parada } = useLocalSearchParams();
  const router = useRouter();
  
  const [motivo, setMotivo] = useState<MotivoDemora>('demorado');
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  // TODO: Implementar expo-image-picker o expo-camera para adjuntar una foto al reporte
  // const [fotoUri, setFotoUri] = useState<string | null>(null);

  const handleSubmit = async () => {
    setEnviando(true);
    // TODO: Usar expo-network para ver si hay conexión. 
    // Si no hay, guardar en sqlite local para sincronizar después.
    try {
      await enviarReporte({
        lineaId: id_linea as string,
        paradaId: id_parada as string,
        usuarioId: 'usr-320', // ID harcodeado temporalmente
        motivo,
        comentario,
        fotoUri: null, // Asignar la URI de la foto
        confirmaciones: 1,
        fechaHora: new Date().toISOString(),
      });
      // TODO: Usar expo-haptics para vibrar confirmando el reporte
      Alert.alert("Reporte enviado", "Gracias por avisar a otros pasajeros.");
      router.back();
    } catch (e) {
      Alert.alert("Error", "No se pudo enviar el reporte");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Avisar Demora</Text>
      
      {/* TODO: Reemplazar por un Picker real (e.g. @react-native-picker/picker) */}
      <Text style={styles.label}>Motivo (WIP: usar picker):</Text>
      <TextInput 
        style={styles.input} 
        value={motivo} 
        onChangeText={(text) => setMotivo(text as MotivoDemora)} 
      />

      <Text style={styles.label}>Comentario opcional:</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        value={comentario}
        onChangeText={setComentario}
      />

      <Button title="Adjuntar Foto (WIP)" onPress={() => {}} />

      <View style={styles.spacer} />

      <Button 
        title={enviando ? "Enviando..." : "Enviar Reporte"} 
        onPress={handleSubmit} 
        disabled={enviando} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 16, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginTop: 4, borderRadius: 4 },
  textArea: { height: 100, textAlignVertical: 'top' },
  spacer: { marginVertical: 16 }
});

