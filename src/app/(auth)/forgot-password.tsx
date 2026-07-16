import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/Typography';
import { TextInput } from '../../components/TextInput';
import { Button } from '../../components/Button';
import { authApi } from '../../api/auth';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      await authApi.sendOtpEmail({ email });
      Alert.alert('Thành công', 'Mã OTP đã được gửi đến email của bạn.');
      // Chuyển sang màn Reset Password (S-AUTH-06)
      // router.push({ pathname: '/(auth)/reset-password', params: { email } });
    } catch (error: any) {
      Alert.alert('Thông báo', 'Tính năng Quên mật khẩu đang được cập nhật');
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
        <Typography variant="h1" font="headline" style={styles.title}>Quên Mật Khẩu</Typography>
        <Typography variant="body" color={currentColors.textSecondary}>
          Nhập email của bạn và chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
        </Typography>
      </View>
      
      <View style={styles.form}>
        <TextInput
          label="Email"
          placeholder="Nhập email của bạn"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <Button title="Gửi Mã OTP" onPress={handleSendOtp} loading={loading} style={styles.button} />
        
        <Button title="Quay lại Đăng Nhập" variant="outlined" onPress={() => router.back()} />
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
});
