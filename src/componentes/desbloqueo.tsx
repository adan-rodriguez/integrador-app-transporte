// Pantalla que aparece al abrir la app cuando hay una sesión guardada.
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useSesion } from '@/sesion';
import { useColores } from '@/tema';

export default function Desbloqueo() {
  const { desbloquear, salir } = useSesion();
  const colores = useColores();
  const [verificando, setVerificando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function alTocarDesbloquear() {
    setVerificando(true);
    setMensaje(null);
    setMensaje(await desbloquear());
    setVerificando(false);
  }

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo }]}>
      <Text style={[estilos.titulo, { color: colores.texto }]}>Transporte Paraná</Text>
      <Text style={[estilos.texto, { color: colores.textoSecundario }]}>
        Usá tu huella o tu rostro para entrar a tu cuenta.
      </Text>

      {mensaje && <Text style={[estilos.texto, { color: colores.error }]}>{mensaje}</Text>}

      <Pressable
        onPress={alTocarDesbloquear}
        disabled={verificando}
        style={[estilos.boton, { backgroundColor: colores.acento }]}>
        {verificando ? (
          <ActivityIndicator color={colores.textoSobreAcento} />
        ) : (
          <Text style={[estilos.textoBoton, { color: colores.textoSobreAcento }]}>Desbloquear</Text>
        )}
      </Pressable>

      {/* Alternativa a la huella: borrar la sesión guardada y entrar con la contraseña. */}
      <Pressable onPress={salir} style={estilos.enlace}>
        <Text style={[estilos.texto, { color: colores.acento }]}>Ingresar con otra cuenta</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  titulo: { fontSize: 24, fontWeight: '600' },
  texto: { fontSize: 16 },
  boton: { padding: 14, borderRadius: 8, alignItems: 'center' },
  textoBoton: { fontSize: 16, fontWeight: '600' },
  enlace: { padding: 8, alignItems: 'center' },
});

