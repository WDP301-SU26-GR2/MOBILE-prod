import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { mangakaApi } from '../../api/mangaka';
import { Typography } from '../../components/Typography';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';

type Section = 'REPRINTS' | 'TRANSFERS' | 'DIRECTORY' | 'RANKINGS';
const sections: { id: Section; label: string }[] = [
  { id: 'REPRINTS', label: 'Tái bản' }, { id: 'TRANSFERS', label: 'Chuyển nhượng' }, { id: 'DIRECTORY', label: 'Danh bạ' }, { id: 'RANKINGS', label: 'Xếp hạng' },
];

export default function MangakaInsightsScreen() {
  const router = useRouter(); const { theme } = useThemeStore(); const currentColors = colors[theme];
  const [section, setSection] = useState<Section>('REPRINTS'); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      setLoading(true);
      if (section === 'RANKINGS') {
        const seriesResult = await mangakaApi.getAllMySeries();
        const series = seriesResult?.items ?? [];
        const trends = await Promise.all(
          series.map(async (entry: any) => {
            const result = await mangakaApi.getRankings({ seriesId: entry.id, periods: 60 });
            return (result?.items ?? []).map((ranking: any) => ({
              ...ranking,
              seriesTitle: entry.title,
            }));
          }),
        );
        setItems(trends.flat());
        return;
      }
      const result = section === 'REPRINTS'
        ? await mangakaApi.getReprintRequests()
        : section === 'TRANSFERS'
          ? await mangakaApi.getTransferRequests()
          : await mangakaApi.getAllMangakas();
      setItems(result?.items ?? result?.results ?? result?.data ?? (Array.isArray(result) ? result : []));
    } catch { setItems([]); } finally { setLoading(false); }
  }, [section]);
  useEffect(() => { void load(); }, [load]);
  const detail = async (item: any) => {
    try {
      if (section === 'REPRINTS') {
        const [request, chapters] = await Promise.all([mangakaApi.getReprintRequest(item.id), mangakaApi.getReprintChapters(item.id)]);
        const first = (chapters?.items ?? chapters ?? [])[0];
        if (first?.id) await mangakaApi.getReprintChapter(item.id, first.id);
        Alert.alert('Chi tiết tái bản', [request?.status, request?.reason, `${(chapters?.items ?? chapters ?? []).length} chương`].filter(Boolean).join('\n'));
      } else if (section === 'TRANSFERS') {
        const request = await mangakaApi.getTransferRequest(item.id);
        const transferContractId = request?.transferContractId
          ?? request?.transferContract?.id
          ?? request?.contract?.transferContractId;
        const signatureResult = transferContractId
          ? await mangakaApi.getTransferSignatures(transferContractId)
          : null;
        const signatureCount = signatureResult?.signatures?.length;
        Alert.alert('Chi tiết chuyển nhượng', [
          request?.series?.title,
          request?.status,
          request?.proposedType,
          request?.planDescription,
          transferContractId
            ? `${signatureCount ?? 0} chữ ký`
            : 'BE chưa trả transferContractId nên chưa thể truy vấn chữ ký.',
        ].filter(Boolean).join('\n'));
      } else if (section === 'RANKINGS') {
        const periodId = item.surveyPeriodId || item.periodId || item.surveyPeriod?.id;
        if (!periodId) return Alert.alert('Thiếu kỳ xếp hạng', 'Bản ghi này không có surveyPeriodId để truy vấn chi tiết.');
        const result = await mangakaApi.getBoardRankings(periodId);
        Alert.alert('Xếp hạng kỳ', `${(result?.items ?? result?.results ?? result ?? []).length} kết quả`);
      } else {
        Alert.alert('Thông tin Mangaka', [item.penName || item.displayName || item.name, item.experienceLevel || item.level, item.reputationScore != null ? `Uy tín: ${item.reputationScore}` : null].filter(Boolean).join('\n'));
      }
    } catch { Alert.alert('Không thể tải chi tiết', 'Vui lòng thử lại.'); }
  };
  return <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
    <View style={styles.header}><TouchableOpacity onPress={() => router.back()}><Typography variant="bodyBold" color={currentColors.primary}>‹ Quay lại</Typography></TouchableOpacity><Typography variant="h2">Hồ sơ & lưu trữ</Typography></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>{sections.map(tab => <TouchableOpacity key={tab.id} onPress={() => setSection(tab.id)} style={[styles.tab, { borderColor: currentColors.border }, section === tab.id && { backgroundColor: currentColors.primary, borderColor: currentColors.primary }]}><Typography variant="caption" color={section === tab.id ? '#FFF' : currentColors.text}>{tab.label}</Typography></TouchableOpacity>)}</ScrollView>
    {loading ? <ActivityIndicator color={currentColors.primary} style={{ marginTop: 32 }} /> : <FlatList data={items} keyExtractor={(item, index) => item.id ?? `${item.seriesId ?? 'item'}-${item.surveyPeriodId ?? index}`} contentContainerStyle={styles.list} ListEmptyComponent={<Typography variant="body" color={currentColors.textSecondary}>Chưa có dữ liệu.</Typography>} renderItem={({ item, index }) => <TouchableOpacity onPress={() => void detail(item)} style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}><Typography variant="bodyBold">{item.title || item.seriesTitle || item.name || item.displayName || item.penName || `Bản ghi ${index + 1}`}</Typography><Typography variant="caption" color={currentColors.textSecondary}>{item.status || item.publicationType || item.experienceLevel || item.level || 'Chạm để xem chi tiết'}</Typography></TouchableOpacity>} />}
  </SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1 }, header: { padding: 16, gap: 12 }, tabs: { paddingHorizontal: 16, gap: 8, paddingBottom: 10 }, tab: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 8 }, list: { padding: 16, gap: 10 }, card: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 6 } });
