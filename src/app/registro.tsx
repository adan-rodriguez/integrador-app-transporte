// Pantalla para crear una cuenta de pasajero.
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ErrorApi } from '@/servicios/cliente';
import { useSesion } from '@/sesion';
import { useColores } from '@/tema';

export default function PantallaRegistro() {
  const colores = useColores();
  const { registrarse } = useSesion();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function alRegistrarse() {
    if (nombre.trim() === '' || email.trim() === '' || contrasena === '') {
      setError('Completá tu nombre, el email y la contraseña.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await registrarse(nombre.trim(), email.trim(), contrasena);
      router.back();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'Algo salió mal.');
      setEnviando(false);
    }
  }

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo }]}>
      <TextInput
        value={nombre}
        onChangeText={setNombre}
        placeholder="Nombre"
        placeholderTextColor={colores.textoSecundario}
        style={[estilos.campo, { backgroundColor: colores.tarjeta, color: colores.texto }]}
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={colores.textoSecundario}
        autoCapitalize="none"
        keyboardType="email-address"
        style={[estilos.campo, { backgroundColor: colores.tarjeta, color: colores.texto }]}
      />
      <TextInput
        value={contrasena}
        onChangeText={setContrasena}
        placeholder="Contraseña"
        placeholderTextColor={colores.textoSecundario}
        secureTextEntry
        style={[estilos.campo, { backgroundColor: colores.tarjeta, color: colores.texto }]}
      />

      {error && <Text style={{ color: colores.error, fontSize: 16 }}>{error}</Text>}

      <Pressable
        onPress={alRegistrarse}
        disabled={enviando}
        style={[estilos.boton, { backgroundColor: colores.acento }]}>
        {enviando ? (
          <ActivityIndicator color={colores.textoSobreAcento} />
        ) : (
          <Text style={[estilos.textoBoton, { color: colores.textoSobreAcento }]}>Crear cuenta</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.replace('/ingresar')} style={estilos.enlace}>
        <Text style={{ color: colores.acento, fontSize: 16 }}>Ya tengo cuenta</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, padding: 24, gap: 12 },
  campo: { padding: 12, borderRadius: 8, fontSize: 16 },
  boton: { padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  textoBoton: { fontSize: 16, fontWeight: '600' },
  enlace: { padding: 8, alignItems: 'center' },
});

