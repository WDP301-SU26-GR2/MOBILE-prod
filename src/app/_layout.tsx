import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { HankenGrotesk_700Bold } from '@expo-google-fonts/hanken-grotesk';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '../theme/colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    HankenGrotesk_700Bold,
    JetBrainsMono_400Regular,
  });

  const { hydrate, isLoading, accessToken, user } = useAuthStore();
  const { theme } = useThemeStore();
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
    const inPublicGroup = segments[0] === '(public)';
    const isRoot = !segments[0] || segments[0] === '';
    
    if (!accessToken) {
      // Not logged in: must be in public or auth. If at root, go to public. If trying to access protected, go to login.
      if (isRoot) {
        setTimeout(() => router.replace('/(public)'), 0);
      } else if (!inAuthGroup && !inPublicGroup) {
        setTimeout(() => router.replace('/(auth)/login'), 0);
      }
    } else {
      // Logged in: must be in their respective tabs. If at root, public, or auth, go to tabs
      if (isRoot || inAuthGroup || inPublicGroup) {
        setTimeout(() => {
          if (user?.role === 'ASSISTANT') {
            router.replace('/(assistant-tabs)');
          } else {
            router.replace('/(mangaka-tabs)');
          }
        }, 0);
      }
    }
  }, [accessToken, user, segments, isLoading, fontsLoaded, fontError, router]);

  if (!fontsLoaded && !fontError || isLoading) {
    return null;
  }

  const currentColors = colors[theme];

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: currentColors.background }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: currentColors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(public)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(mangaka-tabs)" />
        <Stack.Screen name="(assistant-tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
