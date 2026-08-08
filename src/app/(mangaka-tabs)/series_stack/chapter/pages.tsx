import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Monitor } from 'lucide-react-native';
import { Typography } from '../../../../components/Typography';
import { mangakaApi } from '../../../../api/mangaka';
import { useThemeStore } from '../../../../store/useThemeStore';
import { colors } from '../../../../theme/colors';
import { translatePageStatus } from '../../../../utils/statusTranslator';

type Page = { id: string; pageNumber?: number; status?: string; originalFile?: string; compositeFile?: string; displayFile?: string };

export default function ChapterPagesScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const currentColors = colors[theme];
  const [pages, setPages] = useState<Page[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const lastUrlRenewal = useRef(0);

  const loadPages = useCallback(async () => {
    if (!chapterId) return;
    try {
      setLoading(true);
      const data = await mangakaApi.getChapterPages(chapterId);
      const items: Page[] = data?.items || data || [];
      setPages(items);
      const entries = await Promise.all(items.map(async (page) => {
        const key = page.displayFile || page.compositeFile || page.originalFile;
        if (!key) return [page.id, ''] as const;
        return [page.id, key.startsWith('http') ? key : (await mangakaApi.getSignedUrl(key)) || ''] as const;
      }));
      setUrls(Object.fromEntries(entries));
    } catch {
      setPages([]);
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  const renewExpiredUrls = useCallback(() => {
    const now = Date.now();
    if (now - lastUrlRenewal.current < 10_000) return;
    lastUrlRenewal.current = now;
    void loadPages();
  }, [loadPages]);

  useEffect(() => { loadPages(); }, [loadPages]);

  return <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
    <View style={[styles.header, { borderBottomColor: currentColors.border }]}>
      <TouchableOpacity accessibilityLabel="Quay lại" onPress={() => router.back()}><ChevronLeft color={currentColors.text} size={26} /></TouchableOpacity>
      <View><Typography variant="h2">Trang truyện</Typography><Typography variant="caption" color={currentColors.textSecondary}>Chỉ xem trên mobile</Typography></View>
    </View>
    <FlatList
      data={pages}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadPages} />}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<View style={[styles.notice, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}><Monitor color={currentColors.primary} size={18} /><Typography variant="caption" color={currentColors.textSecondary} style={styles.noticeText}>Thêm, sửa hoặc xoá trang truyện thực hiện trên bản web.</Typography></View>}
      ListEmptyComponent={loading ? <ActivityIndicator color={currentColors.primary} style={{ marginTop: 32 }} /> : <Typography variant="body" color={currentColors.textSecondary} style={styles.empty}>Chương này chưa có trang nào.</Typography>}
      renderItem={({ item }) => <View style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
        {urls[item.id] ? <Image source={{ uri: urls[item.id] }} style={styles.image} contentFit="contain" onError={renewExpiredUrls} /> : <View style={[styles.image, styles.placeholder, { backgroundColor: currentColors.background }]}><Typography variant="caption" color={currentColors.textSecondary}>Không có ảnh xem trước</Typography></View>}
        <View style={styles.meta}><Typography variant="bodyBold">Trang {item.pageNumber ?? '—'}</Typography><Typography variant="caption" color={currentColors.textSecondary}>{translatePageStatus(item.status)}</Typography></View>
      </View>}
    />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1 }, content: { padding: 16, paddingBottom: 40 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, borderRadius: 12, marginBottom: 16 }, noticeText: { flex: 1 }, empty: { marginTop: 32, textAlign: 'center' },
  card: { overflow: 'hidden', borderRadius: 12, borderWidth: 1, marginBottom: 12 }, image: { width: '100%', height: 260 }, placeholder: { alignItems: 'center', justifyContent: 'center' }, meta: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
});
