import { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Typography } from '../../components/Typography';
import { publicApi, SeriesPublic } from '../../api/public';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useThemeStore } from '../../store/useThemeStore';
import { Trophy } from 'lucide-react-native';

export default function PublicHome() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const [series, setSeries] = useState<SeriesPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [type, setType] = useState<string>(''); // empty means ALL

  const fetchCatalog = async () => {
    try {
      const data = await publicApi.getCatalog({ publicationType: type || undefined });
      setSeries(data?.items || []);
    } catch (e) {
      console.log('Fetch catalog error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchCatalog();
  }, [type]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCatalog();
  };

  const renderItem = ({ item }: { item: SeriesPublic }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: currentColors.surface }]} 
      onPress={() => router.push(`/(public)/series/${item.id}`)}
    >
      <Image 
        source={{ uri: item.coverImageUrl || 'https://via.placeholder.com/150' }} 
        style={styles.cover} 
        contentFit="cover"
      />
      <View style={styles.cardContent}>
        <Typography variant="h3" numberOfLines={1}>{item.title}</Typography>
        <Typography variant="body" color={currentColors.textSecondary} numberOfLines={1}>
          {item.mangakaName}
        </Typography>
        <Typography variant="caption" color={currentColors.primary}>
          {item.publicationType} • CHƯƠNG MỚI: {item.latestChapterNumber || 0}
        </Typography>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={styles.header}>
        <Typography variant="h1">Danh mục Manga</Typography>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Typography variant="body" color={currentColors.primary}>Đăng nhập</Typography>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {['', 'WEEKLY', 'MONTHLY', 'IRREGULAR'].map((filterType) => (
          <TouchableOpacity 
            key={filterType}
            style={[styles.filterChip, { backgroundColor: currentColors.border }, type === filterType && { backgroundColor: currentColors.primary }]}
            onPress={() => setType(filterType)}
          >
            <Typography 
              variant="caption" 
              color={type === filterType ? '#FFF' : currentColors.text}
            >
              {filterType === '' ? 'TẤT CẢ' : filterType === 'WEEKLY' ? 'HÀNG TUẦN' : filterType === 'MONTHLY' ? 'HÀNG THÁNG' : 'KHÔNG ĐỊNH KỲ'}
            </Typography>
          </TouchableOpacity>
        ))}
        <TouchableOpacity 
            style={[styles.filterChip, { backgroundColor: currentColors.warning, flexDirection: 'row', alignItems: 'center', gap: 4 }]}
            onPress={() => router.push('/(public)/ranking')}
          >
            <Trophy size={14} color="#FFF" />
            <Typography variant="caption" color="#FFF">XẾP HẠNG</Typography>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={series}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Typography variant="body" style={{ textAlign: 'center', marginTop: 40 }}>
              Không có truyện nào.
            </Typography>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexWrap: 'wrap'
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  list: { padding: 16, gap: 16 },
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cover: { width: 100, height: 140 },
  cardContent: { flex: 1, padding: 12, justifyContent: 'center', gap: 4 }
});
