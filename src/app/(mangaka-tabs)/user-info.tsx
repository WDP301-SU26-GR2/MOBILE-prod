import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/Typography';
import { authApi } from '../../api/auth';
import { colors } from '../../theme/colors';
import { useThemeStore } from '../../store/useThemeStore';
import { ChevronLeft } from 'lucide-react-native';

export default function UserInfoScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const data = await authApi.getMe();
        setUserInfo(data);
      } catch (error) {
        console.log('Error fetching user info:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, []);

  const renderField = (label: string, value: string) => (
    <View style={[styles.fieldRow, { borderBottomColor: currentColors.border }]}>
      <Typography variant="bodyBold" color={currentColors.textSecondary} style={styles.label}>
        {label}
      </Typography>
      <Typography variant="body" style={styles.value}>
        {value || 'Không có thông tin'}
      </Typography>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={[styles.header, { borderBottomColor: currentColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={currentColors.text} size={24} />
        </TouchableOpacity>
        <Typography variant="h2">Thông tin Cá nhân</Typography>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={currentColors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
            {renderField('Họ và Tên', userInfo?.name)}
            {renderField('Email', userInfo?.email)}
            {renderField('Vai trò', userInfo?.role)}
            {renderField('Trạng thái Tài khoản', userInfo?.status || 'HOẠT ĐỘNG')}
            {renderField('Ngày tham gia', userInfo?.createdAt ? new Date(userInfo.createdAt).toLocaleDateString() : 'N/A')}
            {renderField('Giới thiệu', userInfo?.bio)}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: 16, 
    borderBottomWidth: 1 
  },
  backButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fieldRow: {
    padding: 16,
    borderBottomWidth: 1,
  },
  label: {
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
