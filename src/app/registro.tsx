import { ErrorApi } from "@/servicios/cliente";
import { useSesion } from "@/sesion";
import { useColores } from "@/tema";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Link, router } from "expo-router";
import { type ComponentRef, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function PantallaRegistro() {
  const colores = useColores();
  const { registrarse } = useSesion();
  const refEmail = useRef<ComponentRef<typeof TextInput>>(null);
  const refContrasena = useRef<ComponentRef<typeof TextInput>>(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarClave, setMostrarClave] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function alRegistrarse() {
    if (nombre.trim() === "" || email.trim() === "" || contrasena === "") {
      setError("Completá tu nombre, el email y la contraseña.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await registrarse(nombre.trim(), email.trim(), contrasena);
      router.back();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "Algo salió mal.");
      setEnviando(false);
    }
  }

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo }]}>
      <TextInput
        value={nombre}
        onChangeText={(t) => {
          setNombre(t);
          if (error) setError(null);
        }}
        placeholder="Nombre"
        placeholderTextColor={colores.textoSecundario}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => refEmail.current?.focus()}
        autoCapitalize="words"
        style={[
          estilos.campo,
          { backgroundColor: colores.tarjeta, color: colores.texto },
        ]}
      />
      <TextInput
        ref={refEmail}
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          if (error) setError(null);
        }}
        placeholder="Email"
        placeholderTextColor={colores.textoSecundario}
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => refContrasena.current?.focus()}
        autoCorrect={false}
        style={[
          estilos.campo,
          { backgroundColor: colores.tarjeta, color: colores.texto },
        ]}
      />
      <View
        style={[estilos.contenedorClave, { backgroundColor: colores.tarjeta }]}
      >
        <TextInput
          ref={refContrasena}
          value={contrasena}
          onChangeText={(t) => {
            setContrasena(t);
            if (error) setError(null);
          }}
          placeholder="Contraseña"
          placeholderTextColor={colores.textoSecundario}
          secureTextEntry={!mostrarClave}
          style={[estilos.campoClave, { color: colores.texto }]}
          onSubmitEditing={alRegistrarse}
          returnKeyType="done"
          autoCapitalize="none"
        />
        <Pressable
          onPress={() => setMostrarClave(!mostrarClave)}
          hitSlop={10}
          style={estilos.botonOjo}
        >
          <Ionicons
            name={mostrarClave ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={colores.textoSecundario}
          />
        </Pressable>
      </View>

      {error && (
        <Text style={{ color: colores.error, fontSize: 16 }}>{error}</Text>
      )}

      <Pressable
        onPress={alRegistrarse}
        disabled={enviando}
        style={[estilos.boton, { backgroundColor: colores.acento }]}
      >
        {enviando ? (
          <ActivityIndicator color={colores.textoSobreAcento} />
        ) : (
          <Text
            style={[estilos.textoBoton, { color: colores.textoSobreAcento }]}
          >
            Crear cuenta
          </Text>
        )}
      </Pressable>

      <Link
        href="/ingresar"
        replace
        style={[estilos.enlace, { color: colores.acento }]}
      >
        Ya tengo cuenta
      </Link>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, padding: 24, gap: 12 },
  campo: { padding: 12, borderRadius: 8, fontSize: 16 },
  contenedorClave: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
  },
  campoClave: { flex: 1, padding: 12, fontSize: 16 },
  botonOjo: { paddingHorizontal: 12, paddingVertical: 8 },
  boton: { padding: 14, borderRadius: 8, alignItems: "center", marginTop: 4 },
  textoBoton: { fontSize: 16, fontWeight: "600" },
  enlace: { padding: 8, textAlign: "center", fontSize: 16 },
});
