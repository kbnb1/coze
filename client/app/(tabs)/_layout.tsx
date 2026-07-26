import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [background, muted, accent, border] = useCSSVariable([
    '--color-background',
    '--color-muted',
    '--color-accent',
    '--color-border',
  ]) as string[];

  let tabBarStyle = {
    backgroundColor: '#0F0F1A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingBottom: insets.bottom > 0 ? insets.bottom - 8 : 8,
    paddingTop: 8,
    height: 60 + (insets.bottom > 0 ? insets.bottom : 0),
  };

  if (Platform.OS === 'web') {
    tabBarStyle = {
      ...tabBarStyle,
      height: 'auto' as unknown as number,
    };
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#555570',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '上号',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="gamepad" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: '订单',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="receipt" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="user" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
