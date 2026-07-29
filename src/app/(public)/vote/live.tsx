import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy } from 'lucide-react-native';
import { publicApi } from '../../../api/public';
import { Typography } from '../../../components/Typography';
import { colors } from '../../../theme/colors';
import { useThemeStore } from '../../../store/useThemeStore';
import { io } from 'socket.io-client';
import { API_URL } from '../../../api/client';

export default function LiveVoteScreen() {
  const { periodId } = useLocalSearchParams<{ periodId: string }>();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const [tally, setTally] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtime, setRealtime] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!periodId) return;
    try {
      if (isRefresh) setRefreshing(true);
      setError(null);
      setTally(await publicApi.getLiveVoteTally(periodId));
    } catch (requestError: any) {
      const status = requestError?.response?.status;
      setError(status === 409 ? 'Kỳ bình chọn đã đóng.' : 'Không thể tải dữ liệu trực tiếp. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [periodId]);

  useEffect(() => {
    void load();
    if (!periodId) return;
    const socket = io(`${API_URL}/vote`, { transports: ['websocket', 'polling'], reconnection: true });
    let fallbackTimer: ReturnType<typeof setInterval> | null = null;
    const startFallback = () => {
      setRealtime(false);
      if (!fallbackTimer) fallbackTimer = setInterval(() => void load(), 5000);
    };
    socket.on('connect', () => {
      setRealtime(true);
      if (fallbackTimer) { clearInterval(fallbackTimer); fallbackTimer = null; }
      socket.emit('joinPeriod', { periodId }, (ack: { status?: string } | undefined) => {
        if (ack?.status === 'CLOSED') setError('Kỳ bình chọn đã đóng.');
        if (ack?.status === 'INVALID') setError('Kỳ bình chọn không hợp lệ.');
      });
    });
    socket.on('voteTally', (payload) => { setTally(payload); setError(null); setLoading(false); });
    socket.on('connect_error', startFallback);
    socket.on('disconnect', startFallback);
    return () => {
      if (fallbackTimer) clearInterval(fallbackTimer);
      socket.disconnect();
    };
  }, [load, periodId]);

  if (loading) {
    return <View style={[styles.center, { backgroundColor: currentColors.background }]}><ActivityIndicator size="large" color={currentColors.primary} /></View>;
  }

  if (error) {
    return <View style={[styles.center, { backgroundColor: currentColors.background }]}><Typography color={currentColors.textSecondary}>{error}</Typography></View>;
  }

  const entries = tally?.tally ?? [];
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]} edges={['bottom', 'left', 'right']}>
      <View style={[styles.summary, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
        <Trophy size={24} color={currentColors.primary} />
        <View style={{ flex: 1 }}>
          <Typography variant="bodyBold">Lượt chọn trực tiếp</Typography>
          <Typography variant="caption" color={currentColors.textSecondary}>{tally?.totalVotes ?? 0} phiếu hợp lệ · {realtime ? 'realtime' : 'đang dùng poll dự phòng 5 giây'}</Typography>
        </View>
      </View>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.seriesId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Typography color={currentColors.textSecondary} style={styles.empty}>Chưa có lượt bình chọn.</Typography>}
        renderItem={({ item, index }) => (
          <View style={[styles.row, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
            <Typography variant="h3" color={currentColors.primary}>#{index + 1}</Typography>
            <View style={{ flex: 1 }}><Typography variant="bodyBold">{item.title}</Typography></View>
            <Typography variant="bodyBold">{item.count}</Typography>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  summary: { flexDirection: 'row', gap: 12, alignItems: 'center', margin: 16, padding: 14, borderRadius: 12, borderWidth: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  row: { minHeight: 64, paddingHorizontal: 14, flexDirection: 'row', gap: 12, alignItems: 'center', borderRadius: 12, borderWidth: 1 },
  empty: { textAlign: 'center', marginTop: 36 },
});
