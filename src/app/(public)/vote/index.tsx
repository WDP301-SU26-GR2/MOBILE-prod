import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { CheckCircle2, Clock } from 'lucide-react-native';
import { useThemeStore } from '../../../store/useThemeStore';
import { Typography } from '../../../components/Typography';
import { Button } from '../../../components/Button';
import { publicApi } from '../../../api/public';
import { colors } from '../../../theme/colors';

export default function VoteIndexScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<any>(null);
  const [seriesPool, setSeriesPool] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    loadVoteContext();
  }, []);

  useEffect(() => {
    if (!period?.endDate) return;
    
    const updateCountdown = () => {
      const end = new Date(period.endDate).getTime();
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
  }, [period]);

  const loadVoteContext = async () => {
    try {
      const data = await publicApi.getVoteContext();
      if (data && data.period) {
        setPeriod(data.period);
        setSeriesPool(data.seriesPool || []);
      }
    } catch (error) {
      console.error('Failed to load vote context', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      if (period && prev.length >= period.maxSeriesPerVote) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleContinue = () => {
    if (selectedIds.length === 0 || !period) return;
    
    router.push({
      pathname: '/(public)/vote/otp',
      params: {
        periodId: period.id,
        selectedSeriesIds: JSON.stringify(selectedIds)
      }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
        <ActivityIndicator size="large" color={currentColors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!period) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
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
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Typography variant="h2" style={{ color: currentColors.text }}>
          Kỳ bình chọn #{period.number}
        </Typography>
        <View style={styles.countdownContainer}>
          <Clock size={16} color={currentColors.primary} />
          <Typography variant="caption" style={[styles.countdownText, { color: currentColors.primary }]}>
            Còn lại: {timeRemaining}
          </Typography>
        </View>
      </View>
      
      <View style={[styles.statsContainer, { backgroundColor: currentColors.surface }]}>
        <Typography variant="bodyBold" style={{ color: currentColors.text }}>
          Đã chọn {selectedIds.length}/{period.maxSeriesPerVote} truyện
        </Typography>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {seriesPool.map(series => {
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
              <Image
                source={series.coverImageUrl}
                style={styles.coverImage}
                contentFit="cover"
              />
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
          title="Tiếp tục"
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
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  countdownText: {
    fontWeight: 'bold',
  },
  statsContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
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
  cardInfo: {
    padding: 12,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  }
});
