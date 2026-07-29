import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { assistantReadApi } from '../../../api/assistant';
import { Typography } from '../../../components/Typography';
import { useThemeStore } from '../../../store/useThemeStore';
import { colors } from '../../../theme/colors';

export default function AssistantRevisionsScreen() {
  const { theme } = useThemeStore(); const currentColors = colors[theme];
  const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { try { const data = await assistantReadApi.getAllRevisionRequests(); setItems(data?.items ?? []); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  return <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>{loading ? <ActivityIndicator color={currentColors.primary} style={{ marginTop: 32 }} /> : <FlatList data={items} keyExtractor={(item, index) => item.id ?? String(index)} contentContainerStyle={styles.list} ListHeaderComponent={<Typography variant="h2">Yêu cầu chỉnh sửa</Typography>} ListEmptyComponent={<Typography variant="body" color={currentColors.textSecondary}>Chưa có yêu cầu chỉnh sửa.</Typography>} renderItem={({ item }) => <View style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}><Typography variant="bodyBold">{item.title || item.targetType || 'Yêu cầu chỉnh sửa'}</Typography><Typography variant="body" color={currentColors.textSecondary}>{item.feedback || item.comment || item.reason || 'Không có nội dung.'}</Typography><Typography variant="caption" color={currentColors.textSecondary}>{item.status || 'READ_ONLY'}</Typography></View>} />}</SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1 }, list: { padding: 16, gap: 12 }, card: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 7 } });
