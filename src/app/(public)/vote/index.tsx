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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  BarChart3,
  BookOpen,
  Check,
  Clock3,
  RefreshCw,
  Sparkles,
} from 'lucide-react-native';
import { useThemeStore } from '../../../store/useThemeStore';
import { Typography } from '../../../components/Typography';
import { Button } from '../../../components/Button';
import { PublicationType, publicApi } from '../../../api/public';
import { colors } from '../../../theme/colors';

type VoteType = PublicationType;

const TYPE_LABELS: Record<VoteType, string> = {
  WEEKLY: 'Hàng tuần',
  MONTHLY: 'Hàng tháng',
  IRREGULAR: 'Không định kỳ',
};

export default function VoteIndexScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ seriesId?: string }>();
  const theme = useThemeStore((state) => state.theme);
  const currentColors = colors[theme];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periods, setPeriods] = useState<any[]>([]);
  const [contexts, setContexts] = useState<Record<string, any>>({});
  const [activePeriodId, setActivePeriodId] = useState<string | null>(null);
  const [selectedByPeriod, setSelectedByPeriod] = useState<Record<string, string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState('');
  const requestId = useRef(0);

  const activeContext = activePeriodId ? contexts[activePeriodId] : null;
  const activePeriod = activeContext?.period
    ? {
        ...activeContext.period,
        number: activeContext.period.issueNumber ?? activeContext.period.number,
      }
    : null;
  const maxSeriesPerVote = activeContext?.maxSeriesPerVote ?? 3;
  const seriesPool = activeContext?.series ?? [];
  const selectedIds = activePeriodId ? selectedByPeriod[activePeriodId] ?? [] : [];

  useEffect(() => {
    const periodEndDate = activePeriod?.endDate;
    if (!periodEndDate) {
      setTimeRemaining('');
      return;
    }

    const updateCountdown = () => {
      const diff = new Date(periodEndDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeRemaining('Đã kết thúc');
        return;
      }
      const days = Math.floor(diff / 86_400_000);
      const hours = Math.floor((diff % 86_400_000) / 3_600_000);
      const mins = Math.floor((diff % 3_600_000) / 60_000);
      setTimeRemaining(days > 0 ? `${days} ngày ${hours} giờ` : `${hours} giờ ${mins} phút`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60_000);
    return () => clearInterval(interval);
  }, [activePeriod?.endDate]);

  const loadVoteContext = useCallback(async () => {
    const activeRequest = ++requestId.current;
    try {
      setLoading(true);
      setError(null);
      const [openPeriods, catalog] = await Promise.all([
        publicApi.getOpenVotePeriods(),
        publicApi.getAllCatalog(),
      ]);
      const availablePeriods = openPeriods?.items ?? [];
      const loadedContexts = await Promise.all(
        availablePeriods.map((item: any) => publicApi.getVoteContext({ periodId: item.id })),
      );
      if (activeRequest !== requestId.current) return;

      const catalogById = new Map<string, any>(
        (catalog?.items ?? []).map((item: any) => [item.id, item]),
      );
      const nextContexts = Object.fromEntries(
        loadedContexts.map((context: any, index) => {
          const sourcePeriod = availablePeriods[index];
          return [
            sourcePeriod.id,
            {
              ...context,
              period: { ...sourcePeriod, ...context?.period },
              series: (context?.series ?? []).map((item: any) => {
                const catalogSeries = catalogById.get(item.id);
                return {
                  ...item,
                  title: item.title || item.seriesTitle || catalogSeries?.title,
                  coverImageUrl: item.coverImageUrl || catalogSeries?.coverImageUrl || catalogSeries?.coverImage,
                  publicationType: sourcePeriod.publicationType,
                };
              }),
            },
          ];
        }),
      );

      setPeriods(availablePeriods);
      setContexts(nextContexts);
      const requestedSeriesId = typeof params.seriesId === 'string' ? params.seriesId : undefined;
      const matchingPeriod = requestedSeriesId
        ? availablePeriods.find((item: any) => (
            nextContexts[item.id]?.series ?? []
          ).some((series: any) => series.id === requestedSeriesId))
        : null;
      const nextPeriodId = matchingPeriod?.id ?? availablePeriods[0]?.id ?? null;
      setActivePeriodId(nextPeriodId);
      if (requestedSeriesId && matchingPeriod) {
        setSelectedByPeriod((current) => ({
          ...current,
          [matchingPeriod.id]: [requestedSeriesId],
        }));
      }
    } catch {
      if (activeRequest !== requestId.current) return;
      setPeriods([]);
      setContexts({});
      setActivePeriodId(null);
      setError('Không thể tải kỳ bình chọn. Kiểm tra kết nối và thử lại.');
    } finally {
      if (activeRequest === requestId.current) setLoading(false);
    }
  }, [params.seriesId]);

  useEffect(() => {
    void loadVoteContext();
  }, [loadVoteContext]);

  const toggleSelection = (id: string) => {
    if (!activePeriodId) return;
    setSelectedByPeriod((previous) => {
      const selected = previous[activePeriodId] ?? [];
      if (selected.includes(id)) {
        return { ...previous, [activePeriodId]: selected.filter((item) => item !== id) };
      }
      if (selected.length >= maxSeriesPerVote) return previous;
      return { ...previous, [activePeriodId]: [...selected, id] };
    });
  };

  const handleContinue = () => {
    if (!selectedIds.length || !activePeriod) return;
    router.push({
      pathname: '/(public)/vote/otp',
      params: {
        periodId: activePeriod.id,
        selectedSeriesIds: JSON.stringify(selectedIds),
        publicationType: activePeriod.publicationType,
      },
    });
  };

  const renderPeriodTabs = () => {
    if (periods.length <= 1) return null;
    return (
      <View style={styles.periodSection}>
        <Typography variant="label" color={currentColors.textSecondary}>CHỌN KỲ BÌNH CHỌN</Typography>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodTabs}
        >
          {periods.map((item: any) => {
            const selected = activePeriodId === item.id;
            const selectionCount = selectedByPeriod[item.id]?.length ?? 0;
            return (
              <TouchableOpacity
                key={item.id}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setActivePeriodId(item.id)}
                style={[
                  styles.periodTab,
                  {
                    borderColor: selected ? currentColors.primary : currentColors.border,
                    backgroundColor: selected ? currentColors.primary : currentColors.surface,
                  },
                ]}
              >
                <Typography variant="bodyMedium" color={selected ? currentColors.primaryForeground : currentColors.text} numberOfLines={1}>
                  {item.magazine || TYPE_LABELS[item.publicationType as VoteType]}
                </Typography>
                <Typography
                  variant="caption"
                  color={selected ? currentColors.primaryForeground : currentColors.textSecondary}
                >
                  {TYPE_LABELS[item.publicationType as VoteType]} · Kỳ #{item.issueNumber ?? item.number ?? '—'}
                  {selectionCount ? ` · ${selectionCount} đã chọn` : ''}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderHeader = () => (
    <>
      <View
        style={[
          styles.summaryCard,
          { backgroundColor: currentColors.surface, borderColor: currentColors.border },
        ]}
      >
        <View style={styles.summaryTop}>
          <View style={[styles.summaryIcon, { backgroundColor: `${currentColors.primary}18` }]}>
            <Sparkles size={20} color={currentColors.primary} />
          </View>
          <View style={styles.summaryCopy}>
            <Typography variant="label" color={currentColors.primary}>KỲ ĐANG MỞ</Typography>
            <Typography variant="h2">Kỳ #{activePeriod?.number ?? '—'}</Typography>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: `${currentColors.primary}18` }]}>
            <Typography variant="caption" color={currentColors.primary}>
              {TYPE_LABELS[(activePeriod?.publicationType ?? 'WEEKLY') as VoteType]}
            </Typography>
          </View>
        </View>

        <Typography variant="bodyMedium" numberOfLines={1}>
          {activePeriod?.magazine || 'Tạp chí Manga'}
        </Typography>
        <View style={styles.countdownRow}>
          <Clock3 size={16} color={currentColors.success} />
          <Typography variant="caption" color={currentColors.success}>
            Còn lại {timeRemaining || 'đang cập nhật'}
          </Typography>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.push({
            pathname: '/(public)/vote/live',
            params: { periodId: activePeriod?.id },
          } as any)}
          style={[styles.liveLink, { borderTopColor: currentColors.border }]}
        >
          <BarChart3 size={18} color={currentColors.primary} />
          <Typography variant="bodyMedium" color={currentColors.primary}>
            Theo dõi lượt bình chọn trực tiếp
          </Typography>
        </TouchableOpacity>
      </View>

      {renderPeriodTabs()}

      <View style={styles.listHeading}>
        <View style={styles.listHeadingCopy}>
          <Typography variant="h3">Chọn series yêu thích</Typography>
          <Typography variant="caption" color={currentColors.textSecondary}>
            Chọn tối đa {maxSeriesPerVote} series · Có thể bỏ chọn trước khi tiếp tục
          </Typography>
        </View>
        <Typography variant="bodyBold" color={currentColors.primary}>
          {selectedIds.length}/{maxSeriesPerVote}
        </Typography>
      </View>
    </>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, styles.centered, { backgroundColor: currentColors.background }]}
        edges={['bottom', 'left', 'right']}
      >
        <ActivityIndicator size="large" color={currentColors.primary} />
        <Typography variant="body" color={currentColors.textSecondary}>Đang tải kỳ bình chọn…</Typography>
      </SafeAreaView>
    );
  }

  if (error || !activePeriod) {
    return (
      <SafeAreaView
        style={[styles.container, styles.centered, { backgroundColor: currentColors.background }]}
        edges={['bottom', 'left', 'right']}
      >
        <View style={[styles.emptyIcon, { backgroundColor: `${error ? currentColors.error : currentColors.primary}18` }]}>
          {error
            ? <RefreshCw size={28} color={currentColors.error} />
            : <Clock3 size={28} color={currentColors.primary} />}
        </View>
        <Typography variant="h3">{error ? 'Không tải được dữ liệu' : 'Chưa có kỳ bình chọn'}</Typography>
        <Typography variant="body" color={currentColors.textSecondary} align="center">
          {error || 'Hiện tại chưa có kỳ bình chọn nào đang mở. Bạn vui lòng quay lại sau nhé.'}
        </Typography>
        <Button
          title={error ? 'Thử lại' : 'Về danh mục'}
          onPress={() => error ? void loadVoteContext() : router.replace('/(public)')}
          style={styles.stateButton}
          icon={error ? <RefreshCw size={17} color={currentColors.primaryForeground} /> : undefined}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: currentColors.background }]}
      edges={['bottom', 'left', 'right']}
    >
      <FlatList
        data={seriesPool}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
        renderItem={({ item: series }) => {
          const isSelected = selectedIds.includes(series.id);
          const selectionOrder = selectedIds.indexOf(series.id) + 1;
          const isDisabled = !isSelected && selectedIds.length >= maxSeriesPerVote;
          return (
            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected, disabled: isDisabled }}
              accessibilityLabel={`${series.title || 'Series'}, ${isSelected ? `đã chọn vị trí ${selectionOrder}` : 'chưa chọn'}`}
              activeOpacity={0.75}
              disabled={isDisabled}
              onPress={() => toggleSelection(series.id)}
              style={[
                styles.seriesCard,
                {
                  backgroundColor: currentColors.surface,
                  borderColor: currentColors.border,
                },
                isSelected && {
                  borderColor: currentColors.primary,
                  backgroundColor: `${currentColors.primary}0E`,
                },
                isDisabled && styles.disabledCard,
              ]}
            >
              {series.coverImageUrl || series.coverImage || series.coverUrl ? (
                <Image
                  source={{ uri: series.coverImageUrl || series.coverImage || series.coverUrl }}
                  style={styles.cover}
                  contentFit="cover"
                  transition={120}
                />
              ) : (
                <View style={[styles.cover, styles.coverFallback, { backgroundColor: currentColors.background }]}>
                  <BookOpen size={26} color={currentColors.primary} />
                </View>
              )}

              <View style={styles.seriesCopy}>
                <Typography variant="bodyBold" numberOfLines={2}>
                  {series.title || 'Series chưa đặt tên'}
                </Typography>
                <Typography variant="caption" color={currentColors.textSecondary}>
                  {series.magazine || activePeriod.magazine || 'Tạp chí Manga'}
                </Typography>
                <Typography variant="caption" color={isSelected ? currentColors.primary : currentColors.textSecondary}>
                  {isSelected ? `Lựa chọn số ${selectionOrder}` : isDisabled ? 'Đã đủ số lượng lựa chọn' : 'Chạm để chọn'}
                </Typography>
              </View>

              <View
                style={[
                  styles.checkCircle,
                  { borderColor: isSelected ? currentColors.primary : currentColors.border },
                  isSelected && { backgroundColor: currentColors.primary },
                ]}
              >
                {isSelected
                  ? <Check size={18} color={currentColors.primaryForeground} strokeWidth={3} />
                  : <Typography variant="caption" color={currentColors.textSecondary}>{selectionOrder || ''}</Typography>}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={(
          <View style={styles.seriesEmpty}>
            <BookOpen size={30} color={currentColors.textSecondary} />
            <Typography variant="bodyBold">Chưa có series để bình chọn</Typography>
            <Typography variant="caption" color={currentColors.textSecondary} align="center">
              Kỳ này chưa công bố danh sách ứng viên.
            </Typography>
          </View>
        )}
      />

      <View
        style={[
          styles.footer,
          { backgroundColor: currentColors.surface, borderTopColor: currentColors.border },
        ]}
      >
        <View style={styles.progressRow}>
          <Typography variant="caption" color={currentColors.textSecondary}>
            Đã chọn
          </Typography>
          <View style={styles.progressDots}>
            {Array.from({ length: maxSeriesPerVote }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: index < selectedIds.length
                      ? currentColors.primary
                      : currentColors.border,
                  },
                ]}
              />
            ))}
          </View>
          <Typography variant="bodyBold" color={currentColors.primary}>
            {selectedIds.length}/{maxSeriesPerVote}
          </Typography>
        </View>
        <Button
          title={selectedIds.length ? `Tiếp tục với ${selectedIds.length} lựa chọn` : 'Chọn series để tiếp tục'}
          onPress={handleContinue}
          disabled={!selectedIds.length}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  stateButton: { marginTop: 8, minWidth: 180 },
  list: { padding: 16, paddingBottom: 24, gap: 10 },
  summaryCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 8, marginBottom: 16 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  summaryCopy: { flex: 1, minWidth: 0 },
  typeBadge: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6 },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveLink: {
    borderTopWidth: 1,
    marginTop: 5,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodSection: { gap: 8, marginBottom: 16 },
  periodTabs: { gap: 8, paddingRight: 16 },
  periodTab: {
    minWidth: 152,
    maxWidth: 220,
    minHeight: 58,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    gap: 2,
  },
  listHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  listHeadingCopy: { flex: 1, gap: 3 },
  seriesCard: {
    minHeight: 116,
    borderRadius: 16,
    borderWidth: 1,
    padding: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  disabledCard: { opacity: 0.48 },
  cover: { width: 72, height: 98, borderRadius: 10 },
  coverFallback: { alignItems: 'center', justifyContent: 'center' },
  seriesCopy: { flex: 1, minWidth: 0, gap: 7 },
  checkCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  seriesEmpty: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },
  footer: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, gap: 9 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  progressDots: { flex: 1, flexDirection: 'row', gap: 5 },
  progressDot: { flex: 1, maxWidth: 44, height: 5, borderRadius: 3 },
});
