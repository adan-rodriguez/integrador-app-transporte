import { View, Text, StyleSheet, Button } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function PerfilScreen() {
  const { signOut } = useAuth();
  
  // TODO: 
  // 1. Integrar autenticación con expo-secure-store y expo-local-authentication (huella o rostro)
  // 2. Permitir el cambio de tema de la aplicación (claro, oscuro, sistema)
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil de Usuario</Text>
      
      <View style={styles.section}>
        <Text style={styles.subtitle}>Configuración</Text>
        <Button title="Cambiar Tema (WIP)" onPress={() => {}} />
        <Button title="Cerrar Sesión" color="red" onPress={signOut} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 18, marginTop: 16, marginBottom: 8, fontWeight: '600' },
  section: { marginVertical: 16 }
});

