import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography } from '../../../components/Typography';
import { mangakaApi } from '../../../api/mangaka';
import { useThemeStore } from '../../../store/useThemeStore';
import { colors } from '../../../theme/colors';
import { WebOnlyBanner } from '../../../components/WebOnlyBanner';

const TABS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PENDING', label: 'Đang chờ' },
  { id: 'ACCEPTED', label: 'Đã duyệt' },
  { id: 'REJECTED', label: 'Bị từ chối' },
  { id: 'CANCELLED', label: 'Đã huỷ' },
];

export default function SeriesRequestsScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  
  const router = useRouter();
  const theme = useThemeStore((state: any) => state.theme) as 'light' | 'dark';
  const currentColors = colors[theme];

  const fetchRequests = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const res = await mangakaApi.getAllSeriesRequests();
      setRequests(res?.items || res || []);
    } catch (e) {
      console.error('Error fetching series requests', (e as any)?.message || "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return currentColors.warning;
      case 'ACCEPTED': return currentColors.success;
      case 'REJECTED': return currentColors.error;
      case 'CANCELLED': return currentColors.textSecondary;
      default: return currentColors.textSecondary;
    }
  };

  const getRequestTypeName = (type: string) => {
    switch (type) {
      case 'WITHDRAW': return 'Rút hồ sơ';
      case 'HIATUS': return 'Tạm ngưng';
      case 'COMPLETION': return 'Kết thúc sớm';
      default: return type;
    }
  };

  const filteredRequests = requests.filter(r => activeTab === 'ALL' || r.status === activeTab);

  const renderItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]} 
        onPress={() => router.push(`/(mangaka-tabs)/series_stack/series-request-detail?id=${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <Typography variant="bodyBold">{item.series?.title || 'Không rõ truyện'}</Typography>
          <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
            <Typography variant="caption" style={{ color: '#FFF' }}>
              {item.status === 'PENDING' ? 'Đang chờ' : item.status === 'ACCEPTED' ? 'Đã duyệt' : item.status === 'REJECTED' ? 'Bị từ chối' : 'Đã huỷ'}
            </Typography>
          </View>
        </View>
        <Typography variant="body" style={{ color: currentColors.textSecondary, marginBottom: 8 }}>
          Loại yêu cầu: <Typography variant="bodyBold" style={{ color: currentColors.text }}>{getRequestTypeName(item.requestType)}</Typography>
        </Typography>
        
        {(item.status === 'REJECTED' && !!item.rejectReason) ? (
          <View style={[styles.rejectReasonBox, { backgroundColor: `${currentColors.error}15`, borderColor: currentColors.error }]}>
            <Typography variant="caption" style={{ color: currentColors.error }}>
              Lý do từ chối: {item.rejectReason}
            </Typography>
          </View>
        ) : null}
        
        <Typography variant="caption" style={{ color: currentColors.textSecondary, marginTop: item.status === 'REJECTED' ? 8 : 0 }}>
          Gửi ngày: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
        </Typography>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Typography variant="body" style={{ color: currentColors.primary }}>← Quay lại</Typography>
        </TouchableOpacity>
        <Typography variant="h3">Yêu cầu hệ thống</Typography>
        <View style={{ width: 60 }} />
      </View>
      
      <View style={[styles.tabBar, { borderBottomColor: currentColors.border }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TABS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[
                styles.tabItem, 
                activeTab === item.id && { borderBottomColor: currentColors.primary, borderBottomWidth: 2 }
              ]}
              onPress={() => setActiveTab(item.id)}
            >
              <Typography 
                variant="bodyBold" 
                style={{ color: activeTab === item.id ? currentColors.primary : currentColors.textSecondary }}
              >
                {item.label}
              </Typography>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchRequests(true)} tintColor={currentColors.primary} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Typography variant="body" style={{ color: currentColors.textSecondary, textAlign: 'center' }}>
                Không có yêu cầu nào
              </Typography>
            </View>
          ) : null
        }
      />
      
      <WebOnlyBanner message="Gửi yêu cầu rút hồ sơ / tạm ngưng / kết thúc sớm → dùng bản web" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { padding: 8, marginLeft: -8 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, height: 48 },
  tabItem: { paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, gap: 16 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  rejectReasonBox: { padding: 8, borderRadius: 8, borderWidth: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 64 },
});
