import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { assistantReadApi } from '../../../../api/assistant';
import { Typography } from '../../../../components/Typography';
import { useThemeStore } from '../../../../store/useThemeStore';
import { colors } from '../../../../theme/colors';

export default function AssistantChapterPagesScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const [pages, setPages] = useState<any[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const lastUrlRenewal = useRef(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await assistantReadApi.getChapterPages(chapterId);
      const nextPages = response?.items ?? response ?? [];
      setPages(nextPages);
      const signed = await Promise.all(nextPages.map(async (page: any) => {
        const key = page.displayFile || page.originalFile || page.filePath;
        return key ? [page.id, await assistantReadApi.getSignedDownloadUrl(key)] as const : null;
      }));
      setUrls(Object.fromEntries(signed.filter(Boolean) as [string, string][]));
    } finally { setLoading(false); }
  }, [chapterId]);

  const renewExpiredUrls = useCallback(() => {
    const now = Date.now();
    if (now - lastUrlRenewal.current < 10_000) return;
    lastUrlRenewal.current = now;
    void load();
  }, [load]);

  useEffect(() => { void load(); }, [load]);
  if (loading) return <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}><ActivityIndicator color={currentColors.primary} style={{ marginTop: 32 }} /></SafeAreaView>;
  return <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}><ScrollView contentContainerStyle={styles.content}>
    <Typography variant="h2">Các trang trong chương</Typography>
    <Typography variant="caption" color={currentColors.textSecondary}>Chỉ xem — tải lên và chỉnh sửa thực hiện trên web.</Typography>
    {pages.map((page: any, index: number) => <View key={page.id ?? index} style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
      <Typography variant="bodyBold">Trang {page.pageNumber ?? index + 1}</Typography>
      {urls[page.id] ? <Image source={{ uri: urls[page.id] }} style={styles.image} contentFit="contain" onError={renewExpiredUrls} /> : <Typography variant="caption" color={currentColors.textSecondary}>Không có tệp hiển thị.</Typography>}
    </View>)}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1 }, content: { padding: 16, gap: 12, paddingBottom: 36 }, card: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 }, image: { width: '100%', height: 260, borderRadius: 8 } });
