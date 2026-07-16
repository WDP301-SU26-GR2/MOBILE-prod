import { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Typography } from '../../../components/Typography';
import { publicApi } from '../../../api/public';
import { colors } from '../../../theme/colors';

const { width } = Dimensions.get('window');

export default function ChapterReader() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [chapter, setChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChapter = async () => {
      try {
        const data = await publicApi.getChapterContent(id as string);
        setChapter(data);
      } catch (e) {
        console.log('Error fetching chapter content', e);
      } finally {
        setLoading(false);
      }
    };
    fetchChapter();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!chapter) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Typography variant="body" color="#FFF">Không tìm thấy chương.</Typography>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h2" color="#FFF">Chương {chapter.chapterNumber}</Typography>
        <Typography variant="body" color={colors.textSecondary}>{chapter.title}</Typography>
      </View>

      {/* Pages Rendering */}
      {chapter.pages && chapter.pages.length > 0 ? (
        chapter.pages.sort((a:any, b:any) => a.pageNumber - b.pageNumber).map((page: any) => (
          <Image 
            key={page.id}
            source={{ uri: page.imageUrl || 'https://via.placeholder.com/600x800' }} 
            style={styles.pageImage} 
            contentFit="contain"
          />
        ))
      ) : (
        <View style={styles.emptyPages}>
          <Typography variant="body" color={colors.textSecondary}>Chương này chưa có trang nào.</Typography>
        </View>
      )}

      {/* Vote CTA */}
      <View style={styles.footer}>
        <Typography variant="h3" style={{ marginBottom: 16 }} color="#FFF">Bạn thích chương này chứ?</Typography>
        <TouchableOpacity 
          style={styles.voteBtn}
          onPress={() => router.push(`/(public)/vote?chapterId=${id}`)}
        >
          <Typography variant="bodyBold" color="#FFF">Bình chọn cho chương này</Typography>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' }, // Dark background for reader
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, backgroundColor: '#111' },
  pageImage: { width: width, height: width * 1.5, marginBottom: 4 },
  emptyPages: { padding: 32, alignItems: 'center' },
  footer: { padding: 32, alignItems: 'center', backgroundColor: '#111', marginTop: 24, paddingBottom: 60 },
  voteBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 }
});
