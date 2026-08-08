import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  History,
  Minus,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react-native';
import { Typography } from '../../../components/Typography';
import { MagazineOption, MagazineSelect } from '../../../components/MagazineSelect';
import { publicApi, PublicationType } from '../../../api/public';
import { useThemeStore } from '../../../store/useThemeStore';
import { colors } from '../../../theme/colors';

type ViewMode = 'LATEST' | 'HISTORY' | 'AGGREGATE';
type AggregateLevel = 'YEAR' | 'MONTH';

const MODES: { id: ViewMode; label: string; icon: typeof Sparkles }[] = [
  { id: 'LATEST', label: 'Mới nhất', icon: Sparkles },
  { id: 'HISTORY', label: 'Lịch sử', icon: History },
  { id: 'AGGREGATE', label: 'Tổng hợp', icon: Trophy },
];

const PUBLICATION_TYPES: { id: PublicationType; label: string }[] = [
  { id: 'WEEKLY', label: 'Hàng tuần' },
  { id: 'MONTHLY', label: 'Hàng tháng' },
  { id: 'IRREGULAR', label: 'Không định kỳ' },
];

export default function PublicRanking() {
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const currentColors = colors[theme];
  const now = new Date();

  const [mode, setMode] = useState<ViewMode>('LATEST');
  const [publicationType, setPublicationType] = useState<PublicationType>('WEEKLY');
  const [magazine, setMagazine] = useState(process.env.EXPO_PUBLIC_DEFAULT_MAGAZINE || '');
  const [magazineOptions, setMagazineOptions] = useState<MagazineOption[]>([]);
  const [magazinesLoading, setMagazinesLoading] = useState(true);
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [aggregate, setAggregate] = useState<any>(null);
  const [aggregateLevel, setAggregateLevel] = useState<AggregateLevel>('YEAR');
  const [selectedYear, setSelectedYear] = useState(now.getUTCFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getUTCMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [periodsLoading, setPeriodsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const enrichWithCatalog = useCallback(async (rawResults: any[]) => {
    try {
      const catalogData = await publicApi.getAllCatalog();
      const catalogItems = catalogData?.items ?? [];
      const catalogMap = new Map(catalogItems.map((item: any) => [item.id, item]));
      return rawResults.map((result: any) => {
        const series = catalogMap.get(result.seriesId) as any;
        return {
          ...result,
          seriesTitle: result.seriesTitle || result.title || series?.title,
          coverImageUrl: result.coverImageUrl || result.coverImage || series?.coverImageUrl || series?.coverImage,
        };
      });
    } catch {
      return rawResults;
    }
  }, []);

  const loadMagazineOptions = useCallback(async () => {
    try {
      setMagazinesLoading(true);
      const [openPeriods, catalog] = await Promise.all([
        publicApi.getOpenVotePeriods(),
        publicApi.getAllCatalog(),
      ]);
      const sources = [...(openPeriods?.items ?? []), ...(catalog?.items ?? [])];
      const unique = new Map<string, MagazineOption>();
      sources.forEach((item: any) => {
        if (!item?.magazine || !['WEEKLY', 'MONTHLY', 'IRREGULAR'].includes(item.publicationType)) return;
        const option = {
          magazine: String(item.magazine),
          publicationType: item.publicationType as PublicationType,
        };
        unique.set(`${option.magazine}-${option.publicationType}`, option);
      });
      const options = Array.from(unique.values()).sort((left, right) => (
        left.magazine.localeCompare(right.magazine, 'vi')
      ));
      setMagazineOptions(options);
      const candidate = options[0];
      if (candidate) {
        setMagazine((current) => current.trim() || candidate.magazine);
        if (!process.env.EXPO_PUBLIC_DEFAULT_MAGAZINE) {
          setPublicationType(candidate.publicationType);
        }
      }
    } catch {
      setMagazineOptions([]);
    } finally {
      setMagazinesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMagazineOptions();
  }, [loadMagazineOptions]);

  const loadPeriods = useCallback(async () => {
    if (!magazine.trim()) {
      setPeriods([]);
      setSelectedPeriodId(null);
      return;
    }
    try {
      setPeriodsLoading(true);
      const data = await publicApi.getVotePeriods({
        magazine: magazine.trim(),
        publicationType,
        limit: 24,
      });
      const items = data?.items ?? [];
      setPeriods(items);
      setSelectedPeriodId((current) => (
        current && items.some((period: any) => period.id === current) ? current : items[0]?.id ?? null
      ));
    } catch {
      setPeriods([]);
      setSelectedPeriodId(null);
    } finally {
      setPeriodsLoading(false);
    }
  }, [magazine, publicationType]);

  useEffect(() => {
    void loadPeriods();
  }, [loadPeriods]);

  const loadRanking = useCallback(async () => {
    const scope = magazine.trim();
    if (!scope) {
      setLoading(false);
      setResults([]);
      setAggregate(null);
      return;
    }
    if (mode === 'HISTORY' && !selectedPeriodId) {
      setLoading(false);
      setResults([]);
      setAggregate(null);
      return;
    }

    const activeRequest = ++requestId.current;
    try {
      setLoading(true);
      setError(null);
      if (mode === 'AGGREGATE') {
        const data = await publicApi.getAggregateRanking({
          magazine: scope,
          publicationType,
          year: selectedYear,
          level: aggregateLevel,
          ...(aggregateLevel === 'MONTH' ? { month: selectedMonth } : {}),
        });
        const items = await enrichWithCatalog(data?.items ?? []);
        if (activeRequest === requestId.current) {
          setAggregate({ ...data, items });
          setResults([]);
        }
        return;
      }

      const data = mode === 'LATEST'
        ? await publicApi.getLatestRankingResults({ magazine: scope, publicationType })
        : await publicApi.getRankingResults(selectedPeriodId as string);
      const enriched = await enrichWithCatalog(data?.results ?? []);
      if (activeRequest === requestId.current) {
        setResults(enriched);
        setAggregate(null);
      }
    } catch (requestError: any) {
      if (activeRequest !== requestId.current) return;
      setResults([]);
      setAggregate(null);
      const status = requestError?.response?.status;
      setError(status === 404 || status === 409
        ? 'Chưa có kỳ xếp hạng đã phản ánh cho phạm vi này.'
        : 'Không thể tải bảng xếp hạng. Kiểm tra kết nối và thử lại.');
    } finally {
      if (activeRequest === requestId.current) setLoading(false);
    }
  }, [
    aggregateLevel,
    enrichWithCatalog,
    magazine,
    mode,
    publicationType,
    selectedMonth,
    selectedPeriodId,
    selectedYear,
  ]);

  useEffect(() => {
    void loadRanking();
  }, [loadRanking]);

  const selectMode = (nextMode: ViewMode) => {
    setMode(nextMode);
    setError(null);
  };

  const changeMonth = (delta: number) => {
    const date = new Date(Date.UTC(selectedYear, selectedMonth - 1 + delta, 1));
    const futureLimit = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    if (date > futureLimit) return;
    setSelectedYear(date.getUTCFullYear());
    setSelectedMonth(date.getUTCMonth() + 1);
  };

  const changeYear = (delta: number) => {
    const nextYear = selectedYear + delta;
    if (nextYear > now.getUTCFullYear() || nextYear < 1970) return;
    setSelectedYear(nextYear);
  };

  const selectedPeriod = periods.find((period) => period.id === selectedPeriodId);
  const data = mode === 'AGGREGATE' ? aggregate?.items ?? [] : results;

  const renderScope = () => (
    <View style={[styles.scopeCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
      <View style={styles.sectionHeading}>
        <View style={[styles.sectionIcon, { backgroundColor: `${currentColors.primary}18` }]}>
          <BookOpen size={17} color={currentColors.primary} />
        </View>
        <View style={styles.headingCopy}>
          <Typography variant="bodyBold">Phạm vi xếp hạng</Typography>
          <Typography variant="caption" color={currentColors.textSecondary}>Chọn tạp chí và nhịp xuất bản</Typography>
        </View>
      </View>
      <MagazineSelect
        options={magazineOptions}
        value={magazine}
        publicationType={publicationType}
        loading={magazinesLoading}
        onSelect={(option) => {
          setMagazine(option.magazine);
          setPublicationType(option.publicationType);
          setSelectedPeriodId(null);
          setError(null);
        }}
      />
    </View>
  );

  const renderModeControls = () => (
    <>
      <View style={[styles.modeTabs, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
        {MODES.map((item) => {
          const selected = mode === item.id;
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => selectMode(item.id)}
              style={[styles.modeTab, selected && { backgroundColor: currentColors.primary }]}
            >
              <Icon size={15} color={selected ? currentColors.primaryForeground : currentColors.textSecondary} />
              <Typography variant="caption" color={selected ? currentColors.primaryForeground : currentColors.textSecondary}>{item.label}</Typography>
            </TouchableOpacity>
          );
        })}
      </View>

      {mode === 'HISTORY' && (
        <View style={styles.contextBlock}>
          <View style={styles.contextTitle}>
            <CalendarDays size={17} color={currentColors.primary} />
            <Typography variant="bodyBold">Chọn kỳ đã phản ánh</Typography>
          </View>
          {periodsLoading ? (
            <ActivityIndicator color={currentColors.primary} style={styles.inlineLoader} />
          ) : periods.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.periodRow}
            >
              {periods.map((period) => {
                const selected = selectedPeriodId === period.id;
                return (
                  <TouchableOpacity
                    key={period.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setSelectedPeriodId(period.id)}
                    style={[
                      styles.periodChip,
                      { borderColor: currentColors.border, backgroundColor: currentColors.surface },
                      selected && { borderColor: currentColors.primary, backgroundColor: currentColors.primary },
                    ]}
                  >
                    <Typography variant="caption" color={selected ? currentColors.primaryForeground : currentColors.text}>
                      Kỳ #{period.reflectedIssueNumber ?? period.issueNumber ?? '—'}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <Typography variant="caption" color={currentColors.textSecondary}>Chưa có kỳ lịch sử.</Typography>
          )}
        </View>
      )}

      {mode === 'AGGREGATE' && (
        <View style={[styles.aggregateControls, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
          <View style={styles.levelTabs}>
            {(['YEAR', 'MONTH'] as const).map((level) => {
              const selected = aggregateLevel === level;
              return (
                <TouchableOpacity
                  key={level}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setAggregateLevel(level)}
                  style={[
                    styles.levelTab,
                    { borderColor: currentColors.border },
                    selected && { borderColor: currentColors.primary, backgroundColor: `${currentColors.primary}18` },
                  ]}
                >
                  <Typography variant="caption" color={selected ? currentColors.primary : currentColors.textSecondary}>
                    {level === 'YEAR' ? 'Theo năm' : 'Theo tháng'}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.dateStepper}>
            <TouchableOpacity
              accessibilityLabel={aggregateLevel === 'YEAR' ? 'Năm trước' : 'Tháng trước'}
              onPress={() => aggregateLevel === 'YEAR' ? changeYear(-1) : changeMonth(-1)}
              style={[styles.stepButton, { borderColor: currentColors.border }]}
            >
              <ChevronLeft size={19} color={currentColors.text} />
            </TouchableOpacity>
            <View style={styles.dateValue}>
              <Typography variant="bodyBold">
                {aggregateLevel === 'YEAR' ? `${selectedYear}` : `Tháng ${selectedMonth}/${selectedYear}`}
              </Typography>
              <Typography variant="caption" color={currentColors.textSecondary}>Khoảng tổng hợp</Typography>
            </View>
            <TouchableOpacity
              accessibilityLabel={aggregateLevel === 'YEAR' ? 'Năm tiếp theo' : 'Tháng tiếp theo'}
              onPress={() => aggregateLevel === 'YEAR' ? changeYear(1) : changeMonth(1)}
              disabled={aggregateLevel === 'YEAR'
                ? selectedYear >= now.getUTCFullYear()
                : selectedYear === now.getUTCFullYear() && selectedMonth >= now.getUTCMonth() + 1}
              style={[styles.stepButton, { borderColor: currentColors.border }]}
            >
              <ChevronRight size={19} color={currentColors.text} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { backgroundColor: '#F6C344', color: '#3B2A00' };
    if (rank === 2) return { backgroundColor: '#CBD5E1', color: '#1E293B' };
    if (rank === 3) return { backgroundColor: '#C98A55', color: '#2D1608' };
    return { backgroundColor: currentColors.background, color: currentColors.text };
  };

  const renderRankingItem = ({ item, index }: { item: any; index: number }) => {
    const rank = item.rankPosition ?? index + 1;
    const rankStyle = getRankStyle(rank);
    const title = item.seriesTitle || item.title || `Manga #${rank}`;
    const rankChange = item.rankChange ?? 0;
    const aggregateItem = mode === 'AGGREGATE';
    const coverage = Math.round((item.participationCoverage ?? 0) * 100);

    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Hạng ${rank}, ${title}`}
        disabled={!item.seriesId}
        onPress={() => item.seriesId && router.push(`/(public)/series/${item.seriesId}`)}
        style={[styles.rankingCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}
      >
        <View style={[styles.rankCircle, { backgroundColor: rankStyle.backgroundColor, borderColor: currentColors.border }]}>
          <Typography variant="bodyBold" color={rankStyle.color}>#{rank}</Typography>
        </View>
        {item.coverImageUrl ? (
          <Image source={{ uri: item.coverImageUrl }} style={styles.cover} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.cover, styles.coverFallback, { backgroundColor: currentColors.background }]}>
            <BookOpen size={22} color={currentColors.primary} />
          </View>
        )}
        <View style={styles.rankingCopy}>
          <Typography variant="bodyBold" numberOfLines={2}>{title}</Typography>
          {aggregateItem ? (
            <>
              <Typography variant="caption" color={currentColors.textSecondary}>
                Tham gia {item.participatedIssueCount ?? 0}/{item.reflectedIssueCount ?? 0} kỳ · phủ {coverage}%
              </Typography>
              {item.isProvisional && (
                <View style={[styles.provisionalBadge, { backgroundColor: `${currentColors.warning}1F` }]}>
                  <Typography variant="caption" color={currentColors.warning}>Dữ liệu tạm thời</Typography>
                </View>
              )}
            </>
          ) : (
            <View style={styles.changeRow}>
              {rankChange > 0 ? (
                <TrendingUp size={14} color={currentColors.success} />
              ) : rankChange < 0 ? (
                <TrendingDown size={14} color={currentColors.error} />
              ) : (
                <Minus size={14} color={currentColors.textSecondary} />
              )}
              <Typography
                variant="caption"
                color={rankChange > 0 ? currentColors.success : rankChange < 0 ? currentColors.error : currentColors.textSecondary}
              >
                {rankChange > 0 ? `Tăng ${rankChange} hạng` : rankChange < 0 ? `Giảm ${Math.abs(rankChange)} hạng` : 'Không đổi'}
              </Typography>
            </View>
          )}
        </View>
        <View style={styles.metric}>
          <Typography variant="bodyBold" color={currentColors.primary}>
            {aggregateItem
              ? Number(item.averageNormalizedScore ?? 0).toFixed(3)
              : Number(item.voteCount ?? 0).toLocaleString('vi-VN')}
          </Typography>
          <Typography variant="caption" color={currentColors.textSecondary}>
            {aggregateItem ? 'điểm TB' : 'phiếu'}
          </Typography>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListHeader = () => {
    const title = mode === 'LATEST'
      ? 'Kết quả mới nhất'
      : mode === 'HISTORY'
        ? `Kỳ #${selectedPeriod?.reflectedIssueNumber ?? selectedPeriod?.issueNumber ?? '—'}`
        : aggregateLevel === 'YEAR'
          ? `Tổng hợp năm ${selectedYear}`
          : `Tổng hợp tháng ${selectedMonth}/${selectedYear}`;
    const description = mode === 'AGGREGATE'
      ? `${aggregate?.reflectedIssueCount ?? 0} kỳ đã phản ánh`
      : `${results.length} series được xếp hạng`;

    return (
      <View style={styles.listHeading}>
        <View>
          <Typography variant="h3">{title}</Typography>
          <Typography variant="caption" color={currentColors.textSecondary}>{description}</Typography>
        </View>
        <View style={[styles.scopeBadge, { backgroundColor: `${currentColors.primary}18` }]}>
          <Typography variant="caption" color={currentColors.primary}>
            {PUBLICATION_TYPES.find((item) => item.id === publicationType)?.label}
          </Typography>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: currentColors.background }]}
      edges={['bottom', 'left', 'right']}
    >
      <FlatList
        data={loading || error ? [] : data}
        keyExtractor={(item, index) => `${item.seriesId ?? 'ranking'}-${item.rankPosition ?? index}`}
        renderItem={renderRankingItem}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <>
            {renderScope()}
            {renderModeControls()}
            {!loading && !error && data.length > 0 && renderListHeader()}
          </>
        )}
        ListEmptyComponent={(
          <View style={styles.stateContainer}>
            {loading ? (
              <>
                <ActivityIndicator size="large" color={currentColors.primary} />
                <Typography variant="body" color={currentColors.textSecondary}>Đang tải bảng xếp hạng…</Typography>
              </>
            ) : error ? (
              <>
                <View style={[styles.stateIcon, { backgroundColor: `${currentColors.error}18` }]}>
                  <RefreshCw size={24} color={currentColors.error} />
                </View>
                <Typography variant="bodyBold">Không tải được dữ liệu</Typography>
                <Typography variant="body" color={currentColors.textSecondary} align="center">{error}</Typography>
                <TouchableOpacity
                  onPress={() => void loadRanking()}
                  style={[styles.retryButton, { backgroundColor: currentColors.primary }]}
                >
                  <RefreshCw size={16} color={currentColors.primaryForeground} />
                  <Typography variant="bodyBold" color={currentColors.primaryForeground}>Thử lại</Typography>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={[styles.stateIcon, { backgroundColor: `${currentColors.primary}18` }]}>
                  <Trophy size={25} color={currentColors.primary} />
                </View>
                <Typography variant="bodyBold">Chưa có kết quả</Typography>
                <Typography variant="body" color={currentColors.textSecondary} align="center">
                  {mode === 'HISTORY' && !selectedPeriodId
                    ? 'Phạm vi này chưa có kỳ đã phản ánh.'
                    : 'Chưa có series đủ dữ liệu để xếp hạng trong phạm vi đã chọn.'}
                </Typography>
              </>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 10 },
  scopeCard: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 12, marginBottom: 4 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1, gap: 2 },
  modeTabs: { flexDirection: 'row', padding: 4, borderRadius: 14, borderWidth: 1, marginTop: 4 },
  modeTab: { flex: 1, minHeight: 40, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  contextBlock: { gap: 10, marginTop: 6 },
  contextTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inlineLoader: { alignSelf: 'flex-start', marginVertical: 8 },
  periodRow: { gap: 8, paddingRight: 16 },
  periodChip: { height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 14 },
  aggregateControls: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 12, marginTop: 6 },
  levelTabs: { flexDirection: 'row', gap: 8 },
  levelTab: { flex: 1, minHeight: 36, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dateStepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepButton: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dateValue: { flex: 1, alignItems: 'center', gap: 2 },
  listHeading: { marginTop: 10, marginBottom: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  scopeBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  rankingCard: { minHeight: 98, borderRadius: 14, borderWidth: 1, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rankCircle: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cover: { width: 54, height: 76, borderRadius: 8 },
  coverFallback: { alignItems: 'center', justifyContent: 'center' },
  rankingCopy: { flex: 1, minWidth: 0, gap: 6 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  provisionalBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  metric: { alignItems: 'flex-end', minWidth: 58, gap: 2 },
  stateContainer: { minHeight: 230, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', gap: 10 },
  stateIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  retryButton: { minHeight: 42, borderRadius: 10, paddingHorizontal: 16, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
});
