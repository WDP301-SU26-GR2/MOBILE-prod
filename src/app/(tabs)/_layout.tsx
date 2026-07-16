import { Tabs } from 'expo-router';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';
import { Users, UserCircle, Bell } from 'lucide-react-native';

export default function TabsLayout() {
  const { theme } = useThemeStore();
  const currentColors = colors[theme];

  return (
    <Tabs screenOptions={{
      headerStyle: {
        backgroundColor: currentColors.surface,
      },
      headerTintColor: currentColors.text,
      tabBarStyle: {
        backgroundColor: currentColors.surface,
        borderTopColor: currentColors.border,
      },
      tabBarActiveTintColor: currentColors.primary,
      tabBarInactiveTintColor: currentColors.textSecondary,
    }}>
      <Tabs.Screen 
        name="mangakas" 
        options={{
          title: 'Mangakas',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />
        }} 
      />
      <Tabs.Screen 
        name="assistants" 
        options={{
          title: 'Assistants',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />
        }} 
      />
      <Tabs.Screen 
        name="inbox" 
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <UserCircle color={color} size={size} />
        }} 
      />
    </Tabs>
  );
}
