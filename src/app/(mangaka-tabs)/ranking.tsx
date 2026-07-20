import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/Typography';
import { colors } from '../../theme/colors';
import { useThemeStore } from '../../store/useThemeStore';
import { mangakaApi } from '../../api/mangaka';
import { AlertTriangle } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export default function RankingMangaka() {
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  
  const [loading, setLoading] = useState(true);
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [rankings, setRankings] = useState<any[]>([]);

  useEffect(() => {
    fetchSeries();
  }, []);

  useEffect(() => {
    if (selectedSeriesId) {
      fetchRankings(selectedSeriesId);
    }
  }, [selectedSeriesId]);

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const data = await mangakaApi.getMySeries();
      const items = data?.items || [];
      setSeriesList(items);
      if (items.length > 0) {
        setSelectedSeriesId(items[0].id);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.log('Error fetching series for ranking:', e);
      setLoading(false);
    }
  };

  const fetchRankings = async (seriesId: string) => {
    try {
      setLoading(true);
      const data = await mangakaApi.getRankings({ seriesId, periods: 12 });
      setRankings(data?.items || []);
    } catch (e) {
      console.log('Error fetching rankings:', e);
    } finally {
      setLoading(false);
    }
  };

  const currentRank = rankings.length > 0 ? rankings[rankings.length - 1] : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={styles.header}>
        <Typography variant="h1">Bảng xếp hạng của tôi</Typography>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {seriesList.length === 0 && !loading && (
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <Typography color={currentColors.textSecondary}>Bạn chưa có truyện nào.</Typography>
          </View>
        )}

        {seriesList.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seriesPicker} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {seriesList.map(series => (
              <TouchableOpacity
                key={series.id}
                style={[
                  styles.seriesChip,
                  { backgroundColor: selectedSeriesId === series.id ? currentColors.primary : currentColors.surface }
                ]}
                onPress={() => setSelectedSeriesId(series.id)}
              >
                <Typography 
                  variant="caption" 
                  color={selectedSeriesId === series.id ? '#FFF' : currentColors.text}
                >
                  {series.title}
                </Typography>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color={currentColors.primary} />
        ) : (
          selectedSeriesId && (
            <View style={styles.statsContainer}>
              {currentRank?.isAtRisk && (
                <View style={[styles.warningCard, { backgroundColor: theme === 'dark' ? '#3B1A1A' : '#FFEBEB' }]}>
                  <AlertTriangle color={currentColors.error} size={24} />
                  <View style={{ flex: 1 }}>
                    <Typography variant="bodyBold" color={currentColors.error}>Nguy cơ tụt hạng!</Typography>
                    <Typography variant="caption" color={currentColors.error}>
                      Truyện đang nằm trong nhóm bottom 1/3 kỳ này.
                    </Typography>
                  </View>
                </View>
              )}

              <View style={[styles.card, { backgroundColor: currentColors.surface }]}>
                <Typography variant="body" color={currentColors.textSecondary}>Hạng hiện tại</Typography>
                <Typography variant="h1" style={{ color: currentColors.primary, marginTop: 4 }}>
                  {currentRank?.rankPosition ? `#${currentRank.rankPosition}` : '--'}
                </Typography>
                {currentRank?.rankChange !== null && currentRank?.rankChange !== undefined && (
                  <Typography variant="caption" style={{ color: currentRank.rankChange > 0 ? currentColors.success : (currentRank.rankChange < 0 ? currentColors.error : currentColors.textSecondary) }}>
                    {currentRank.rankChange > 0 ? `▲ Tăng ${currentRank.rankChange} hạng` : (currentRank.rankChange < 0 ? `▼ Tụt ${Math.abs(currentRank.rankChange)} hạng` : '— Không đổi')}
                  </Typography>
                )}
              </View>

              {rankings.length > 0 ? (
                <View style={{ marginTop: 24, alignItems: 'center' }}>
                  <Typography variant="bodyBold" style={{ marginBottom: 16, alignSelf: 'flex-start', marginLeft: 16 }}>
                    Biểu đồ (12 kỳ gần nhất)
                  </Typography>
                  <LineChart
                    data={{
                      labels: rankings.map((_, i) => `Kỳ ${i+1}`),
                      datasets: [
                        {
                          data: rankings.map(r => r.rankPosition || 0), // Note: 0 means no rank
                        }
                      ]
                    }}
                    width={width - 32}
                    height={220}
                    chartConfig={{
                      backgroundColor: currentColors.surface,
                      backgroundGradientFrom: currentColors.surface,
                      backgroundGradientTo: currentColors.surface,
                      decimalPlaces: 0,
                      color: (opacity = 1) => currentColors.primary,
                      labelColor: (opacity = 1) => currentColors.textSecondary,
                      style: { borderRadius: 16 },
                      propsForDots: { r: '4', strokeWidth: '2', stroke: currentColors.primary }
                    }}
                    bezier
                    style={{ marginVertical: 8, borderRadius: 16 }}
                    // Đảo trục Y: react-native-chart-kit doesn't natively support reversed Y axis easily,
                    // but we can pass formatYLabel to hide it or trick it, but standard is fine for now.
                    // Actually, lower number (rank 1) is better.
                  />
                </View>
              ) : (
                <View style={{ marginTop: 40, alignItems: 'center' }}>
                  <Typography color={currentColors.textSecondary}>Chưa có dữ liệu xếp hạng.</Typography>
                </View>
              )}
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  content: { paddingBottom: 40 },
  seriesPicker: { 
    maxHeight: 50, 
    marginBottom: 16,
    flexGrow: 0 
  },
  seriesChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  statsContainer: { paddingHorizontal: 16 },
  card: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  warningCard: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  }
});
