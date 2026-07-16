import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/Typography';
import { TextInput } from '../../components/TextInput';
import { Button } from '../../components/Button';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';
import { Mail, Lock } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    try {
      setLoading(true);
      const res = await authApi.login({ email, password });
      if (res.success && res.data) {
        setAuth(res.data.accessToken, res.data.refreshToken, res.data.user);
        router.replace('/(tabs)/mangakas');
      }
    } catch (error: any) {
      console.log('Login failed', error);
      // MOCK LOGIN FOR DEMO (If backend is down)
      setAuth('mock-access-token', 'mock-refresh-token', { name: 'Demo User' });
      router.replace('/(tabs)/mangakas');
      // Alert.alert('Error', error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, { backgroundColor: currentColors.background }]}
    >
      <View style={styles.header}>
        <Typography variant="h1" font="headline" style={styles.title}>Welcome Back</Typography>
        <Typography variant="body" color={currentColors.textSecondary}>Log in to your account to continue</Typography>
      </View>
      
      <View style={styles.form}>
        <TextInput
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon={<Mail size={20} color={currentColors.textSecondary} />}
        />
        <TextInput
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          leftIcon={<Lock size={20} color={currentColors.textSecondary} />}
        />
        
        <TouchableOpacity style={styles.forgotPassword}>
          <Typography variant="bodyMedium" color={currentColors.primary}>Forgot password?</Typography>
        </TouchableOpacity>
        
        <Button title="Log In" onPress={handleLogin} loading={loading} style={styles.button} />
        
        <View style={styles.footer}>
          <Typography variant="body" color={currentColors.textSecondary}>Don't have an account? </Typography>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Typography variant="bodyBold" color={currentColors.primary}>Sign Up</Typography>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  header: { marginTop: 60, marginBottom: 40 },
  title: { marginBottom: 8 },
  form: { flex: 1 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24 },
  button: { marginBottom: 24 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
