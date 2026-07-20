import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Typography } from '../../components/Typography';
import { mangakaApi } from '../../api/mangaka';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { CheckSquare, Clock, Star, Users, Bell } from 'lucide-react-native';

export default function AssistantHome() {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await mangakaApi.getAssistantDashboard();
      setData(res);
    } catch (e) {
      console.log('Error fetching assistant dashboard', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: currentColors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={currentColors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: currentColors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboard(); }} />}
    >
      <View style={styles.header}>
        <Typography variant="h1">Xin chào, {user?.name || 'Trợ lý'}</Typography>
        <Typography variant="body" color={colors.textSecondary}>Bạn đã sẵn sàng làm việc chưa?</Typography>
      </View>

      {/* Thẻ Uy tín */}
      {data?.reputation && (
        <View style={[styles.reputationCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h3">Đánh giá chung</Typography>
            {data.reputation.isRecommended && (
              <View style={[styles.badge, { backgroundColor: currentColors.success }]}>
                <Typography variant="caption" color="#FFF">Được Đề Cử</Typography>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 16 }}>
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: 4 }}>
              <Star color="#FFD700" fill="#FFD700" size={24} />
              <Typography variant="h2">{data.reputation.ratingAvg ? data.reputation.ratingAvg.toFixed(1) : 'N/A'}</Typography>
              <Typography variant="caption" color={currentColors.textSecondary}>({data.reputation.ratingCount})</Typography>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Typography variant="h2" color={currentColors.primary}>{data.reputation.reputationScore || 0}</Typography>
              <Typography variant="caption" color={currentColors.textSecondary}>Điểm Uy Tín</Typography>
            </View>
          </View>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: currentColors.surface }]}>
          <CheckSquare color={currentColors.primary} size={24} style={{ marginBottom: 8 }} />
          <Typography variant="h2">{data?.tasks?.openTotal || 0}</Typography>
          <Typography variant="caption" color={currentColors.textSecondary}>Việc Đang Mở</Typography>
        </View>
        <View style={[styles.statCard, { backgroundColor: currentColors.surface }]}>
          <Users color={currentColors.warning} size={24} style={{ marginBottom: 8 }} />
          <Typography variant="h2">{data?.activeAssignments || 0}</Typography>
          <Typography variant="caption" color={currentColors.textSecondary}>Studio Đang Hợp Tác</Typography>
        </View>
      </View>
      
      <View style={[styles.statsRow, { marginTop: 16 }]}>
        <View style={[styles.statCard, { backgroundColor: currentColors.surface }]}>
          <Bell color={currentColors.error} size={24} style={{ marginBottom: 8 }} />
          <Typography variant="h2">{data?.unreadNotifications || 0}</Typography>
          <Typography variant="caption" color={currentColors.textSecondary}>Thông báo chưa đọc</Typography>
        </View>
      </View>

      <View style={styles.section}>
        <Typography variant="h3" style={{ marginBottom: 12 }}>Trạng Thái Công Việc</Typography>
        <View style={[styles.taskCard, { backgroundColor: currentColors.surface }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Typography variant="body">Bản nháp (DRAFT):</Typography>
            <Typography variant="bodyBold">{data?.tasks?.byStatus?.DRAFT || 0}</Typography>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Typography variant="body">Chờ duyệt (SUBMITTED):</Typography>
            <Typography variant="bodyBold" color={currentColors.warning}>{data?.tasks?.byStatus?.SUBMITTED || 0}</Typography>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Typography variant="body">Cần sửa lại (REVISION_REQUESTED):</Typography>
            <Typography variant="bodyBold" color={currentColors.error}>{data?.tasks?.byStatus?.REVISION_REQUESTED || 0}</Typography>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Typography variant="body">Đã hoàn thành (APPROVED):</Typography>
            <Typography variant="bodyBold" color={currentColors.success}>{data?.tasks?.byStatus?.APPROVED || 0}</Typography>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingBottom: 16 },
  reputationCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 16 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, elevation: 2 },
  section: { padding: 24 },
  taskCard: { padding: 16, borderRadius: 12, elevation: 2 }
});
