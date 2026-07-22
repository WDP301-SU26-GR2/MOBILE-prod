import { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Typography } from '../../../components/Typography';
import { publicApi } from '../../../api/public';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import { useThemeStore } from '../../../store/useThemeStore';
import { ChevronLeft, TrendingUp, TrendingDown, Minus, BookOpen } from 'lucide-react-native';

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

  const enrichWithCatalog = async (rawResults: any[]) => {
    try {
      const catalogData = await publicApi.getCatalog({ limit: 100 });
      const catalogItems = catalogData?.items || catalogData || [];
      const catalogMap = new Map();
      if (Array.isArray(catalogItems)) {
        catalogItems.forEach((item: any) => {
          if (item.id) catalogMap.set(item.id, item);
        });
      }
      return rawResults.map((r: any) => {
        const found = catalogMap.get(r.seriesId);
        return {
          ...r,
          coverImageUrl: r.coverImageUrl || r.coverImage || found?.coverImageUrl || found?.coverImage || null,
          seriesTitle: r.seriesTitle || r.title || found?.title
        };
      });
    } catch (e) {
      return rawResults;
    }
  };

  const fetchLatest = async () => {
    try {
      setLoading(true);
      const data = await publicApi.getLatestRankingResults({ publicationType: publicationType || undefined });
      setPeriod(data?.period || null);
      const raw = data?.results || [];
      const enriched = await enrichWithCatalog(raw);
      setResults(enriched);
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
      const raw = data?.results || [];
      const enriched = await enrichWithCatalog(raw);
      setResults(enriched);
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
    const title = item.seriesTitle || item.title || `Manga #${index + 1}`;
    const imageUrl = item.coverImageUrl || item.coverImage || item.series?.coverImageUrl;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: currentColors.surface }]}
        onPress={() => item.seriesId && router.push(`/(public)/series/${item.seriesId}`)}
        activeOpacity={0.7}
      >
        <View style={[styles.rankBadge, { backgroundColor: getRankBadgeColor(index) }]}>
          <Typography variant="h2" color={index < 3 ? '#FFF' : currentColors.text}>
            {item.rankPosition || index + 1}
          </Typography>
        </View>
        
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.cover}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.cover, { backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', padding: 4 }]}>
            <BookOpen size={24} color={currentColors.primary} />
            <Typography variant="caption" style={{ color: currentColors.textSecondary, fontSize: 10, textAlign: 'center', marginTop: 4 }}>
              MANGA
            </Typography>
          </View>
        )}
        
        <View style={styles.cardContent}>
          <Typography variant="bodyBold" numberOfLines={2} style={{ color: currentColors.text, marginBottom: 4 }}>
            {title}
          </Typography>
          <Typography variant="caption" color={currentColors.textSecondary}>
            {(item.voteCount ?? 0).toFixed(1)} điểm
          </Typography>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
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
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]} edges={['bottom', 'left', 'right']}>
      {/* Filters Header Container */}
      <View style={styles.filterSection}>
        {/* Period Selector */}
        {periods.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.periodPicker} 
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}
          >
            <TouchableOpacity
              style={[
                styles.periodChip, 
                { backgroundColor: !selectedPeriodId ? currentColors.primary : currentColors.surface }
              ]}
              onPress={() => { setSelectedPeriodId(null); fetchLatest(); }}
            >
              <Typography variant="caption" color={!selectedPeriodId ? '#FFF' : currentColors.text}>
                Mới nhất
              </Typography>
            </TouchableOpacity>
            {periods.map((p: any) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.periodChip, 
                  { backgroundColor: selectedPeriodId === p.id ? currentColors.primary : currentColors.surface }
                ]}
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
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={{ flexGrow: 0, marginTop: 4, marginBottom: 8 }} 
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}
        >
          {['', 'WEEKLY', 'MONTHLY'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.periodChip, 
                { backgroundColor: publicationType === t ? currentColors.secondary : currentColors.surface }
              ]}
              onPress={() => setPublicationType(t)}
            >
              <Typography variant="caption" color={publicationType === t ? '#FFF' : currentColors.text}>
                {t === '' ? 'Tất cả' : t === 'WEEKLY' ? 'Hàng tuần' : 'Hàng tháng'}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} color={currentColors.primary} />
      ) : results.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Typography color={currentColors.textSecondary}>Chưa có kết quả xếp hạng.</Typography>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.seriesId || index}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterSection: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  periodPicker: { flexGrow: 0 },
  periodChip: {
    paddingHorizontal: 14,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    alignItems: 'center',
  },
  rankBadge: {
    width: 48,
    height: '100%',
    minHeight: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cover: { 
    width: 64, 
    height: 90, 
    backgroundColor: 'rgba(255,255,255,0.05)' 
  },
  cardContent: { 
    flex: 1, 
    paddingHorizontal: 12, 
    paddingVertical: 10,
    justifyContent: 'center' 
  }
});
