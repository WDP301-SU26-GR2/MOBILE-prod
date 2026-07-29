import { Stack } from 'expo-router';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';
import { ThemeToggle } from '../../components/ThemeToggle';

export default function PublicLayout() {
  const theme = useThemeStore((state) => state.theme);
  const currentColors = colors[theme];

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: currentColors.surface },
        headerTintColor: currentColors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: currentColors.background },
        headerRight: () => <ThemeToggle compact />,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Danh mục', headerShown: false }}
      />
      <Stack.Screen
        name="series/[id]"
        options={{ title: 'Chi tiết truyện', headerBackTitle: 'Quay lại' }}
      />
      <Stack.Screen
        name="chapter/[id]"
        options={{ title: 'Đọc truyện', headerShown: false }}
      />
      <Stack.Screen
        name="vote/index"
        options={{ title: 'Bình chọn truyện', headerBackTitle: 'Quay lại' }}
      />
      <Stack.Screen
        name="vote/live"
        options={{ title: 'Bình chọn trực tiếp', headerBackTitle: 'Quay lại' }}
      />
      <Stack.Screen
        name="ranking/index"
        options={{ title: 'Bảng xếp hạng', headerBackTitle: 'Quay lại' }}
      />
    </Stack>
  );
}
