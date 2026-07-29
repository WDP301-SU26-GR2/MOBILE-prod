import { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Typography } from '../../../components/Typography';
import { publicApi } from '../../../api/public';
import { colors } from '../../../theme/colors';
import { useThemeStore } from '../../../store/useThemeStore';

export default function SeriesDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const [series, setSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await publicApi.getSeriesDetail(id as string);
        setSeries(data);
      } catch (e) {
        console.log('Error fetching series detail', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: currentColors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!series) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: currentColors.background }]}>
        <Typography variant="body">Không tìm thấy truyện.</Typography>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <Image 
        source={{ uri: series.coverImageUrl || 'https://via.placeholder.com/400x300' }} 
        style={styles.cover} 
        contentFit="cover"
      />
      <View style={styles.content}>
        <Typography variant="h1" style={styles.title}>{series.title}</Typography>
        <Typography variant="bodyBold" color={currentColors.primary} style={styles.author}>
          {series.mangakaName || 'Chưa rõ tác giả'}
        </Typography>
        
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: currentColors.primary }]}>
            <Typography variant="caption" color="#fff">{series.publicationType || 'ĐANG TIẾN HÀNH'}</Typography>
          </View>
          <Typography variant="caption" color={currentColors.textSecondary}>
            {series.genres?.join(', ')}
          </Typography>
        </View>

        <Typography variant="body" style={styles.synopsis}>
          {series.synopsis || 'Chưa có tóm tắt.'}
        </Typography>

        <Typography variant="h2" style={styles.chapterTitle}>Danh sách chương</Typography>
        
        {series.chapters?.length > 0 ? (
          series.chapters.map((ch: any) => (
            <TouchableOpacity 
              key={ch.id} 
              style={[styles.chapterCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}
              onPress={() => router.push(`/(public)/chapter/${ch.id}`)}
            >
              <Typography variant="bodyBold">Chương {ch.chapterNumber}: {ch.title}</Typography>
            </TouchableOpacity>
          ))
        ) : (
          <Typography variant="body" color={currentColors.textSecondary}>Chưa có chương nào.</Typography>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  cover: { width: '100%', height: 250 },
  content: { padding: 16 },
  title: { marginBottom: 8 },
  author: { marginBottom: 12 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  synopsis: { lineHeight: 24, marginBottom: 24 },
  chapterTitle: { marginBottom: 12, marginTop: 12 },
  chapterCard: { 
    padding: 16, 
    borderRadius: 8, 
    marginBottom: 8,
    borderWidth: 1,
  }
});
