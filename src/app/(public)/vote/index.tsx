import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { CheckCircle2, Clock, Lock } from 'lucide-react-native';
import { useThemeStore } from '../../../store/useThemeStore';
import { Typography } from '../../../components/Typography';
import { Button } from '../../../components/Button';
import { publicApi } from '../../../api/public';
import { colors } from '../../../theme/colors';

type VoteType = 'WEEKLY' | 'MONTHLY';

export default function VoteIndexScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  
  const [loading, setLoading] = useState(true);
  const [contexts, setContexts] = useState<Partial<Record<VoteType, any>>>({});
  const [activeType, setActiveType] = useState<VoteType>('WEEKLY');
  const [selectedByType, setSelectedByType] = useState<Record<VoteType, string[]>>({ WEEKLY: [], MONTHLY: [] });
  const [timeRemaining, setTimeRemaining] = useState('');

  const activeContext = contexts[activeType];
  const period = activeContext?.period ? { ...activeContext.period, number: activeContext.period.issueNumber ?? activeContext.period.number } : null;
  const periodEndDate = activeContext?.period?.endDate;
  const seriesPool = activeContext?.series ?? [];
  const selectedIds = selectedByType[activeType];

  useEffect(() => {
    if (!periodEndDate) return;
    
    const updateCountdown = () => {
      const end = new Date(periodEndDate).getTime();
      const now = new Date().getTime();
      const diff = end - now;
      
      if (diff <= 0) {
        setTimeRemaining('Đã kết thúc');
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeRemaining(`${days} ngày ${hours}h ${mins}m`);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [periodEndDate]);

  const loadVoteContext = async () => {
    try {
      const getCatalogForType = async (publicationType: VoteType) => {
        const first = await publicApi.getCatalog({ publicationType, limit: 50, offset: 0 });
        const pageCount = Math.ceil((first?.total ?? 0) / 50);
        const rest = await Promise.all(
          Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
            publicApi.getCatalog({ publicationType, limit: 50, offset: (index + 1) * 50 })
          )
        );
        return [first, ...rest].flatMap(page => page?.items ?? []);
      };
      const [weekly, monthly, weeklyCatalog, monthlyCatalog] = await Promise.all([
        publicApi.getVoteContext({ publicationType: 'WEEKLY' }),
        publicApi.getVoteContext({ publicationType: 'MONTHLY' }),
        getCatalogForType('WEEKLY'),
        getCatalogForType('MONTHLY'),
      ]);
      const enrich = (context: any, catalog: any, publicationType: VoteType) => {
        const catalogById = new Map<string, any>(catalog.map((item: any) => [item.id, item]));
        return {
          ...context,
          series: (context?.series ?? []).map((item: any) => ({
            ...item,
            coverImageUrl: catalogById.get(item.id)?.coverImageUrl,
            publicationType,
          })),
        };
      };
      const nextContexts = {
        WEEKLY: enrich(weekly, weeklyCatalog, 'WEEKLY'),
        MONTHLY: enrich(monthly, monthlyCatalog, 'MONTHLY'),
      };
      setContexts(nextContexts);
      if (!nextContexts.WEEKLY?.period && nextContexts.MONTHLY?.period) setActiveType('MONTHLY');
    } catch (error) {
      console.error('Failed to load vote context', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadVoteContext();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedByType(previous => {
      const selected = previous[activeType];
      let next: string[];
      if (selected.includes(id)) next = selected.filter(item => item !== id);
      else if (period && selected.length >= period.maxSeriesPerVote) next = selected;
      else next = [...selected, id];
      return { ...previous, [activeType]: next };
    });
  };

  const handleContinue = () => {
    if (selectedIds.length === 0 || !period) return;
    
    router.push({
      pathname: '/(public)/vote/otp',
      params: {
        periodId: period.id,
        selectedSeriesIds: JSON.stringify(selectedIds),
        publicationType: activeType,
      }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]} edges={['bottom', 'left', 'right']}>
        <ActivityIndicator size="large" color={currentColors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!period) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]} edges={['bottom', 'left', 'right']}>
        <View style={styles.emptyState}>
          <Clock size={64} color={currentColors.textSecondary} />
          <Typography variant="h2" style={[styles.emptyTitle, { color: currentColors.text }]}>
            Chưa có kỳ bình chọn
          </Typography>
          <Typography variant="body" style={[styles.emptyText, { color: currentColors.textSecondary }]}>
            Hiện tại chưa có kỳ bình chọn nào đang mở. Bạn vui lòng quay lại sau nhé.
          </Typography>
          <Button 
            title="Về danh mục" 
            onPress={() => router.push('/(public)')} 
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Typography variant="h2" style={{ color: currentColors.text, marginBottom: 2 }}>
          Kỳ bình chọn #{period.number}
        </Typography>
        <View style={styles.countdownContainer}>
          <Clock size={16} color={currentColors.primary} />
          <Typography variant="caption" style={[styles.countdownText, { color: currentColors.primary }]}>
            Còn lại: {timeRemaining}
          </Typography>
        </View>
      </View>

      <View style={styles.tabRow}>
        {(['WEEKLY', 'MONTHLY'] as VoteType[]).map(type => (
          <TouchableOpacity
            key={type}
            onPress={() => setActiveType(type)}
            disabled={!contexts[type]?.period}
            style={[styles.tab, { borderColor: currentColors.border }, !contexts[type]?.period && { opacity: 0.45 }, activeType === type && { backgroundColor: currentColors.primary, borderColor: currentColors.primary }]}
          >
            <Typography variant="caption" color={activeType === type ? '#FFF' : currentColors.text}>
              {type === 'WEEKLY' ? 'Tuần' : 'Tháng'}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {seriesPool.map((series: any) => {
          const isSelected = selectedIds.includes(series.id);
          const isDisabled = !isSelected && selectedIds.length >= period.maxSeriesPerVote;
          
          return (
            <TouchableOpacity
              key={series.id}
              style={[
                styles.card,
                { backgroundColor: currentColors.surface },
                isSelected && { borderColor: currentColors.primary, borderWidth: 2 },
                isDisabled && { opacity: 0.5 }
              ]}
              activeOpacity={0.7}
              onPress={() => !isDisabled && toggleSelection(series.id)}
            >
              {series.coverImageUrl ? (
                <Image
                  source={{ uri: series.coverImageUrl }}
                  style={styles.coverImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.coverImage, styles.noImageContainer, { backgroundColor: currentColors.background }]}>
                  <Lock size={24} color={currentColors.textSecondary} />
                  <Typography variant="caption" style={{ color: currentColors.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 4 }}>
                    Đăng nhập để xem ảnh
                  </Typography>
                </View>
              )}
              {isSelected && (
                <View style={styles.selectedOverlay}>
                  <CheckCircle2 size={32} color={currentColors.primary} fill="#fff" />
                </View>
              )}
              <View style={styles.cardInfo}>
                <Typography variant="bodyBold" numberOfLines={2} style={{ color: currentColors.text }}>
                  {series.title}
                </Typography>
                <Typography variant="caption" style={{ color: currentColors.textSecondary }}>
                  {series.publicationType}
                </Typography>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: currentColors.surface, borderTopColor: currentColors.border }]}>
        <Button
          title={`Tiếp tục (${selectedIds.length}/${period.maxSeriesPerVote})`}
          onPress={handleContinue}
          disabled={selectedIds.length === 0}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    minWidth: 200,
  },
  header: {
    padding: 16,
  },
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  tab: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 18, paddingVertical: 9 },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    gap: 6,
  },
  countdownText: {
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    width: '47%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
    marginHorizontal: '1.5%',
  },
  coverImage: {
    width: '100%',
    aspectRatio: 3/4,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    padding: 12,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  }
});
