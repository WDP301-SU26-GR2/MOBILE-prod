import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '../../api/auth';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';
import { Typography } from '../../components/Typography';
import { useAuthStore } from '../../store/useAuthStore';
import { colors } from '../../theme/colors';
import { useThemeStore } from '../../store/useThemeStore';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const { accessToken, refreshToken, user, setAuth } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) return Alert.alert('Thiếu thông tin', 'Vui lòng điền đủ các trường.');
    if (newPassword !== confirmPassword) return Alert.alert('Mật khẩu không khớp', 'Xác nhận mật khẩu mới chưa trùng khớp.');
    try {
      setLoading(true);
      await authApi.changePassword({ currentPassword, newPassword, confirmNewPassword: confirmPassword });
      if (accessToken && refreshToken && user) {
        const nextUser = { ...user, mustChangePassword: false };
        await setAuth(accessToken, refreshToken, nextUser);
        const roleCode = typeof nextUser.role === 'string' ? nextUser.role : nextUser.role?.code;
        router.replace(roleCode === 'ASSISTANT' ? '/(assistant-tabs)' : '/(mangaka-tabs)');
      }
    } catch (error: any) {
      Alert.alert('Không thể đổi mật khẩu', error.response?.data?.message || 'Vui lòng kiểm tra mật khẩu hiện tại và thử lại.');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View>
          <Typography variant="h1">Đặt mật khẩu mới</Typography>
          <Typography variant="body" color={currentColors.textSecondary} style={styles.description}>Tài khoản này cần đổi mật khẩu trước khi tiếp tục sử dụng ứng dụng.</Typography>
          <TextInput label="Mật khẩu hiện tại" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
          <TextInput label="Mật khẩu mới" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
          <TextInput label="Xác nhận mật khẩu mới" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
        </View>
        <Button title="Cập nhật mật khẩu" onPress={submit} loading={loading} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 }, content: { flex: 1, padding: 24, justifyContent: 'space-between' }, description: { marginTop: 8, marginBottom: 28, lineHeight: 22 } });
