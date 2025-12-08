import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from './app/screens/Home';
import NewInvoice from './app/screens/NewInvoice';
import Services from './app/screens/Services';
import Preview from './app/screens/Preview';
import Settings from './app/screens/Settings';
// import { RootStackParamList } from './app/screens/types/navigation';
import { RootStackParamList } from './app/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: true }}>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="NewInvoice" component={NewInvoice} options={{ title: 'New Invoice' }} />
        <Stack.Screen name="Services" component={Services} />
        <Stack.Screen name="Preview" component={Preview} />
        <Stack.Screen name="Settings" component={Settings} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}