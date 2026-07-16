import { Stack } from 'expo-router';

export default function PublicLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
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
