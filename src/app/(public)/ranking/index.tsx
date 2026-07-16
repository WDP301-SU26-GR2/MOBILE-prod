import { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Typography } from '../../../components/Typography';
import { publicApi, SeriesPublic } from '../../../api/public';
import { colors } from '../../../theme/colors';

export default function Ranking() {
  const router = useRouter();
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const data = await publicApi.getLatestRanking();
        // Giả sử API trả về mảng các ranking item có chứa series
        setRanking(data);
      } catch (e) {
        console.log('Error fetching ranking', e);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, []);

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const series = item.series || item; // Fallback nếu API trả thẳng mảng series
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => router.push(`/(public)/series/${series.id}`)}
      >
        <View style={styles.rankBadge}>
          <Typography variant="h2" color={index < 3 ? '#FFF' : colors.textSecondary}>
            #{index + 1}
          </Typography>
        </View>
        <Image 
          source={{ uri: series.coverImageUrl || 'https://via.placeholder.com/150' }} 
          style={styles.cover} 
          contentFit="cover"
        />
        <View style={styles.cardContent}>
          <Typography variant="h3" numberOfLines={1}>{series.title}</Typography>
          <Typography variant="body" color={colors.textSecondary} numberOfLines={1}>
            {series.mangakaName}
          </Typography>
          <Typography variant="caption" color={colors.primary}>
            {item.totalScore ? `${item.totalScore} điểm` : 'Chưa có điểm'}
          </Typography>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={ranking}
          keyExtractor={(item) => item.id || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Typography variant="body" style={{ textAlign: 'center', marginTop: 40 }}>
              Chưa có bảng xếp hạng.
            </Typography>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, gap: 16 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rankBadge: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.border
  },
  cover: { width: 80, height: 110 },
  cardContent: { flex: 1, padding: 12, justifyContent: 'center', gap: 4 }
});
