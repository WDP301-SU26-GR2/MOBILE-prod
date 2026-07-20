import React, { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Typography } from '../../../components/Typography';
import { mangakaApi } from '../../../api/mangaka';
import { colors } from '../../../theme/colors';
import { Plus } from 'lucide-react-native';
import { useThemeStore } from '../../../store/useThemeStore';

export default function MySeries() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchMySeries = async () => {
    try {
      setLoading(true);
      const data = await mangakaApi.getMySeries({ status: statusFilter || undefined });
      const seriesList = data?.items || [];
      
      // Lấy số chương thực tế cho từng truyện
      const seriesWithChapters = await Promise.all(
        seriesList.map(async (s: any) => {
          try {
            const chapters = await mangakaApi.getChapters(s.id);
            // API trả về { items: [...], total: ... }
            const count = chapters?.total !== undefined ? chapters.total : (chapters?.items?.length || 0);
            
            let finalCoverUrl = s.coverImage || s.coverImageUrl;
            if (s.coverImage && !s.coverImage.startsWith('http')) {
              const signed = await mangakaApi.getSignedUrl(s.coverImage);
              if (signed) finalCoverUrl = signed;
            }
            
            return { ...s, chaptersCount: count, signedCoverUrl: finalCoverUrl };
          } catch (e) {
            return { ...s, chaptersCount: 0, signedCoverUrl: s.coverImage || s.coverImageUrl };
          }
        })
      );
      
      setSeries(seriesWithChapters);
    } catch (e) {
      console.log('Error fetching my series', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySeries();
  }, [statusFilter]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: currentColors.surface }]} 
      onPress={() => router.push({ pathname: '/(mangaka-tabs)/series_stack/[id]', params: { id: item.id } })}
    >
      <Image 
        source={{ uri: item.signedCoverUrl || item.coverImageUrl || item.coverImage || 'https://via.placeholder.com/150' }} 
        style={styles.cover} 
        contentFit="cover"
      />
      <View style={styles.cardContent}>
        <Typography variant="h3" numberOfLines={1}>{item.title}</Typography>
        <View style={[styles.badge, { backgroundColor: currentColors.primary }]}>
          <Typography variant="caption" color="#fff">{item.status}</Typography>
        </View>
        <Typography variant="caption" color={currentColors.textSecondary}>
          {item._count?.chapters || item.chaptersCount || item.totalChapters || 0} Chương
        </Typography>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={styles.header}>
        <Typography variant="h1">Truyện của tôi</Typography>
      </View>

      <View style={styles.filterRow}>
        {['', 'DRAFT', 'IN_REVIEW', 'SERIALIZED'].map((status) => (
          <TouchableOpacity 
            key={status}
            style={[styles.filterChip, { backgroundColor: currentColors.border }, statusFilter === status && { backgroundColor: currentColors.primary }]}
            onPress={() => setStatusFilter(status)}
          >
            <Typography 
              variant="caption" 
              color={statusFilter === status ? '#FFF' : currentColors.text}
            >
              {status === '' ? 'TẤT CẢ' : status === 'DRAFT' ? 'BẢN NHÁP' : status === 'IN_REVIEW' ? 'ĐANG DUYỆT' : 'ĐÃ XUẤT BẢN'}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={series}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Typography variant="body" style={{ textAlign: 'center', marginTop: 40 }}>
              Bạn chưa có truyện nào.
            </Typography>
          }
        />
      )}

      {/* FAB Create Proposal */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: currentColors.primary }]}
        onPress={() => router.push('/(mangaka-tabs)/series_stack/create')}
      >
        <Plus color="#FFF" size={24} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  cover: { width: 80, height: 110 },
  cardContent: { flex: 1, padding: 12, justifyContent: 'center', gap: 8 },
  badge: { 
    alignSelf: 'flex-start', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 4 
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  }
});
