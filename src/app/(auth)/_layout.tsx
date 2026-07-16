import { Stack } from 'expo-router';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';

export default function AuthLayout() {
  const { theme } = useThemeStore();
  const currentColors = colors[theme];

  return (
    <Stack screenOptions={{ 
      headerShown: false,
      contentStyle: { backgroundColor: currentColors.background }
    }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify" />
    </Stack>
  );
}
