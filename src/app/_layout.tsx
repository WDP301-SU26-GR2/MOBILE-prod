import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { HankenGrotesk_700Bold } from '@expo-google-fonts/hanken-grotesk';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../store/useAuthStore';
import { View, ActivityIndicator } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    HankenGrotesk_700Bold,
    JetBrainsMono_400Regular,
  });

  const { hydrate, isLoading, accessToken } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isLoading]);

  useEffect(() => {
    if (isLoading || (!fontsLoaded && !fontError)) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!accessToken && !inAuthGroup) {
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 0);
    } else if (accessToken && inAuthGroup) {
      setTimeout(() => {
        router.replace('/(tabs)/mangakas');
      }, 0);
    }
  }, [accessToken, segments, isLoading, fontsLoaded, fontError, router]);

  if (!fontsLoaded && !fontError || isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
