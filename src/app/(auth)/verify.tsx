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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const email = (params.email as string) || '';

  const handleVerify = async (otpCode: string) => {
    try {
      setLoading(true);
      await authApi.verifyEmail({ email, code: otpCode });
      Alert.alert('Thành công', 'Đã xác thực tài khoản! Vui lòng đăng nhập.');
      router.replace('/(auth)/login');
    } catch (error: any) {
      const errRes = error.response?.data;
      if (errRes?.code === 'Error.ValidationFailed' && errRes.errors) {
        const newErrors: Record<string, string> = {};
        errRes.errors.forEach((e: any) => {
          if (e.path) newErrors[e.path] = e.message;
        });
        setFieldErrors(newErrors);
      } else {
        Alert.alert('Lỗi', errRes?.message || 'Xác thực thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (text: string) => {
    setCode(text);
    if (fieldErrors.code) setFieldErrors(prev => ({ ...prev, code: '' }));
    if (text.length === 6) {
      handleVerify(text);
    }
  };

  const resendOtp = async () => {
    if (!email) return Alert.alert('Thiếu email', 'Hãy quay lại bước đăng ký để nhận mã xác thực.');
    try {
      setResending(true);
      await authApi.sendOtpEmail({ email, purpose: 'REGISTER' });
      Alert.alert('Đã gửi mã', 'Vui lòng kiểm tra email và thư mục Spam.');
    } catch (error: any) {
      Alert.alert('Không thể gửi lại mã', error.response?.data?.message || 'Vui lòng thử lại sau.');
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, { backgroundColor: currentColors.background }]}
    >
      <View style={styles.header}>
        <Typography variant="h1" font="headline" style={styles.title}>Xác Thực Email</Typography>
        <Typography variant="body" color={currentColors.textSecondary}>
          Chúng tôi đã gửi một mã đến {email}. Hãy nhập mã đó vào bên dưới để xác thực tài khoản.
        </Typography>
      </View>
      
      <View style={styles.form}>
        <TextInput
          label="Mã Xác Thực"
          placeholder="Nhập mã 6 số"
          value={code}
          error={fieldErrors.code}
          onChangeText={handleCodeChange}
          keyboardType="number-pad"
          maxLength={6}
          style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
        />
        
        <Button title="Xác Thực" onPress={() => handleVerify(code)} loading={loading} style={styles.button} />
        <Button title="Gửi lại mã OTP" variant="outline" onPress={() => void resendOtp()} loading={resending} />
        
        <Typography variant="caption" color={currentColors.textSecondary} style={{ textAlign: 'center', marginTop: 16 }}>
          Vui lòng kiểm tra hộp thư đến và hòm thư Spam để nhận mã OTP.
        </Typography>
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
