import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { enviarReporte, nuevoIdReporte, subirFoto } from '@/servicios/api';
import { ErrorApi } from '@/servicios/cliente';
import { guardarEnCola } from '@/servicios/colaReportes';
import { useSesion } from '@/sesion';
import { MotivoDemora } from '@/tipos';

// ESTILO: componentes y valores del tema
import { Boton, Texto } from '@/componentes/ui';
import { espacio, fuentes, radio, useColores } from '@/tema';

const MOTIVOS: [MotivoDemora, string][] = [
  ['no_paso', 'No pasó'],
  ['paso_lleno', 'Pasó lleno y no paró'],
  ['demorado', 'Viene demorado'],
  ['unidad_rota', 'Unidad rota'],
  ['calle_cortada', 'Calle cortada'],
];

export default function ReportarDemoraScreen() {
  const c = useColores(); // ESTILO: colores según modo claro/oscuro

  const { id_linea, id_parada } = useLocalSearchParams<{ id_linea: string; id_parada: string }>();
  const { usuario } = useSesion();
  const [motivo, setMotivo] = useState<MotivoDemora | null>(null);
  const [comentario, setComentario] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Reportar necesita sesión: la API saca el usuario del token
  if (!usuario) {
    return (
      <View style={[styles.center, { backgroundColor: c.fondo }]}>
        <Texto style={{ textAlign: 'center' }}>Para reportar una demora tenés que ingresar con tu cuenta.</Texto>
        <Boton titulo="Ingresar" variante="primario" onPress={() => router.push('/ingresar')} />
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
    <ScrollView
      style={{ backgroundColor: c.fondo }}
      contentContainerStyle={{ padding: espacio.l, gap: espacio.l, paddingBottom: espacio.xl * 2 }}
    >
      <View style={{ gap: espacio.s }}>
        <Texto variante="subtitulo">¿Qué pasó?</Texto>
        {MOTIVOS.map(([valor, texto]) => {
          const elegido = motivo === valor;
          return (
            <Pressable
              key={valor}
              onPress={() => setMotivo(valor)}
              accessibilityRole="radio"
              accessibilityState={{ selected: elegido }}
              style={[
                styles.opcion,
                elegido
                  ? { borderColor: c.acento, borderWidth: 2, backgroundColor: c.acentoSuave }
                  : { borderColor: c.borde, borderWidth: 1, backgroundColor: c.tarjeta },
              ]}
            >
              {/* ESTILO: círculo de opción (relleno si está elegida) */}
              <View style={[styles.circulo, { borderColor: elegido ? c.acento : c.textoSecundario }]}>
                {elegido && <View style={[styles.punto, { backgroundColor: c.acento }]} />}
              </View>
              <Texto variante={elegido ? 'cuerpoNegrita' : 'cuerpo'}>{texto}</Texto>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: espacio.s }}>
        <Texto variante="subtitulo">Comentario (opcional)</Texto>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: c.tarjeta, borderColor: c.borde, color: c.texto, fontFamily: fuentes.regular },
          ]}
          multiline
          maxLength={500}
          value={comentario}
          onChangeText={setComentario}
          placeholder="Ej.: hace 20 minutos que no pasa"
          placeholderTextColor={c.textoSecundario}
        />
      </View>

      <View style={{ gap: espacio.s }}>
        <Texto variante="subtitulo">Foto (opcional)</Texto>
        {foto ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: espacio.m }}>
            <Image source={{ uri: foto }} style={[styles.miniatura, { borderColor: c.borde }]} />
            <Boton titulo="Quitar foto" variante="peligro" onPress={() => setFoto(null)} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: espacio.m }}>
            <Boton titulo="Sacar foto" onPress={sacarFoto} style={{ flex: 1 }} />
            <Boton titulo="Galería" onPress={elegirDeGaleria} style={{ flex: 1 }} />
          </View>
        )}
      </View>

      <Boton
        titulo={enviando ? 'Enviando…' : 'Enviar reporte'}
        variante="primario"
        disabled={!motivo || enviando}
        onPress={enviar}
        style={(!motivo || enviando) ? { opacity: 0.5 } : undefined}
      />
    </ScrollView>
  );
}

// ESTILO: solo distribución; los colores salen de useColores()
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: espacio.xl, gap: espacio.m },
  opcion: { flexDirection: 'row', alignItems: 'center', gap: espacio.m, padding: espacio.m, borderRadius: radio.m },
  circulo: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  punto: { width: 10, height: 10, borderRadius: 5 },
  input: { borderWidth: 1, padding: espacio.m, borderRadius: radio.m, minHeight: 90, textAlignVertical: 'top', fontSize: 16 },
  miniatura: { width: 80, height: 80, borderRadius: radio.m, borderWidth: 1 },
});