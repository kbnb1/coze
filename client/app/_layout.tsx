import { Stack } from 'expo-router';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import { Provider } from '@/components/Provider';
import { useAuth } from '@/contexts/AuthContext';

import '../global.css';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
]);

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        headerShown: false,
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="account-detail" />
          <Stack.Screen name="launch" />
        </>
      ) : (
        <>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
        </>
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Provider>
      <AppContent />
      <Toast />
    </Provider>
  );
}
