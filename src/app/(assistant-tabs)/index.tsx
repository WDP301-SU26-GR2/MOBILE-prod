import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Typography } from '../../components/Typography';
import { assistantReadApi } from '../../api/assistant';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { CheckSquare, Star, Users, Bell } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AssistantHome() {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await assistantReadApi.getDashboard();
      setData(res);
    } catch (e) {
      console.log('Error fetching assistant dashboard', (e as any)?.message || "Unknown error");
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
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <ScrollView 
        style={{ flex: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboard(); }} />}
    >
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <Typography variant="h1" numberOfLines={1}>Xin chào, {user?.name || 'Trợ lý'} 👋</Typography>
            <Typography variant="body" color={colors.textSecondary} style={{ marginTop: 4 }}>Bạn đã sẵn sàng làm việc chưa?</Typography>
          </View>
        </View>
      </View>

      {/* Thẻ Uy tín */}
      {data?.reputation && (
        <View style={[styles.reputationCard, { backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC', borderColor: currentColors.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Typography variant="h3">Uy tín & Đánh giá</Typography>
            {data.reputation.isRecommended && (
              <View style={[styles.badge, { backgroundColor: currentColors.success }]}>
                <Typography variant="caption" color="#FFF" style={{ fontWeight: 'bold' }}>Được Đề Cử 🌟</Typography>
              </View>
            )}
          </View>
          
          <View style={styles.reputationStats}>
            <View style={styles.reputationItem}>
              <Star color="#FFD700" fill="#FFD700" size={32} style={{ marginBottom: 4 }} />
              <Typography variant="h2">{data.reputation.ratingAvg ? data.reputation.ratingAvg.toFixed(1) : 'N/A'}</Typography>
              <Typography variant="caption" color={currentColors.textSecondary}>({data.reputation.ratingCount} lượt)</Typography>
            </View>
            
            <View style={styles.reputationDivider} />
            
            <View style={styles.reputationItem}>
              <Typography variant="h2" color={currentColors.primary} style={{ fontSize: 32, marginBottom: 4 }}>{data.reputation.reputationScore || 0}</Typography>
              <Typography variant="bodyBold" color={currentColors.text}>Điểm Uy Tín</Typography>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingBottom: 16 },
  profileIconWrapper: {
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 24,
    marginLeft: 12,
  },
  reputationCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  reputationStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 12,
  },
  reputationItem: {
    alignItems: 'center',
    flex: 1,
  },
  reputationDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(150,150,150,0.2)',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 16 },
  statCard: { 
    flex: 1, 
    padding: 20, 
    borderRadius: 16, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2 
  },
  section: { padding: 20 },
  taskCard: { 
    padding: 20, 
    borderRadius: 16, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2 
  }
});
