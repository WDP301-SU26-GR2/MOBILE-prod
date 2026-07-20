import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput as RNTextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/Typography';
import { Button } from '../../components/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';
import { useRouter } from 'expo-router';
import { Moon, Sun, LogOut, Lock, User } from 'lucide-react-native';
import { apiClient } from '../../api/client';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const currentColors = colors[theme];
  const router = useRouter();

  const [displayName, setDisplayName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  // Change password state
  const [showPassSection, setShowPassSection] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await apiClient.patch('/me', { displayName: displayName || '' });
      Alert.alert('Thành công', 'Đã cập nhật thông tin.');
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể lưu thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPass !== confirmPass) {
      Alert.alert('Lỗi', 'Mật khẩu mới và xác nhận không khớp.');
      return;
    }
    if (newPass.length < 8) {
      Alert.alert('Lỗi', 'Mật khẩu phải ít nhất 8 ký tự.');
      return;
    }
    try {
      setChangingPass(true);
      await apiClient.post('/auth/change-password', { currentPassword: currentPass, newPassword: newPass });
      Alert.alert('Thành công', 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.');
      setShowPassSection(false);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể đổi mật khẩu');
    } finally {
      setChangingPass(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.post('/auth/logout');
          } catch (_) {}
          logout();
          router.replace('/(auth)/login');
        }
      }
    ]);
  };

  const inputStyle = [styles.input, { backgroundColor: currentColors.surface, color: currentColors.text, borderColor: currentColors.border }];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={[styles.header, { borderBottomColor: currentColors.border }]}>
        <Typography variant="h2">Hồ sơ & Tài khoản</Typography>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topHeader}>
          <View style={[styles.avatar, { backgroundColor: currentColors.primary }]}>
            <Typography variant="h1" font="headline" color="#fff">
              {user?.name?.charAt(0) || 'U'}
            </Typography>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
            <Typography variant="label" font="label" color={currentColors.primary}>
              {user?.role || 'ASSISTANT'}
            </Typography>
          </View>
        </View>

        {/* Profile Info */}
        <View style={[styles.section, { backgroundColor: currentColors.surface }]}>
          <View style={styles.sectionHeader}>
            <User color={currentColors.primary} size={20} />
            <Typography variant="h3" style={{ marginLeft: 8 }}>Thông tin cá nhân</Typography>
          </View>

          <Typography variant="caption" color={currentColors.textSecondary} style={{ marginBottom: 4 }}>Email</Typography>
          <View style={[styles.readOnlyField, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}>
            <Typography color={currentColors.textSecondary}>{user?.email || 'Chưa có email'}</Typography>
          </View>

          <Typography variant="caption" color={currentColors.textSecondary} style={{ marginTop: 12, marginBottom: 4 }}>Tên hiển thị</Typography>
          <RNTextInput
            style={inputStyle}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Nhập tên hiển thị..."
            placeholderTextColor={currentColors.textSecondary}
          />

          <Button title="Lưu thay đổi" onPress={handleSaveProfile} loading={saving} style={{ marginTop: 16 }} />
        </View>

        {/* Theme Toggle */}
        <View style={[styles.section, { backgroundColor: currentColors.surface }]}>
          <View style={styles.settingRow}>
            {theme === 'dark' ? <Moon color={currentColors.primary} size={20} /> : <Sun color={currentColors.warning} size={20} />}
            <Typography variant="body" style={{ flex: 1, marginLeft: 12 }}>Giao diện tối</Typography>
            <TouchableOpacity
              style={[styles.toggle, { backgroundColor: theme === 'dark' ? currentColors.primary : currentColors.border }]}
              onPress={toggleTheme}
            >
              <View style={[styles.toggleKnob, { marginLeft: theme === 'dark' ? 24 : 2 }]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Change Password */}
        <View style={[styles.section, { backgroundColor: currentColors.surface }]}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => setShowPassSection(!showPassSection)}>
            <Lock color={currentColors.primary} size={20} />
            <Typography variant="h3" style={{ marginLeft: 8, flex: 1 }}>Đổi mật khẩu</Typography>
            <Typography color={currentColors.textSecondary}>{showPassSection ? '▲' : '▼'}</Typography>
          </TouchableOpacity>

          {showPassSection && (
            <View style={{ marginTop: 12 }}>
              <Typography variant="caption" color={currentColors.textSecondary} style={{ marginBottom: 4 }}>Mật khẩu hiện tại</Typography>
              <RNTextInput style={inputStyle} value={currentPass} onChangeText={setCurrentPass} secureTextEntry placeholder="••••••••" placeholderTextColor={currentColors.textSecondary} />

              <Typography variant="caption" color={currentColors.textSecondary} style={{ marginTop: 12, marginBottom: 4 }}>Mật khẩu mới</Typography>
              <RNTextInput style={inputStyle} value={newPass} onChangeText={setNewPass} secureTextEntry placeholder="Ít nhất 8 ký tự" placeholderTextColor={currentColors.textSecondary} />

              <Typography variant="caption" color={currentColors.textSecondary} style={{ marginTop: 12, marginBottom: 4 }}>Xác nhận mật khẩu</Typography>
              <RNTextInput style={inputStyle} value={confirmPass} onChangeText={setConfirmPass} secureTextEntry placeholder="Nhập lại mật khẩu mới" placeholderTextColor={currentColors.textSecondary} />

              <Button title="Đổi mật khẩu" onPress={handleChangePassword} loading={changingPass} style={{ marginTop: 16 }} />
            </View>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: theme === 'dark' ? '#3B1A1A' : '#FFF0F0', borderColor: currentColors.error }]}
          onPress={handleLogout}
        >
          <LogOut color={currentColors.error} size={20} />
          <Typography variant="bodyBold" color={currentColors.error} style={{ marginLeft: 12 }}>Đăng xuất</Typography>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  content: { padding: 16, gap: 16, paddingBottom: 48 },
  topHeader: { alignItems: 'center', marginBottom: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, borderWidth: 1 },
  section: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  readOnlyField: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  toggle: {
    width: 48,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
});
