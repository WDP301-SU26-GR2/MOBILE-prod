import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { HankenGrotesk_700Bold } from '@expo-google-fonts/hanken-grotesk';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '../theme/colors';
import { authApi } from '../api/auth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    HankenGrotesk_700Bold,
    JetBrainsMono_400Regular,
  });

  const { hydrate, isLoading, accessToken, user, setUser } = useAuthStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isLoading || !accessToken) return;
    void authApi.getMe().then((response) => {
      if (response?.data) void setUser({ ...useAuthStore.getState().user, ...response.data });
    }).catch(() => {
      // The interceptor owns token refresh/logout; keep root navigation stable.
    });
  }, [accessToken, isLoading, setUser]);

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
    const isRoot = !segments[0];
    
    if (!accessToken) {
      // Not logged in: must be in public or auth. If at root, go to public. If trying to access protected, go to login.
      if (isRoot) {
        setTimeout(() => router.replace('/(public)'), 0);
      } else if (!inAuthGroup && !inPublicGroup) {
        setTimeout(() => router.replace('/(auth)/login'), 0);
      }
    } else {
      const roleCode = typeof user?.role === 'string' ? user.role : user?.role?.code;
      if (user?.mustChangePassword && !(inAuthGroup && (segments[1] as string) === 'change-password')) {
        setTimeout(() => router.replace('/(auth)/change-password' as any), 0);
        return;
      }
      if (roleCode !== 'ASSISTANT' && roleCode !== 'MANGAKA') {
        if (!(inAuthGroup && (segments[1] as string) === 'web-only')) setTimeout(() => router.replace('/(auth)/web-only' as any), 0);
        return;
      }
      const expectedGroup = roleCode === 'ASSISTANT' ? '(assistant-tabs)' : '(mangaka-tabs)';
      if (segments[0] !== expectedGroup) {
        setTimeout(() => router.replace(roleCode === 'ASSISTANT' ? '/(assistant-tabs)' : '/(mangaka-tabs)'), 0);
      }
    }
  }, [accessToken, user, segments, isLoading, fontsLoaded, fontError, router]);

  if (!fontsLoaded && !fontError || isLoading) {
    return null;
  }

  const currentColors = colors[theme];

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: currentColors.background }}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
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
