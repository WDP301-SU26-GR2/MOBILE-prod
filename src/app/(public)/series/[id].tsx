import { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Typography } from '../../../components/Typography';
import { publicApi, PublicChapter, SeriesPublicDetail } from '../../../api/public';
import { colors } from '../../../theme/colors';
import { useThemeStore } from '../../../store/useThemeStore';
import { BookOpen, UserRound } from 'lucide-react-native';

export default function SeriesDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const [series, setSeries] = useState<SeriesPublicDetail | null>(null);
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
        {series.author?.displayName ? (
          <View style={[styles.authorCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
            <View style={[styles.authorIcon, { backgroundColor: `${currentColors.primary}18` }]}>
              <UserRound size={18} color={currentColors.primary} />
            </View>
            <View style={styles.authorCopy}>
              <Typography variant="caption" color={currentColors.textSecondary}>TÁC GIẢ</Typography>
              <Typography variant="bodyBold" numberOfLines={1}>{series.author.displayName}</Typography>
            </View>
          </View>
        ) : null}
        
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

        <View style={styles.chapterHeading}>
          <BookOpen size={20} color={currentColors.primary} />
          <Typography variant="h2">Danh sách chương</Typography>
          <Typography variant="caption" color={currentColors.textSecondary} style={styles.chapterCount}>
            {series.chapters?.length ?? 0} chương
          </Typography>
        </View>
        
        {series.chapters?.length > 0 ? (
          series.chapters.map((ch: PublicChapter) => (
            <TouchableOpacity 
              key={ch.id} 
              style={[styles.chapterCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}
              onPress={() => router.push(`/(public)/chapter/${ch.id}`)}
            >
              <Typography variant="bodyBold" numberOfLines={2}>
                Chương {ch.chapterNumber}{ch.title ? `: ${ch.title}` : ''}
              </Typography>
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
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  authorIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  authorCopy: { flex: 1, gap: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  synopsis: { lineHeight: 24, marginBottom: 24 },
  chapterHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 12 },
  chapterCount: { marginLeft: 'auto' },
  chapterCard: { 
    padding: 16, 
    borderRadius: 8, 
    marginBottom: 8,
    borderWidth: 1,
  }
});
