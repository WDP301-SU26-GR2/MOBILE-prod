import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Monitor } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Typography } from '../../components/Typography';
import { mangakaApi } from '../../api/mangaka';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ phản hồi', COUNTERED: 'Đã phản hồi ngược', AGREED: 'Đã đồng ý',
  REJECTED: 'Đã từ chối', WITHDRAWN: 'Đã thu hồi', FINALIZED: 'Đã chốt',
};

export default function DeadlineNegotiationScreen() {
  const router = useRouter();
  const { chapterId } = useLocalSearchParams<{ chapterId?: string }>();
  const theme = useThemeStore((state) => state.theme);
  const currentColors = colors[theme];
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState<any[]>([]);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      if (!chapterId) {
        const series = await mangakaApi.getAllMySeries();
        const chapterLists = await Promise.all((series?.items ?? []).map((item: any) => mangakaApi.getChapters(item.id)));
        setChapters(chapterLists.flatMap((result: any) => result?.items ?? result ?? []));
        setRequests([]);
      } else {
        const data = await mangakaApi.getDeadlineRequests({ chapterId, limit: 50, offset: 0 });
        setRequests(data?.items || data || []);
      }
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={[styles.header, { borderBottomColor: currentColors.border }]}>
        <TouchableOpacity accessibilityLabel="Quay lại" onPress={() => router.back()}><ChevronLeft color={currentColors.text} size={26} /></TouchableOpacity>
        <View style={styles.headerCopy}>
          <Typography variant="h2">Deadline</Typography>
          <Typography variant="caption" color={currentColors.textSecondary}>Chỉ xem trên mobile</Typography>
        </View>
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRequests} />} contentContainerStyle={styles.content}>
        <View style={[styles.webNotice, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
          <Monitor color={currentColors.primary} size={18} />
          <Typography variant="caption" color={currentColors.textSecondary} style={styles.noticeCopy}>Tạo, thu hồi và phản hồi deadline thực hiện trên bản web.</Typography>
        </View>
        {!chapterId && !loading && <View style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
          <Typography variant="bodyBold">Chọn chương để xem deadline</Typography>
          <Typography variant="caption" color={currentColors.textSecondary}>API yêu cầu chapterId. Mở từ chi tiết chương, hoặc chọn một chương bên dưới.</Typography>
          {chapters.map((chapter: any) => <TouchableOpacity key={chapter.id} onPress={() => router.push({ pathname: '/(mangaka-tabs)/deadline', params: { chapterId: chapter.id } } as any)} style={[styles.chapterChoice, { borderTopColor: currentColors.border }]}><Typography variant="body">{chapter.series?.title || 'Truyện'} · Chương {chapter.chapterNumber ?? chapter.number}</Typography></TouchableOpacity>)}
        </View>}
        {loading && <ActivityIndicator color={currentColors.primary} style={styles.loader} />}
        {!loading && requests.length === 0 && <Typography variant="body" color={currentColors.textSecondary} style={styles.empty}>Chưa có yêu cầu deadline nào.</Typography>}
        {requests.map((request) => {
          const status = request.status || 'PENDING';
          return <TouchableOpacity key={request.id} onPress={() => void mangakaApi.getDeadlineRequest(request.id).then((detail) => Alert.alert('Chi tiết deadline', [detail?.reason, detail?.status, detail?.requestedDeadline && new Date(detail.requestedDeadline).toLocaleDateString('vi-VN')].filter(Boolean).join('\n'))).catch(() => Alert.alert('Không thể tải chi tiết'))} style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
            <View style={styles.row}>
              <Typography variant="bodyBold">Chương {request.chapter?.chapterNumber ?? request.chapterId ?? '—'}</Typography>
              <Typography variant="caption" color={status === 'AGREED' || status === 'FINALIZED' ? currentColors.success : currentColors.warning}>{STATUS_LABELS[status] || status}</Typography>
            </View>
            <Typography variant="body" color={currentColors.textSecondary} style={styles.reason}>{request.reason || 'Không có lý do kèm theo.'}</Typography>
            <Typography variant="caption" color={currentColors.textSecondary}>Hạn đề xuất: {request.requestedDeadline ? new Date(request.requestedDeadline).toLocaleDateString('vi-VN') : '—'}</Typography>
          </TouchableOpacity>;
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1 }, headerCopy: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 }, webNotice: { flexDirection: 'row', gap: 10, alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 }, noticeCopy: { flex: 1 },
  loader: { marginTop: 32 }, empty: { textAlign: 'center', marginTop: 32 }, card: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, reason: { marginVertical: 8 }, chapterChoice: { borderTopWidth: 1, paddingVertical: 10, marginTop: 8 },
});
