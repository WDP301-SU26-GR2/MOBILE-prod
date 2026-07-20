import { Tabs, useRouter } from 'expo-router';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';
import { Home, BookOpen, Users, Trophy, Bell, UserCircle } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

export default function MangakaTabsLayout() {
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const router = useRouter();

  const HeaderProfileIcon = () => (
    <TouchableOpacity onPress={() => router.push('/(mangaka-tabs)/profile')} style={{ marginRight: 16 }}>
      <UserCircle color={currentColors.text} size={24} />
    </TouchableOpacity>
  );

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: currentColors.surface,
        borderTopColor: currentColors.border,
      },
      tabBarActiveTintColor: currentColors.primary,
      tabBarInactiveTintColor: currentColors.textSecondary,
    }}>
      <Tabs.Screen 
        name="index" 
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
        }} 
      />
      <Tabs.Screen 
        name="series_stack" 
        options={{
          title: 'Truyện',
          headerShown: false, // The stack handles its own headers if needed
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />
        }} 
      />
      <Tabs.Screen 
        name="studio" 
        options={{
          title: 'Xưởng',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />
        }} 
      />
      <Tabs.Screen 
        name="ranking" 
        options={{
          title: 'Xếp hạng',
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />
        }} 
      />
      <Tabs.Screen 
        name="inbox" 
        options={{
          title: 'Hộp thư',
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color, size }) => <UserCircle color={color} size={size} />
        }} 
      />
      {/* Hide assistants from bottom tab if we are going to migrate it later, or remove it */}
      <Tabs.Screen 
        name="assistants" 
        options={{
          href: null,
        }} 
      />

      <Tabs.Screen 
        name="earnings" 
        options={{
          href: null,
        }} 
      />
      <Tabs.Screen 
        name="review-inbox" 
        options={{
          href: null,
        }} 
      />
      <Tabs.Screen 
        name="deadline" 
        options={{
          href: null,
        }} 
      />
    </Tabs>
  );
}
