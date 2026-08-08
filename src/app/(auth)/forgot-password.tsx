import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/Typography';
import { TextInput } from '../../components/TextInput';
import { Button } from '../../components/Button';
import { authApi } from '../../api/auth';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';
import { Mail, Lock, ShieldCheck } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Lỗi', 'Vui lòng nhập email hợp lệ.');
      return;
    }

    try {
      setLoading(true);
      await authApi.sendOtpEmail({ email: email.trim(), purpose: 'FORGOT_PASSWORD' });
      Alert.alert('Mã OTP đã được gửi', `Chúng tôi đã gửi mã xác nhận OTP đến ${email}. Vui lòng kiểm tra hộp thư.`);
      setStep('reset');
    } catch (error: any) {
      const errRes = error.response?.data;
      if (errRes?.code === 'Error.EmailNotFound') {
        Alert.alert('Lỗi', 'Email này chưa được đăng ký trong hệ thống.');
      } else {
        Alert.alert('Lỗi', errRes?.message || 'Không thể gửi mã OTP. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code || code.length < 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã OTP 6 số.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải từ 8 ký tự trở lên.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setLoading(true);
      await authApi.forgotPassword({
        email,
        code,
        newPassword,
        confirmNewPassword,
      });

      Alert.alert(
        'Thành công',
        'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.',
        [{ text: 'Đăng nhập ngay', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      const errRes = error.response?.data;
      Alert.alert('Thất bại', errRes?.message || 'Không thể đặt lại mật khẩu. Vui lòng kiểm tra lại OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, { backgroundColor: currentColors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
        <View style={styles.header}>
          <Typography variant="h1" font="headline" style={styles.title}>Quên Mật Khẩu</Typography>
          <Typography variant="body" color={currentColors.textSecondary}>
            {step === 'email' 
              ? 'Nhập email của bạn và chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.' 
              : 'Nhập mã OTP vừa nhận và tạo mật khẩu mới cho tài khoản của bạn.'}
          </Typography>
        </View>
        
        <View style={styles.form}>
          <TextInput
            label="Địa chỉ Email"
            placeholder="Nhập email của bạn"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={step === 'email'}
            leftIcon={<Mail size={20} color={currentColors.textSecondary} />}
          />
          
          {step === 'email' ? (
            <>
              <Button title="Gửi Mã OTP" onPress={handleSendOtp} loading={loading} style={styles.button} />
              <Button title="Quay lại Đăng Nhập" variant="outlined" onPress={() => router.back()} />
            </>
          ) : (
            <>
              <TextInput
                label="Mã xác nhận OTP"
                placeholder="Nhập mã 6 số"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                leftIcon={<ShieldCheck size={20} color={currentColors.textSecondary} />}
              />

              <TextInput
                label="Mật khẩu mới"
                placeholder="Tối thiểu 8 ký tự, có hoa/thường/số"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                leftIcon={<Lock size={20} color={currentColors.textSecondary} />}
              />

              <TextInput
                label="Xác nhận Mật khẩu mới"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry
                leftIcon={<Lock size={20} color={currentColors.textSecondary} />}
              />

              <Button title="Đặt Lại Mật Khẩu" onPress={handleResetPassword} loading={loading} style={styles.button} />
              
              <TouchableOpacity 
                style={styles.resendLink} 
                onPress={() => setStep('email')}
              >
                <Typography variant="bodyMedium" color={currentColors.primary}>
                  Thay đổi email hoặc gửi lại OTP
                </Typography>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  header: { marginTop: 60, marginBottom: 32 },
  title: { marginBottom: 8 },
  form: { flex: 1 },
  button: { marginTop: 16, marginBottom: 16 },
  resendLink: { alignItems: 'center', marginTop: 12 },
});
