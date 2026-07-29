import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MonitorSmartphone } from 'lucide-react-native';
import { authApi } from '../../api/auth';
import { Button } from '../../components/Button';
import { Typography } from '../../components/Typography';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';

export default function WebOnlyScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { refreshToken, logout } = useAuthStore();
  const currentColors = colors[theme];

  const signOut = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // Clear local credentials even when the network is unavailable.
    } finally {
      await logout();
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={[styles.icon, { backgroundColor: currentColors.primary + '18' }]}>
        <MonitorSmartphone color={currentColors.primary} size={36} />
      </View>
      <Typography variant="h1" style={styles.title}>Dùng phiên bản web</Typography>
      <Typography variant="body" color={currentColors.textSecondary} style={styles.copy}>
        Vai trò của bạn chưa có không gian làm việc trên ứng dụng di động. Hãy tiếp tục trên phiên bản web để dùng đầy đủ chức năng.
      </Typography>
      <Button title="Đăng xuất" variant="outline" onPress={() => void signOut()} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  icon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 24, textAlign: 'center' },
  copy: { marginTop: 12, textAlign: 'center', lineHeight: 22 },
  button: { marginTop: 32, alignSelf: 'stretch' },
});
