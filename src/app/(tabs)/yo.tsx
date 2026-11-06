import { useSesion } from "@/sesion";
import { useColores } from "@/tema";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PantallaYo() {
  const colores = useColores();
  const { usuario, salir } = useSesion();

  if (!usuario) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={[estilos.pantalla, { backgroundColor: colores.fondo }]}
      >
        <Text style={[estilos.titulo, { color: colores.texto }]}>
          Tu cuenta
        </Text>
        <Text style={{ color: colores.textoSecundario, fontSize: 16 }}>
          Ingresá para guardar tus líneas y paradas favoritas y poder reportar
          demoras.
        </Text>
        <Link
          href="/ingresar"
          style={[
            estilos.boton,
            estilos.textoBoton,
            {
              backgroundColor: colores.acento,
              color: colores.textoSobreAcento,
            },
          ]}
        >
          Ingresar
        </Link>
        <Link
          href="/registro"
          style={[
            estilos.boton,
            estilos.textoBoton,
            {
              borderWidth: 1,
              borderColor: colores.acento,
              color: colores.acento,
            },
          ]}
        >
          Crear cuenta
        </Link>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={[estilos.pantalla, { backgroundColor: colores.fondo }]}
    >
      <Text style={[estilos.titulo, { color: colores.texto }]}>
        {usuario.nombre}
      </Text>
      <Text style={{ color: colores.textoSecundario, fontSize: 16 }}>
        {usuario.email}
      </Text>

      <View style={[estilos.tarjeta, { backgroundColor: colores.tarjeta }]}>
        <Text style={{ color: colores.texto, fontSize: 16 }}>
          Líneas favoritas: {usuario.lineasFavoritas.length}
        </Text>
        <Text style={{ color: colores.texto, fontSize: 16 }}>
          Paradas favoritas: {usuario.paradasFavoritas.length}
        </Text>
      </View>

      <Pressable
        onPress={salir}
        style={[estilos.boton, { borderWidth: 1, borderColor: colores.error }]}
      >
        <Text style={[estilos.textoBoton, { color: colores.error }]}>
          Cerrar sesión
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, padding: 24, gap: 16 },
  titulo: { fontSize: 24, fontWeight: "600" },
  tarjeta: { padding: 12, borderRadius: 8, gap: 4 },
  boton: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    textAlign: "center",
    overflow: "hidden",
  },
  textoBoton: { fontSize: 16, fontWeight: "600" },
});
