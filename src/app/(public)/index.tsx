import { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Typography } from '../../components/Typography';
import { TextInput } from '../../components/TextInput';
import { publicApi, SeriesPublic } from '../../api/public';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useThemeStore } from '../../store/useThemeStore';
import { Trophy, ChevronRight, LogIn, PenLine, UserRound } from 'lucide-react-native';
import { ThemeToggle } from '../../components/ThemeToggle';

export default function PublicHome() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const [series, setSeries] = useState<SeriesPublic[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [type, setType] = useState<string>(''); // empty means ALL

  const [openVotePeriods, setOpenVotePeriods] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = async (append = false) => {
    const nextOffset = append ? offset : 0;
    try {
      if (append) setLoadingMore(true);
      setError(null);
      const [catalogData, openPeriodsData] = await Promise.all([
        publicApi.getCatalog({ publicationType: type || undefined, q: searchQuery || undefined, limit: 20, offset: nextOffset }),
        publicApi.getOpenVotePeriods()
      ]);
      const items = catalogData?.items || [];
      setSeries(current => append ? [...current, ...items] : items);
      setOffset(nextOffset + items.length);
      setHasMore(nextOffset + items.length < (catalogData?.total ?? 0));
      setOpenVotePeriods(openPeriodsData?.items ?? []);
    } catch (e) {
      console.log('Fetch catalog error', (e as any)?.message || "Unknown error");
      setHasMore(false);
      setError('Không thể tải danh mục. Kiểm tra kết nối và thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      void fetchCatalog();
    }, 0);
    return () => clearTimeout(timer);
  // fetchCatalog is intentionally triggered by a type change; text search uses explicit submit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCatalog();
  };

  const loadMore = () => {
    if (!error && !loading && !loadingMore && hasMore) void fetchCatalog(true);
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
        {item.author?.displayName ? (
          <View style={styles.authorRow}>
            <UserRound size={14} color={currentColors.textSecondary} />
            <Typography variant="caption" color={currentColors.textSecondary} numberOfLines={1} style={styles.authorName}>
              Tác giả · {item.author.displayName}
            </Typography>
          </View>
        ) : null}
        <Typography variant="body" color={currentColors.textSecondary} numberOfLines={1}>
          {item.magazine || 'Manga công khai'}
        </Typography>
        <Typography variant="caption" color={currentColors.primary}>
           {item.publicationType || 'Chưa phân loại'} • {item.publishedChapterCount > 0 ? `${item.publishedChapterCount} chương` : 'Sắp ra mắt'}
        </Typography>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Typography variant="h2" numberOfLines={1}>Danh mục Manga</Typography>
            <Typography variant="label" color={currentColors.textSecondary} numberOfLines={1}>Đọc truyện • Bình chọn</Typography>
          </View>
          <ThemeToggle />
        </View>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={[styles.loginBtn, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
          <View style={[styles.loginIcon, { backgroundColor: `${currentColors.primary}18` }]}>
            <PenLine size={15} color={currentColors.primary} />
          </View>
          <View style={styles.loginCopy}>
            <Typography variant="label" color={currentColors.primary}>KHU SÁNG TÁC</Typography>
            <Typography variant="caption" color={currentColors.textSecondary}>Mangaka • Assistant • Editor</Typography>
          </View>
          <LogIn size={17} color={currentColors.primary} />
        </TouchableOpacity>
      </View>

      {/* Vote Banner */}
      {openVotePeriods.length > 0 && (
        <TouchableOpacity 
          style={[styles.voteBanner, { backgroundColor: currentColors.surface, borderColor: currentColors.border, borderWidth: 1 }]}
          onPress={() => router.push('/(public)/vote')}
        >
          <View style={{ padding: 8, backgroundColor: 'rgba(52, 152, 219, 0.1)', borderRadius: 8 }}>
            <Trophy color={currentColors.primary} size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="bodyBold" color={currentColors.text}>Có {openVotePeriods.length} kỳ bình chọn đang mở</Typography>
            <Typography variant="caption" color={currentColors.textSecondary}>Nhấn để bình chọn series yêu thích của bạn</Typography>
          </View>
          <ChevronRight color={currentColors.textSecondary} size={20} />
        </TouchableOpacity>
      )}

      <View style={styles.filterRow}>
        {['', 'WEEKLY', 'MONTHLY', 'IRREGULAR'].map((filterType) => (
          <TouchableOpacity 
            key={filterType}
            style={[styles.filterChip, { backgroundColor: currentColors.border }, type === filterType && { backgroundColor: currentColors.primary }]}
            onPress={() => setType(filterType)}
          >
            <Typography 
              variant="caption" 
              color={type === filterType ? currentColors.primaryForeground : currentColors.text}
            >
              {filterType === '' ? 'TẤT CẢ' : filterType === 'WEEKLY' ? 'HÀNG TUẦN' : filterType === 'MONTHLY' ? 'HÀNG THÁNG' : 'KHÔNG ĐỊNH KỲ'}
            </Typography>
          </TouchableOpacity>
        ))}
        <TouchableOpacity 
            style={[styles.filterChip, { backgroundColor: currentColors.warning, flexDirection: 'row', alignItems: 'center', gap: 4 }]}
            onPress={() => router.push('/(public)/ranking')}
          >
            <Trophy size={14} color={currentColors.warningForeground} />
            <Typography variant="caption" color={currentColors.warningForeground}>XẾP HẠNG</Typography>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => { setLoading(true); void fetchCatalog(false); }}
          placeholder="Tìm tên manga"
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={series}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 12 }} /> : null}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            error ? (
              <View style={styles.errorState}>
                <Typography variant="body" color={currentColors.textSecondary} align="center">{error}</Typography>
                <TouchableOpacity onPress={() => { setLoading(true); void fetchCatalog(false); }} style={[styles.retryButton, { backgroundColor: currentColors.primary }]}>
                  <Typography variant="bodyBold" color={currentColors.primaryForeground}>Thử lại</Typography>
                </TouchableOpacity>
              </View>
            ) : (
              <Typography variant="body" style={{ textAlign: 'center', marginTop: 40 }}>
                Không có truyện nào.
              </Typography>
            )
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
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12
  },
  titleRow: { flexBasis: '100%', width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12 },
  titleBlock: { flex: 1, minWidth: 0 },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 7,
    borderWidth: 1,
    flexBasis: '100%',
    width: '100%',
    paddingHorizontal: 10,
    minHeight: 48,
    borderRadius: 12,
  },
  loginIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  loginCopy: { flex: 1, gap: 1 },
  voteBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  searchContainer: { paddingHorizontal: 16 },
  errorState: { alignItems: 'center', gap: 12, marginTop: 40, paddingHorizontal: 24 },
  retryButton: { borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 },
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
  cardContent: { flex: 1, padding: 12, justifyContent: 'center', gap: 4 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  authorName: { flex: 1 }
});

