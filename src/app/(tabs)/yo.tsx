// Pestaña "Yo": la cuenta. Sin sesión ofrece ingresar o crear una cuenta;
// con sesión muestra los datos y permite salir.
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSesion } from '@/sesion';
import { useColores } from '@/tema';

export default function PantallaYo() {
  const colores = useColores();
  const { usuario, salir } = useSesion();

  if (!usuario) {
    return (
      <View style={[estilos.pantalla, { backgroundColor: colores.fondo }]}>
        <Text style={[estilos.titulo, { color: colores.texto }]}>Tu cuenta</Text>
        <Text style={{ color: colores.textoSecundario, fontSize: 16 }}>
          Ingresá para guardar tus líneas y paradas favoritas y poder reportar demoras.
        </Text>
        <Pressable
          onPress={() => router.push('/ingresar')}
          style={[estilos.boton, { backgroundColor: colores.acento }]}>
          <Text style={[estilos.textoBoton, { color: colores.textoSobreAcento }]}>Ingresar</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/registro')}
          style={[estilos.boton, { borderWidth: 1, borderColor: colores.acento }]}>
          <Text style={[estilos.textoBoton, { color: colores.acento }]}>Crear cuenta</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo }]}>
      <Text style={[estilos.titulo, { color: colores.texto }]}>{usuario.nombre}</Text>
      <Text style={{ color: colores.textoSecundario, fontSize: 16 }}>{usuario.email}</Text>

      <View style={[estilos.tarjeta, { backgroundColor: colores.tarjeta }]}>
        <Text style={{ color: colores.texto, fontSize: 16 }}>
          Líneas favoritas: {usuario.lineasFavoritas.length}
        </Text>
        <Text style={{ color: colores.texto, fontSize: 16 }}>
          Paradas favoritas: {usuario.paradasFavoritas.length}
        </Text>
      </View>

      <Pressable onPress={salir} style={[estilos.boton, { borderWidth: 1, borderColor: colores.error }]}>
        <Text style={[estilos.textoBoton, { color: colores.error }]}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, padding: 24, gap: 16 },
  titulo: { fontSize: 24, fontWeight: '600' },
  tarjeta: { padding: 12, borderRadius: 8, gap: 4 },
  boton: { padding: 14, borderRadius: 8, alignItems: 'center' },
  textoBoton: { fontSize: 16, fontWeight: '600' },
});

