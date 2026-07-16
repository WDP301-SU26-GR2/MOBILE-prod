import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch } from 'react-native';
import { Typography } from '../../components/Typography';
import { Button } from '../../components/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const currentColors = colors[theme];
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    await logout();
    setLoading(false);
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: currentColors.primary }]}>
          <Typography variant="h1" font="headline" color="#fff">
            {user?.name?.charAt(0) || 'U'}
          </Typography>
        </View>
        <Typography variant="h2" font="headline" style={styles.name}>{user?.name || 'User Name'}</Typography>
        <Typography variant="body" color={currentColors.textSecondary}>{user?.email || 'user@example.com'}</Typography>
        
        <View style={[styles.roleBadge, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
          <Typography variant="label" font="label" color={currentColors.primary}>
            {user?.role || 'MANGAKA'}
          </Typography>
        </View>
      </View>

      <View style={[styles.section, { borderTopColor: currentColors.border }]}>
        <View style={styles.settingRow}>
          <Typography variant="bodyMedium">Dark Mode</Typography>
          <Switch 
            value={theme === 'dark'} 
            onValueChange={toggleTheme}
            trackColor={{ false: currentColors.border, true: currentColors.primary }}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <Button 
          title="Log Out" 
          variant="outlined" 
          onPress={handleLogout} 
          loading={loading}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', padding: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  name: { marginBottom: 4 },
  roleBadge: { marginTop: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  section: { padding: 24, borderTopWidth: 1 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { padding: 24 },
});
