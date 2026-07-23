import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  let tabBarStyle = {
    backgroundColor: '#0A0A0F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,240,255,0.1)',
    paddingBottom: insets.bottom > 0 ? 8 : 4,
    paddingTop: 8,
    height: 60 + insets.bottom,
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
        tabBarActiveTintColor: '#00F0FF',
        tabBarInactiveTintColor: '#555570',
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '700',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '大厅',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="gamepad" size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: '订单',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="receipt" size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="shield-halved" size={18} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
