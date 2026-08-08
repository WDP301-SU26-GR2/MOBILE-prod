import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/Typography';
import { colors } from '../../theme/colors';
import { useThemeStore } from '../../store/useThemeStore';
import { mangakaApi } from '../../api/mangaka';

export default function RankingMangaka() {
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  
  const [loading, setLoading] = useState(true);
  const [surveyPeriods, setSurveyPeriods] = useState<any[]>([]);
  const [selectedMagazine, setSelectedMagazine] = useState<string | null>(null);
  const [selectedPubType, setSelectedPubType] = useState<string | null>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [boardRankings, setBoardRankings] = useState<any[]>([]);

  const uniqueMagazines = Array.from(new Set(surveyPeriods.map(p => p.magazine).filter(Boolean)));
  const uniquePubTypes = Array.from(new Set(surveyPeriods.map(p => p.publicationType).filter(Boolean)));

  const filteredPeriods = surveyPeriods.filter(p => 
    (!selectedMagazine || p.magazine === selectedMagazine) &&
    (!selectedPubType || p.publicationType === selectedPubType)
  );

  useEffect(() => {
    fetchPeriods();
  }, []);

  useEffect(() => {
    const isSelectedStillValid = filteredPeriods.some(p => p.id === selectedPeriodId);
    if (!isSelectedStillValid && filteredPeriods.length > 0) {
      setSelectedPeriodId(filteredPeriods[0].id);
    } else if (filteredPeriods.length === 0) {
      setSelectedPeriodId(null);
    }
  }, [selectedMagazine, selectedPubType, surveyPeriods]);

  useEffect(() => {
    if (selectedPeriodId) {
      fetchBoardRankings(selectedPeriodId);
    } else {
      setBoardRankings([]);
    }
  }, [selectedPeriodId]);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const data = await mangakaApi.getSurveyPeriods({ status: 'REFLECTED', limit: 100 });
      const items = data?.items || [];
      setSurveyPeriods(items);
      
      if (items.length > 0) {
        setSelectedMagazine(items[0].magazine);
        setSelectedPubType(items[0].publicationType);
      }
    } catch (e) {
      console.log('Error fetching survey periods:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBoardRankings = async (periodId: string) => {
    try {
      setLoading(true);
      const data = await mangakaApi.getBoardRankings(periodId);
      let items = data?.items || [];
      
      items = await Promise.all(items.map(async (r: any) => {
        const title = r.title || r.seriesTitle || r.seriesName || r.series?.title || r.series?.titleVn;
        if (!title && r.seriesId) {
          try {
            const seriesDetail = await mangakaApi.getSeriesDetail(r.seriesId);
            return { ...r, fetchedTitle: seriesDetail?.title || seriesDetail?.titleVn || null };
          } catch (e) {
            // Không có quyền truy cập hoặc lỗi
            return { ...r, fetchedTitle: null };
          }
        }
        return { ...r, fetchedTitle: title || null };
      }));

      setBoardRankings(items);
    } catch (e) {
      console.log('Error fetching board rankings:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={styles.header}>
        <Typography variant="h1">Bảng xếp hạng toàn tạp chí</Typography>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsContainer}>
          {surveyPeriods.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              {uniqueMagazines.length > 0 && (
                <>
                  <Typography variant="bodyBold" style={{ marginBottom: 8 }}>Lọc tạp chí</Typography>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodPicker}>
                    {uniqueMagazines.map(m => (
                      <TouchableOpacity
                        key={m as string}
                        style={[
                          styles.seriesChip,
                          { backgroundColor: selectedMagazine === m ? currentColors.primary : currentColors.surface }
                        ]}
                        onPress={() => setSelectedMagazine(selectedMagazine === m ? null : (m as string))}
                      >
                        <Typography variant="caption" color={selectedMagazine === m ? '#FFF' : currentColors.text}>
                          {m as string}
                        </Typography>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {uniquePubTypes.length > 0 && (
                <>
                  <Typography variant="bodyBold" style={{ marginBottom: 8, marginTop: 8 }}>Lọc dịp xuất bản</Typography>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodPicker}>
                    {uniquePubTypes.map(t => (
                      <TouchableOpacity
                        key={t as string}
                        style={[
                          styles.seriesChip,
                          { backgroundColor: selectedPubType === t ? currentColors.primary : currentColors.surface }
                        ]}
                        onPress={() => setSelectedPubType(selectedPubType === t ? null : (t as string))}
                      >
                        <Typography variant="caption" color={selectedPubType === t ? '#FFF' : currentColors.text}>
                          {t as string}
                        </Typography>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {filteredPeriods.length > 0 && (
                <>
                  <Typography variant="bodyBold" style={{ marginBottom: 8, marginTop: 8 }}>Chọn kỳ đã công bố</Typography>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodPicker}>
                    {filteredPeriods.map(p => (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.seriesChip,
                          { backgroundColor: selectedPeriodId === p.id ? currentColors.primary : currentColors.surface }
                        ]}
                        onPress={() => setSelectedPeriodId(p.id)}
                      >
                        <Typography variant="caption" color={selectedPeriodId === p.id ? '#FFF' : currentColors.text}>
                          Kỳ {p.reflectedIssueNumber || p.issueNumber || p.name || p.id.slice(-4)}
                        </Typography>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
            </View>
          )}

          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} size="large" color={currentColors.primary} />
          ) : boardRankings.length > 0 ? (
            boardRankings.map((r, index) => {
              const displayTitle = r.fetchedTitle;
              return (
                <View key={r.seriesId || index} style={[styles.card, { backgroundColor: currentColors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, marginBottom: 8 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                    <Typography variant="h2" style={{ color: currentColors.primary, width: 36 }}>#{r.rankPosition}</Typography>
                    <View style={{ flex: 1 }}>
                      {!!displayTitle && (
                        <Typography variant="bodyBold">{displayTitle}</Typography>
                      )}
                      <Typography variant="caption" color={currentColors.textSecondary}>{r.magazine} · {r.publicationType}</Typography>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', width: 60 }}>
                    <Typography variant="caption" style={{ color: r.rankChange > 0 ? currentColors.success : (r.rankChange < 0 ? currentColors.error : currentColors.textSecondary) }}>
                      {r.rankChange > 0 ? `▲ ${r.rankChange}` : (r.rankChange < 0 ? `▼ ${Math.abs(r.rankChange)}` : '—')}
                    </Typography>
                    <Typography variant="caption" color={currentColors.textSecondary}>{r.voteCount || 0} phiếu</Typography>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={{ marginTop: 40, alignItems: 'center' }}>
              <Typography color={currentColors.textSecondary}>Chưa có dữ liệu xếp hạng kỳ này.</Typography>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  content: { paddingBottom: 40 },
  periodPicker: {
    maxHeight: 50,
    marginBottom: 8,
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
  }
});
