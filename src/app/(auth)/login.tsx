import React, { useCallback, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/Typography';
import { TextInput } from '../../components/TextInput';
import { Button } from '../../components/Button';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';
import { Mail, Lock, BookOpen, ChevronLeft } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập cả email và mật khẩu.');
      return;
    }
    try {
      setLoading(true);
      const res = await authApi.login({ email: email.trim(), password });
      if (res.success && res.data) {
        const userRole = typeof res.data.user.role === 'string' ? res.data.user.role : res.data.user.role?.code;
        const sessionUser = { ...res.data.user, mustChangePassword: res.data.mustChangePassword };
        if (userRole === 'ASSISTANT') {
          await setAuth(res.data.accessToken, res.data.refreshToken, sessionUser);
          router.replace((res.data.mustChangePassword ? '/(auth)/change-password' : '/(assistant-tabs)') as any);
        } else if (userRole === 'MANGAKA') {
          await setAuth(res.data.accessToken, res.data.refreshToken, sessionUser);
          router.replace((res.data.mustChangePassword ? '/(auth)/change-password' : '/(mangaka-tabs)') as any);
        } else {
          await setAuth(res.data.accessToken, res.data.refreshToken, sessionUser);
          router.replace('/(auth)/web-only' as any);
        }
      }
    } catch (error: any) {
      console.log('Login failed', error, (error as any)?.response?.data);
      const errRes = error.response?.data;
      if (errRes?.code === 'Error.ValidationFailed' && errRes.errors) {
        const newErrors: Record<string, string> = {};
        errRes.errors.forEach((e: any) => {
          if (e.path) newErrors[e.path] = e.message;
        });
        setFieldErrors(newErrors);
      } else {
        Alert.alert('Lỗi Đăng nhập', errRes?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const [, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '354884405038-6dj70vo6jeifdeq3h7s0f0eps5lj19v0.apps.googleusercontent.com',
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '354884405038-6dj70vo6jeifdeq3h7s0f0eps5lj19v0.apps.googleusercontent.com',
  });

  const handleGoogleSuccess = useCallback(async (token: string) => {
    try {
      setLoading(true);
      // Giả lập xử lý token hoặc gửi về BE
      const res = await authApi.loginWithGoogle({ idToken: token });
      if (res.success && res.data) {
        const userRole = typeof res.data.user.role === 'string' ? res.data.user.role : res.data.user.role?.code;
        const sessionUser = { ...res.data.user, mustChangePassword: res.data.mustChangePassword };
        if (userRole === 'ASSISTANT') {
          await setAuth(res.data.accessToken, res.data.refreshToken, sessionUser);
          router.replace((res.data.mustChangePassword ? '/(auth)/change-password' : '/(assistant-tabs)') as any);
        } else if (userRole === 'MANGAKA') {
          await setAuth(res.data.accessToken, res.data.refreshToken, sessionUser);
          router.replace((res.data.mustChangePassword ? '/(auth)/change-password' : '/(mangaka-tabs)') as any);
        } else {
          await setAuth(res.data.accessToken, res.data.refreshToken, sessionUser);
          router.replace('/(auth)/web-only' as any);
        }
      }
    } catch (error: any) {
      console.log('Google login api call failed', error, (error as any)?.response?.data);
      Alert.alert('Lỗi Đăng nhập', error.response?.data?.message || 'Đăng nhập Google thất bại.');
    } finally {
      setLoading(false);
    }
  }, [router, setAuth]);

  React.useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token;
      if (idToken) {
        void handleGoogleSuccess(idToken);
      } else {
        Alert.alert('Không thể đăng nhập Google', 'Google không trả về ID token. Vui lòng thử lại.');
      }
    }
  }, [response, handleGoogleSuccess]);

  const handleGoogleLogin = async () => {
    promptAsync();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, { backgroundColor: currentColors.background, paddingTop: Math.max(insets.top, 24) }]}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Quay về trang dành cho khách"
        onPress={() => router.replace('/(public)')}
        style={styles.backButton}
      >
        <ChevronLeft size={20} color={currentColors.primary} />
        <Typography variant="bodyMedium" color={currentColors.primary}>
          Về trang đọc truyện
        </Typography>
      </TouchableOpacity>

      <View style={styles.header}>
        <Typography variant="h1" font="headline" style={styles.title}>Chào Mừng Trở Lại</Typography>
        <Typography variant="body" color={currentColors.textSecondary}>Đăng nhập vào tài khoản của bạn để tiếp tục</Typography>
      </View>
      
      <View style={styles.form}>
        <TextInput
          label="Email"
          placeholder="Nhập email của bạn"
          value={email}
          error={fieldErrors.email}
          onChangeText={(text) => {
            setEmail(text);
            if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon={<Mail size={20} color={currentColors.textSecondary} />}
        />
        <TextInput
          label="Mật khẩu"
          placeholder="Nhập mật khẩu của bạn"
          value={password}
          error={fieldErrors.password}
          onChangeText={(text) => {
            setPassword(text);
            if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
          }}
          secureTextEntry
          leftIcon={<Lock size={20} color={currentColors.textSecondary} />}
        />
        
        <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/(auth)/forgot-password')}>
          <Typography variant="bodyMedium" color={currentColors.primary}>Quên mật khẩu?</Typography>
        </TouchableOpacity>
        
        <Button title="Đăng Nhập" onPress={handleLogin} loading={loading} style={styles.button} />
        <Button 
          title="Tiếp tục với Google" 
          variant="outline"
          onPress={handleGoogleLogin} 
          loading={loading}
          style={styles.button} 
        />
        
        <View style={styles.footer}>
          <Typography variant="body" color={currentColors.textSecondary}>Chưa có tài khoản? </Typography>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Typography variant="bodyBold" color={currentColors.primary}>Đăng ký ngay</Typography>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.guestLink}
          onPress={() => router.replace('/(public)')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <BookOpen size={16} color={currentColors.textSecondary} />
            <Typography variant="bodyMedium" color={currentColors.textSecondary}>
              Truy cập dạng Khách (Không cần tài khoản)
            </Typography>
          </View>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  backButton: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  header: { marginTop: 32, marginBottom: 40 },
  title: { marginBottom: 8 },
  form: { flex: 1 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24 },
  button: { marginBottom: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  guestLink: { marginTop: 32, alignItems: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 8 },
});
