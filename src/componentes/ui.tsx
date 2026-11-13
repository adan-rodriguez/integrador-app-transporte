import { ReactNode } from "react";
import {
    ActivityIndicator,
    Pressable,
    PressableProps,
    StyleProp,
    Text,
    TextProps,
    View,
    ViewStyle,
} from "react-native";

import { espacio, radio, textoSobre, texto as tipografia, useColores } from "@/tema";
import { Gravedad } from "@/tipos";

/*Texto*/

type Variante = keyof typeof tipografia;

export function Texto({
  variante = "cuerpo",
  secundario = false,
  style,
  ...props
}: TextProps & { variante?: Variante; secundario?: boolean }) {
  const c = useColores();
  return (
    <Text
      {...props}
      style={[tipografia[variante], { color: secundario ? c.textoSecundario : c.texto }, style]}
    />
  );
}

/* Tarjeta */

export function Tarjeta({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColores();
  return (
    <View
      style={[
        {
          backgroundColor: c.tarjeta,
          borderColor: c.borde,
          borderWidth: 1,
          borderRadius: radio.m,
          padding: espacio.m,
          gap: espacio.xs,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* Botón  */

type VarianteBoton = "primario" | "secundario" | "peligro";

export function Boton({
  titulo,
  variante = "secundario",
  style,
  ...props
}: PressableProps & { titulo: string; variante?: VarianteBoton; style?: StyleProp<ViewStyle> }) {
  const c = useColores();
  const fondo = variante === "primario" ? c.acento : "transparent";
  const colorTexto =
    variante === "primario" ? c.textoSobreAcento : variante === "peligro" ? c.error : c.acento;
  const borde = variante === "peligro" ? c.error : c.acento;

  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      style={({ pressed }) => [
        {
          backgroundColor: fondo,
          borderColor: borde,
          borderWidth: 1,
          borderRadius: radio.m,
          paddingVertical: 14,
          paddingHorizontal: espacio.l,
          alignItems: "center",
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Text style={[tipografia.cuerpoNegrita, { color: colorTexto }]}>{titulo}</Text>
    </Pressable>
  );
}

/* Selector segmentado: Ida/Vuelta, tipo de día, Lista/Mapa */

export function Selector<T extends string>({
  opciones,
  valor,
  onCambiar,
}: {
  opciones: { valor: T; texto: string; detalle?: string }[];
  valor: T;
  onCambiar: (v: T) => void;
}) {
  const c = useColores();
  return (
    <View
      style={{
        flexDirection: "row",
        borderWidth: 1,
        borderColor: c.borde,
        borderRadius: radio.m,
        overflow: "hidden",
      }}
    >
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <Pressable
            key={o.valor}
            onPress={() => onCambiar(o.valor)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            style={{ flex: 1, padding: 10, backgroundColor: activo ? c.acento : c.tarjeta }}
          >
            <Text
              style={[
                tipografia.cuerpoNegrita,
                { textAlign: "center", color: activo ? c.textoSobreAcento : c.texto },
              ]}
            >
              {o.texto}
            </Text>
            {o.detalle && (
              <Text
                style={[
                  tipografia.secundario,
                  { textAlign: "center", color: activo ? c.textoSobreAcento : c.textoSecundario },
                ]}
              >
                {o.detalle}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/* Chip de línea */

export function ChipLinea({ numero, color }: { numero: string; color: string }) {
  return (
    <View
      style={{
        backgroundColor: color,
        borderRadius: radio.s,
        minWidth: 32,
        paddingHorizontal: espacio.s,
        paddingVertical: 2,
        alignItems: "center",
      }}
    >
      <Text style={[tipografia.cuerpoNegrita, { color: textoSobre(color) }]}>{numero}</Text>
    </View>
  );
}

/* Colores según la gravedad del aviso */

export function useColorGravedad(g: Gravedad) {
  const c = useColores();
  if (g === "suspension") return { color: c.suspension, fondo: c.suspensionFondo };
  if (g === "desvio") return { color: c.desvio, fondo: c.desvioFondo };
  return { color: c.informativo, fondo: c.informativoFondo };
}

/* Banner "sin conexión" dentro de una pantalla */

export function BannerSinRed({ mensaje }: { mensaje: string }) {
  const c = useColores();
  return (
    <View style={{ backgroundColor: c.desvioFondo, borderRadius: radio.m, padding: espacio.m }}>
      <Text style={[tipografia.secundario, { color: c.desvio }]}>{mensaje}</Text>
    </View>
  );
}

/*  Indicador de carga centrado */

export function Cargando() {
  const c = useColores();
  return (
    <View style={{ flex: 1, justifyContent: "center", backgroundColor: c.fondo }}>
      <ActivityIndicator color={c.acento} />
    </View>
  );
}