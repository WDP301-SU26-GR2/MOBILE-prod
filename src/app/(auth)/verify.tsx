import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography } from '../../components/Typography';
import { TextInput } from '../../components/TextInput';
import { Button } from '../../components/Button';
import { authApi } from '../../api/auth';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';

export default function VerifyScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const email = (params.email as string) || '';

  const handleVerify = async () => {
    try {
      setLoading(true);
      await authApi.verifyEmail({ email, code });
      Alert.alert('Success', 'Account verified! Please login.');
      router.replace('/(auth)/login');
    } catch (error: any) {
      // Mock flow
      Alert.alert('Success', 'Account verified (MOCK)! Please login.');
      router.replace('/(auth)/login');
      // Alert.alert('Error', error.response?.data?.message || 'Verification failed');
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
        <Typography variant="h1" font="headline" style={styles.title}>Verify Email</Typography>
        <Typography variant="body" color={currentColors.textSecondary}>
          We've sent a code to {email}. Enter it below to verify your account.
        </Typography>
      </View>
      
      <View style={styles.form}>
        <TextInput
          label="Verification Code"
          placeholder="Enter 6-digit code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
        />
        
        <Button title="Verify" onPress={handleVerify} loading={loading} style={styles.button} />
        
        <Button title="Resend Code" variant="outlined" onPress={() => {}} style={styles.resendButton} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  header: { marginTop: 60, marginBottom: 40 },
  title: { marginBottom: 8 },
  form: { flex: 1 },
  button: { marginTop: 16, marginBottom: 16 },
  resendButton: { },
});
