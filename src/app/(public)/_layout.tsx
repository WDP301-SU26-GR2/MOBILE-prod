import { Stack } from 'expo-router';
import { Image } from 'expo-image';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';

export default function PublicLayout() {
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const appAvatarUrl = process.env.EXPO_PUBLIC_APP_AVATAR_URL;

  return (
    <Stack 
      screenOptions={{ 
        headerShown: true,
        headerStyle: { backgroundColor: currentColors.surface },
        headerTintColor: currentColors.text,
        headerShadowVisible: false,
        headerRight: () =>
          appAvatarUrl ? (
            <Image
              source={{ uri: appAvatarUrl }}
              style={{ width: 36, height: 36, borderRadius: 18, marginRight: 8 }}
              contentFit="cover"
            />
          ) : null,
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
        name="ranking/index" 
        options={{ title: 'Bảng xếp hạng', headerBackTitle: 'Quay lại' }} 
      />
    </Stack>
  );
}
