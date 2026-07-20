import { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Typography } from '../../../components/Typography';
import { publicApi } from '../../../api/public';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import { useThemeStore } from '../../../store/useThemeStore';
import { ChevronLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

export default function PublicRanking() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  
  const [results, setResults] = useState<any[]>([]);
  const [period, setPeriod] = useState<any>(null);
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [publicationType, setPublicationType] = useState('');

  useEffect(() => {
    fetchLatest();
    fetchPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriodId) {
      fetchByPeriod(selectedPeriodId);
    }
  }, [selectedPeriodId, publicationType]);

  const fetchLatest = async () => {
    try {
      setLoading(true);
      const data = await publicApi.getLatestRankingResults({ publicationType: publicationType || undefined });
      setPeriod(data?.period || null);
      setResults(data?.results || []);
    } catch (e) {
      console.log('Error fetching ranking', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriods = async () => {
    try {
      const data = await publicApi.getVotePeriods();
      setPeriods(data?.items || []);
    } catch (e) {
      console.log('Error fetching periods', e);
    }
  };

  const fetchByPeriod = async (periodId: string) => {
    try {
      setLoading(true);
      const data = await publicApi.getRankingResults(periodId, publicationType || undefined);
      setResults(data?.results || []);
    } catch (e) {
      console.log('Error fetching period results', e);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadgeColor = (index: number) => {
    if (index === 0) return '#FFD700'; // Gold
    if (index === 1) return '#C0C0C0'; // Silver
    if (index === 2) return '#CD7F32'; // Bronze
    return currentColors.surface;
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const rankChange = item.rankChange || 0;
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: currentColors.surface }]}
        onPress={() => router.push(`/(public)/series/${item.seriesId}`)}
      >
        <View style={[styles.rankBadge, { backgroundColor: getRankBadgeColor(index) }]}>
          <Typography variant="h2" color={index < 3 ? '#FFF' : currentColors.text}>
            {index + 1}
          </Typography>
        </View>
        <Image
          source={{ uri: item.coverImageUrl || 'https://via.placeholder.com/80x110' }}
          style={styles.cover}
          contentFit="cover"
        />
        <View style={styles.cardContent}>
          <Typography variant="h3" numberOfLines={1}>{item.title}</Typography>
          <Typography variant="caption" color={currentColors.textSecondary}>
            {item.voteCount?.toFixed(1) || 0} điểm
          </Typography>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            {rankChange > 0 ? (
              <TrendingUp size={14} color={currentColors.success} />
            ) : rankChange < 0 ? (
              <TrendingDown size={14} color={currentColors.error} />
            ) : (
              <Minus size={14} color={currentColors.textSecondary} />
            )}
            <Typography variant="caption" color={rankChange > 0 ? currentColors.success : rankChange < 0 ? currentColors.error : currentColors.textSecondary}>
              {rankChange > 0 ? `+${rankChange}` : rankChange < 0 ? `${rankChange}` : 'Không đổi'}
            </Typography>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={[styles.header, { borderBottomColor: currentColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <ChevronLeft color={currentColors.text} size={28} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Typography variant="h2">Bảng xếp hạng</Typography>
          {period && (
            <Typography variant="caption" color={currentColors.textSecondary}>
              Kỳ #{period.number}
            </Typography>
          )}
        </View>
      </View>

      {/* Period Selector */}
      {periods.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodPicker} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          <TouchableOpacity
            style={[styles.periodChip, !selectedPeriodId && { backgroundColor: currentColors.primary }]}
            onPress={() => { setSelectedPeriodId(null); fetchLatest(); }}
          >
            <Typography variant="caption" color={!selectedPeriodId ? '#FFF' : currentColors.text}>Mới nhất</Typography>
          </TouchableOpacity>
          {periods.map((p: any) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.periodChip, { backgroundColor: currentColors.surface }, selectedPeriodId === p.id && { backgroundColor: currentColors.primary }]}
              onPress={() => setSelectedPeriodId(p.id)}
            >
              <Typography variant="caption" color={selectedPeriodId === p.id ? '#FFF' : currentColors.text}>
                Kỳ #{p.number}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Type filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44, flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {['', 'WEEKLY', 'MONTHLY'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.periodChip, { backgroundColor: currentColors.surface }, publicationType === t && { backgroundColor: currentColors.secondary }]}
            onPress={() => setPublicationType(t)}
          >
            <Typography variant="caption" color={publicationType === t ? '#FFF' : currentColors.text}>
              {t === '' ? 'Tất cả' : t === 'WEEKLY' ? 'Hàng tuần' : 'Hàng tháng'}
            </Typography>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} color={currentColors.primary} />
      ) : results.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Typography color={currentColors.textSecondary}>Chưa có kết quả xếp hạng.</Typography>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.seriesId}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  periodPicker: { maxHeight: 48, flexGrow: 0, marginVertical: 8 },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginRight: 4,
    alignSelf: 'flex-start',
  },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  rankBadge: {
    width: 52,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  cover: { width: 70, height: 100 },
  cardContent: { flex: 1, padding: 12, justifyContent: 'center' }
});
