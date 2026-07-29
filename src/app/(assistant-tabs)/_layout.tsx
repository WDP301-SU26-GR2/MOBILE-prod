import { Tabs } from 'expo-router';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';
import { Home, Users, CheckSquare, Bell, UserCircle } from 'lucide-react-native';

export default function AssistantTabsLayout() {
  const { theme } = useThemeStore();
  const currentColors = colors[theme];

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: currentColors.surface, borderTopColor: currentColors.border },
      tabBarActiveTintColor: currentColors.primary,
      tabBarInactiveTintColor: currentColors.textSecondary,
    }}>
      <Tabs.Screen 
        name="index" 
        options={{ title: 'Trang chủ', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} 
      />
      <Tabs.Screen 
        name="studio" 
        options={{ title: 'Xưởng', tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }} 
      />
      <Tabs.Screen 
        name="task_stack" 
        options={{ title: 'Nhiệm vụ', headerShown: false, tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} /> }} 
      />
      <Tabs.Screen 
        name="inbox" 
        options={{ title: 'Hộp thư', tabBarIcon: ({ color, size }) => <Bell color={color} size={size} /> }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ title: 'Hồ sơ', tabBarIcon: ({ color, size }) => <UserCircle color={color} size={size} /> }} 
      />
    </Tabs>
  );
}
