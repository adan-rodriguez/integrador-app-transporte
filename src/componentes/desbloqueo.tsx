import { ErrorApi } from "@/servicios/cliente";
import { useSesion } from "@/sesion";
import { useColores } from "@/tema";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Desbloqueo() {
  const {
    desbloquear,
    ingresar,
    continuarSinSesion,
    salir,
    usuarioRecordado,
    tieneSeguridadLocal,
  } = useSesion();
  const colores = useColores();

  const [verificandoBiometria, setVerificandoBiometria] = useState(false);
  const [contrasena, setContrasena] = useState("");
  const [mostrarClave, setMostrarClave] = useState(false);
  const [enviandoClave, setEnviandoClave] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tieneSeguridadLocal) return;

    const temporizador = setTimeout(() => {
      alTocarDesbloquear();
    }, 400);

    return () => clearTimeout(temporizador);
  }, [tieneSeguridadLocal]);

  async function alTocarDesbloquear() {
    setVerificandoBiometria(true);
    setError(null);
    const mensajeFallo = await desbloquear();
    if (mensajeFallo) {
      setError(mensajeFallo);
    }
    setVerificandoBiometria(false);
  }

  async function alIngresarConContrasena() {
    if (!contrasena) {
      setError("Ingresá tu contraseña para continuar.");
      return;
    }

    const email = usuarioRecordado?.email;
    if (!email) {
      setError(
        "No se encontró el email de la cuenta. Tocá 'Cambiar de cuenta'.",
      );
      return;
    }

    setEnviandoClave(true);
    setError(null);

    try {
      await ingresar(email, contrasena);
    } catch (e) {
      setError(
        e instanceof ErrorApi ? e.message : "Ha ocurrido un error inesperado.",
      );
    } finally {
      setEnviandoClave(false);
    }
  }

  return (
    <SafeAreaView
      style={[estilos.contenedor, { backgroundColor: colores.fondo }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={estilos.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={estilos.seccionUsuario}>
            <Text style={[estilos.saludo, { color: colores.texto }]}>
              {usuarioRecordado?.nombre
                ? `¡Hola, ${usuarioRecordado.nombre}!`
                : "¡Hola!"}
            </Text>
            {!tieneSeguridadLocal && (
              <Text
                style={[
                  estilos.textoSubtitulo,
                  { color: colores.textoSecundario },
                ]}
              >
                Ingresá tu contraseña para desbloquear tu cuenta
              </Text>
            )}
          </View>

          {tieneSeguridadLocal && (
            <View style={estilos.seccionBiometria}>
              <Pressable
                onPress={alTocarDesbloquear}
                disabled={verificandoBiometria || enviandoClave}
                style={({ pressed }) => [
                  estilos.botonHuella,
                  {
                    backgroundColor: colores.tarjeta,
                    borderColor: colores.acento,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                {verificandoBiometria ? (
                  <ActivityIndicator size="large" color={colores.acento} />
                ) : (
                  <Ionicons
                    name="finger-print-outline"
                    size={58}
                    color={colores.acento}
                  />
                )}
              </Pressable>
              <Text
                style={[
                  estilos.textoAyudaHuella,
                  { color: colores.textoSecundario },
                ]}
              >
                Tocá la huella para desbloquear
              </Text>
            </View>
          )}

          {error && (
            <View
              style={[
                estilos.cajaError,
                {
                  backgroundColor: colores.error + "15",
                  borderColor: colores.error,
                },
              ]}
            >
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={colores.error}
              />
              <Text style={[estilos.textoError, { color: colores.error }]}>
                {error}
              </Text>
            </View>
          )}

          {tieneSeguridadLocal && (
            <View style={estilos.divisorFila}>
              <View
                style={[
                  estilos.lineaDivisora,
                  { backgroundColor: colores.borde },
                ]}
              />
              <Text
                style={[
                  estilos.textoDivisor,
                  { color: colores.textoSecundario },
                ]}
              >
                o con tu contraseña
              </Text>
              <View
                style={[
                  estilos.lineaDivisora,
                  { backgroundColor: colores.borde },
                ]}
              />
            </View>
          )}

          <View style={estilos.bloqueClave}>
            <View
              style={[
                estilos.contenedorInput,
                {
                  backgroundColor: colores.tarjeta,
                  borderColor: colores.borde,
                },
              ]}
            >
              <TextInput
                value={contrasena}
                onChangeText={(t) => {
                  setContrasena(t);
                  if (error) setError(null);
                }}
                placeholder="Tu contraseña"
                placeholderTextColor={colores.textoSecundario}
                secureTextEntry={!mostrarClave}
                style={[estilos.inputClave, { color: colores.texto }]}
                onSubmitEditing={alIngresarConContrasena}
                returnKeyType="done"
                autoCapitalize="none"
              />
              <Pressable
                onPress={() => setMostrarClave(!mostrarClave)}
                hitSlop={10}
                style={{ padding: 10 }}
              >
                <Ionicons
                  name={mostrarClave ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colores.textoSecundario}
                />
              </Pressable>
            </View>

            <Pressable
              onPress={alIngresarConContrasena}
              disabled={enviandoClave || !contrasena}
              style={[
                estilos.botonIngresar,
                {
                  backgroundColor: colores.acento,
                  opacity: enviandoClave || !contrasena ? 0.6 : 1,
                },
              ]}
            >
              {enviandoClave ? (
                <ActivityIndicator color={colores.textoSobreAcento} />
              ) : (
                <Text
                  style={[
                    estilos.textoBotonIngresar,
                    { color: colores.textoSobreAcento },
                  ]}
                >
                  Ingresar
                </Text>
              )}
            </Pressable>
          </View>

          <View style={estilos.seccionAcciones}>
            <Pressable
              onPress={continuarSinSesion}
              style={[estilos.botonInvitado, { borderColor: colores.borde }]}
            >
              <Text style={[estilos.textoInvitado, { color: colores.acento }]}>
                Continuar sin iniciar sesión
              </Text>
            </Pressable>

            <Pressable onPress={salir} style={estilos.botonCerrar}>
              <Text style={[estilos.textoCerrar, { color: colores.error }]}>
                Cerrar sesión / Cambiar de cuenta
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    justifyContent: "center",
    minHeight: "100%",
    gap: 20,
  },
  seccionUsuario: {
    alignItems: "center",
    gap: 6,
  },
  saludo: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  textoSubtitulo: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  seccionBiometria: {
    alignItems: "center",
    gap: 10,
    marginVertical: 4,
  },
  botonHuella: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  textoAyudaHuella: {
    fontSize: 13,
  },
  cajaError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  textoError: {
    fontSize: 14,
    flex: 1,
  },
  divisorFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  lineaDivisora: {
    flex: 1,
    height: 1,
  },
  textoDivisor: {
    fontSize: 13,
    fontWeight: "500",
  },
  bloqueClave: {
    gap: 10,
  },
  contenedorInput: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
  },
  inputClave: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  botonIngresar: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  textoBotonIngresar: {
    fontSize: 15,
    fontWeight: "600",
  },
  seccionAcciones: {
    marginTop: 10,
    gap: 12,
    alignItems: "center",
  },
  botonInvitado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    width: "100%",
    justifyContent: "center",
  },
  textoInvitado: {
    fontSize: 15,
    fontWeight: "600",
  },
  botonCerrar: {
    padding: 8,
  },
  textoCerrar: {
    fontSize: 14,
    fontWeight: "500",
  },
});
