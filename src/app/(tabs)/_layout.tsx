import { Tabs } from 'expo-router';
// Opcional: importar iconos de vector-icons
// import { Ionicons } from '@expo/vector-icons'; // TODO: instalar @expo/vector-icons

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'blue' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          // tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="lineas"
        options={{
          title: 'Líneas',
          // tabBarIcon: ({ color }) => <Ionicons name="bus" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          // tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

