import React, { useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/Typography';
import { mangakaApi } from '../../api/mangaka';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { AlertTriangle, Clock, BookOpen, CheckSquare, Settings, UserCircle } from 'lucide-react-native';

export default function MangakaHome() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchDashboard = async () => {
    try {
      const dashData = await mangakaApi.getMangakaDashboard();
      setData(dashData);
    } catch (e) {
      console.log('Error fetching overview', e);
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: currentColors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={currentColors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Typography variant="h1">Dashboard</Typography>
            <TouchableOpacity onPress={() => router.push('/(mangaka-tabs)/user-info')}>
              <UserCircle color={currentColors.text} size={32} />
            </TouchableOpacity>
          </View>
          <Typography variant="body" color={colors.textSecondary}>Tổng quan hoạt động</Typography>
        </View>

      {data?.rankings?.some((r: any) => r.isAtRisk || r.riskLevel === 'SEVERE' || r.riskLevel === 'MEDIUM') && (
        <View style={[styles.warningCard, { backgroundColor: theme === 'dark' ? '#3B1A1A' : '#FFEBEB' }]}>
          <AlertTriangle color={currentColors.error} size={24} />
          <View style={{ flex: 1 }}>
            <Typography variant="bodyBold" color={currentColors.error}>Cảnh báo Xếp hạng</Typography>
            <Typography variant="caption" color={currentColors.error}>
              Một trong các truyện của bạn đang có nguy cơ tụt hạng. Hãy kiểm tra lại!
            </Typography>
          </View>
        </View>
      )}

      <View style={styles.grid}>
        <View style={[styles.card, { backgroundColor: currentColors.surface }]}>
          <BookOpen color={currentColors.primary} size={24} style={{ marginBottom: 8 }} />
          <Typography variant="h2">{data?.studio?.length || 0}</Typography>
          <Typography variant="caption" color={currentColors.textSecondary}>Chapter Đang Làm</Typography>
        </View>

        <View style={[styles.card, { backgroundColor: currentColors.surface }]}>
          <Clock color={currentColors.warning} size={24} style={{ marginBottom: 8 }} />
          <Typography variant="h2">{data?.unreadNotifications || 0}</Typography>
          <Typography variant="caption" color={currentColors.textSecondary}>Thông báo chưa đọc</Typography>
        </View>

        <View style={[styles.card, { backgroundColor: currentColors.surface }]}>
          <CheckSquare color={currentColors.error} size={24} style={{ marginBottom: 8 }} />
          <Typography variant="h2">{data?.openRevisionRequests || 0}</Typography>
          <Typography variant="caption" color={currentColors.textSecondary}>Vòng sửa còn mở</Typography>
        </View>
      </View>

      {data?.studio && data.studio.length > 0 && (() => {
        const sortedStudio = [...data.studio].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
        const nearest = sortedStudio[0];
        if (!nearest.deadline) return null;
        return (
          <View style={styles.section}>
            <Typography variant="h3" style={{ marginBottom: 12 }}>Hạn Chót Gần Nhất</Typography>
            <View style={[styles.deadlineCard, { backgroundColor: currentColors.surface, borderLeftColor: currentColors.error }]}>
              <Typography variant="bodyBold">{nearest.seriesTitle} - Ch. {nearest.chapterNumber}</Typography>
              <Typography variant="body" color={currentColors.error}>Hạn: {new Date(nearest.deadline).toLocaleDateString()}</Typography>
            </View>
          </View>
        );
      })()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingBottom: 16 },
  warningCard: { 
    marginHorizontal: 16, 
    marginBottom: 16, 
    padding: 16, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: 12,
    gap: 8 
  },
  card: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 4,
    marginBottom: 8
  },
  section: { padding: 16, marginTop: 8 },
  deadlineCard: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  }
});
