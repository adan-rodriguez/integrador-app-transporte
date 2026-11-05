import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { enviarReporte, nuevoIdReporte, subirFoto } from '@/servicios/api';
import { ErrorApi } from '@/servicios/cliente';
import { useSesion } from '@/sesion';
import { MotivoDemora } from '@/tipos';
import { guardarEnCola } from '@/servicios/colaReportes';

const MOTIVOS: [MotivoDemora, string][] = [
  ['no_paso', 'No pasó'],
  ['paso_lleno', 'Pasó lleno y no paró'],
  ['demorado', 'Viene demorado'],
  ['unidad_rota', 'Unidad rota'],
  ['calle_cortada', 'Calle cortada'],
];

export default function ReportarDemoraScreen() {
  const { id_linea, id_parada } = useLocalSearchParams<{ id_linea: string; id_parada: string }>();
  const { usuario } = useSesion();
  const [motivo, setMotivo] = useState<MotivoDemora | null>(null);
  const [comentario, setComentario] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Reportar necesita sesión: la API saca el usuario del token
  if (!usuario) {
    return (
      <View style={styles.center}>
        <Text style={{ textAlign: 'center' }}>Para reportar una demora tenés que ingresar con tu cuenta.</Text>
        <Pressable style={styles.boton} onPress={() => router.push('/ingresar')}>
          <Text>Ingresar</Text>
        </Pressable>
      </View>
    );
  }

  async function sacarFoto() {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) return Alert.alert('Sin permiso', 'Necesitamos la cámara para sacar la foto.');
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!r.canceled) setFoto(r.assets[0].uri);
  }

  async function elegirDeGaleria() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!r.canceled) setFoto(r.assets[0].uri);
  }

    async function enviar() {
    if (!motivo) return;
    setEnviando(true);
    // Lo armamos antes de intentar, así si no hay red guardamos exactamente este (con el mismo id)
    const reporte = {
      id: nuevoIdReporte(),
      lineaId: id_linea,
      paradaId: id_parada,
      motivo,
      comentario: comentario.trim() || null,
      fotoUri: null as string | null,
      fechaHora: new Date().toISOString(),
    };
    try {
      if (foto) reporte.fotoUri = await subirFoto(foto);
      await enviarReporte(reporte);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Reporte enviado', 'Gracias por avisar a los otros pasajeros.');
      router.back();
    } catch (e) {
      if (e instanceof ErrorApi && e.esDeRed) {
        // Sin conexión: queda en la cola y se manda solo cuando vuelva la red
        guardarEnCola({ ...reporte, fotoUri: null }, foto);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Sin conexión', 'Guardamos tu reporte y lo enviamos apenas vuelva la conexión.');
        router.back();
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const mensaje = e instanceof ErrorApi ? e.message : 'No se pudo enviar el reporte.';
        Alert.alert('No se pudo enviar', mensaje);
      }
    } finally {
      setEnviando(false);
    }
  }
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={{ gap: 8 }}>
        <Text style={styles.subtitulo}>¿Qué pasó?</Text>
        {MOTIVOS.map(([valor, texto]) => (
          <Pressable
            key={valor}
            onPress={() => setMotivo(valor)}
            style={[styles.opcion, motivo === valor && styles.opcionElegida]}
          >
            <Text>{texto}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ gap: 6 }}>
        <Text style={styles.subtitulo}>Comentario (opcional)</Text>
        <TextInput
          style={styles.input}
          multiline
          maxLength={500}
          value={comentario}
          onChangeText={setComentario}
          placeholder="Ej.: hace 20 minutos que no pasa"
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={styles.subtitulo}>Foto (opcional)</Text>
        {foto ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Image source={{ uri: foto }} style={{ width: 80, height: 80, borderRadius: 8 }} />
            <Pressable style={styles.boton} onPress={() => setFoto(null)}>
              <Text>Quitar foto</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable style={[styles.boton, { flex: 1 }]} onPress={sacarFoto}>
              <Text style={{ textAlign: 'center' }}>Sacar foto</Text>
            </Pressable>
            <Pressable style={[styles.boton, { flex: 1 }]} onPress={elegirDeGaleria}>
              <Text style={{ textAlign: 'center' }}>Galería</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Pressable
        style={[styles.enviar, (!motivo || enviando) && { opacity: 0.5 }]}
        disabled={!motivo || enviando}
        onPress={enviar}
      >
        <Text style={{ color: '#fff', fontWeight: '600', textAlign: 'center' }}>
          {enviando ? 'Enviando…' : 'Enviar reporte'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  subtitulo: { fontSize: 17, fontWeight: '600' },
  opcion: { padding: 12, borderWidth: 1, borderColor: '#bbb', borderRadius: 10 },
  opcionElegida: { borderColor: '#333', borderWidth: 2, backgroundColor: '#eee' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, minHeight: 80, textAlignVertical: 'top' },
  boton: { padding: 12, borderWidth: 1, borderRadius: 8, alignItems: 'center' },
  enviar: { padding: 14, borderRadius: 10, backgroundColor: '#e67e00' },
});