import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography } from '../../../components/Typography';
import { mangakaApi } from '../../../api/mangaka';
import { useThemeStore } from '../../../store/useThemeStore';
import { colors } from '../../../theme/colors';
import { WebOnlyBanner } from '../../../components/WebOnlyBanner';

export default function SeriesRequestDetailScreen() {
  const { id } = useLocalSearchParams();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const theme = useThemeStore((state: any) => state.theme) as 'light' | 'dark';
  const currentColors = colors[theme];

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await mangakaApi.getSeriesRequest(id as string);
      setRequest(res);
    } catch (e) {
      console.error('Error fetching series request detail', (e as any)?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchDetail();
  }, [id, fetchDetail]);

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

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: currentColors.background }]}>
        <ActivityIndicator size="large" color={currentColors.primary} />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={[styles.center, { backgroundColor: currentColors.background }]}>
        <Typography variant="body" color={currentColors.textSecondary}>Không tìm thấy yêu cầu</Typography>
        <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.back()}>
          <Typography variant="bodyBold" color={currentColors.primary}>Quay lại</Typography>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Typography variant="body" style={{ color: currentColors.primary }}>← Quay lại</Typography>
        </TouchableOpacity>
        <Typography variant="h3">Chi tiết yêu cầu</Typography>
        <View style={{ width: 60 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.badge, { backgroundColor: currentColors.primary }]}>
              <Typography variant="caption" style={{ color: '#FFF', fontWeight: 'bold' }}>
                {getRequestTypeName(request.requestType)}
              </Typography>
            </View>
            <View style={[styles.badge, { backgroundColor: getStatusColor(request.status) }]}>
              <Typography variant="caption" style={{ color: '#FFF' }}>
                {request.status === 'PENDING' ? 'Đang chờ duyệt' : request.status === 'ACCEPTED' ? 'Đã duyệt' : request.status === 'REJECTED' ? 'Bị từ chối' : 'Đã huỷ'}
              </Typography>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Typography variant="body" color={currentColors.textSecondary}>Truyện:</Typography>
            <TouchableOpacity onPress={() => router.push(`/(mangaka-tabs)/series_stack/${request.seriesId}`)}>
              <Typography variant="bodyBold" color={currentColors.primary}>{request.series?.title || 'Chưa rõ'}</Typography>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoRow}>
            <Typography variant="body" color={currentColors.textSecondary}>Gửi ngày:</Typography>
            <Typography variant="bodyBold">{new Date(request.createdAt).toLocaleDateString('vi-VN')} {new Date(request.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Typography>
          </View>
          
          <View style={styles.infoRow}>
            <Typography variant="body" color={currentColors.textSecondary}>Cập nhật lần cuối:</Typography>
            <Typography variant="bodyBold">{new Date(request.updatedAt || request.createdAt).toLocaleDateString('vi-VN')}</Typography>
          </View>
        </View>

        {(request.status === 'REJECTED' && !!request.rejectReason) ? (
          <View style={[styles.alertCard, { backgroundColor: `${currentColors.error}15`, borderColor: currentColors.error }]}>
            <Typography variant="h3" color={currentColors.error} style={{ marginBottom: 8 }}>❌ Lý do từ chối</Typography>
            <Typography variant="body" color={currentColors.error}>{request.rejectReason}</Typography>
          </View>
        ) : null}

        {!!request.decisionNote ? (
          <View style={[styles.alertCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
            <Typography variant="h3" style={{ marginBottom: 8 }}>📝 Ghi chú quyết định</Typography>
            <Typography variant="body">{request.decisionNote}</Typography>
          </View>
        ) : null}

      </ScrollView>
      
      <WebOnlyBanner message="Huỷ yêu cầu / Gửi yêu cầu mới → dùng bản web" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { padding: 8, marginLeft: -8 },
  scrollContent: { padding: 16, gap: 16 },
  mainCard: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  alertCard: { borderWidth: 1, borderRadius: 12, padding: 16 },
});
