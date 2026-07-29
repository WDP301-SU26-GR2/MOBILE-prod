import { Stack } from 'expo-router';

export default function TaskStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="chapter/[chapterId]" options={{ presentation: 'card' }} />
      <Stack.Screen name="revisions" options={{ presentation: 'card' }} />
    </Stack>
  );
}
