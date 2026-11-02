import Ionicons from "@react-native-vector-icons/ionicons";
import { View } from "react-native";

type Props = {
  angulo: number | null; // null = todavía no sabemos hacia dónde
  tamano?: number;
  color?: string;
};

export default function FlechaRumbo({ angulo, tamano = 32, color = "#212121" }: Props) {
  return (
    <View style={{ transform: [{ rotate: `${angulo ?? 0}deg` }], opacity: angulo === null ? 0.3 : 1 }}>
      <Ionicons name="arrow-up" size={tamano} color={color} />
    </View>
  );
}