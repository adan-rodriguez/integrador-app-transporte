import { View, Text, StyleSheet, TextInput, Button, Alert } from 'react-native';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();

  const handleLogin = async () => {
    // TODO: Llamar a la API real para validar las credenciales.
    // Por ahora simulamos que fue exitoso y nos devolvió un token mock.
    if (email.length > 0 && password.length > 0) {
      const mockToken = "mock_jwt_token_12345";
      await signIn(mockToken);
    } else {
      Alert.alert("Error", "Ingrese email y contraseña");
    }
  };

  const handleRegister = () => {
    // TODO: Navegar a una pantalla de registro o llamar a API
    Alert.alert("Aviso", "Implementar flujo de registro");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ingresar</Text>
      
      <Text style={styles.label}>Email:</Text>
      <TextInput 
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Contraseña:</Text>
      <TextInput 
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <View style={styles.spacer} />

      <Button title="Iniciar Sesión" onPress={handleLogin} />
      
      <View style={styles.spacer} />
      
      <Button title="Registrarse" onPress={handleRegister} color="gray" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  label: { fontSize: 16, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginTop: 4, borderRadius: 4 },
  spacer: { marginVertical: 8 }
});

