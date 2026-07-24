import { Stack, useSegments } from 'expo-router';
import { LogBox } from 'react-native';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { Provider } from '@/components/Provider';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';

import '../global.css';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
]);

function AppContent() {
  const { user, isLoading } = useAuth();
  const router = useSafeRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/');
    }
  }, [user, isLoading, segments, router]);

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
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="account-detail" />
      <Stack.Screen name="launch" />
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
