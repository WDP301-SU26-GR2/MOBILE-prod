import { Stack } from 'expo-router';

export default function SeriesStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="create" options={{ presentation: 'modal' }} />
      <Stack.Screen name="chapter/[chapterId]" options={{ presentation: 'card' }} />
      <Stack.Screen name="name-workspace" options={{ presentation: 'fullScreenModal' }} />
    </Stack>
  );
}
