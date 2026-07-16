import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Typography } from '../../components/Typography';
import { TextInput } from '../../components/TextInput';
import { DirectoryCard } from '../../components/DirectoryCard';
import { directoryApi } from '../../api/directory';
import { Search } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';

export default function MangakasScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mangakas, setMangakas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useThemeStore();
  const currentColors = colors[theme];

  const fetchMangakas = async () => {
    try {
      setLoading(true);
      const res = await directoryApi.getMangakas({ q: searchQuery });
      if (res.success && res.data) {
        setMangakas(res.data.items || []);
      }
    } catch (error) {
      console.log('Error fetching mangakas', error);
      // MOCK DATA for layout testing
      setMangakas([
        { userId: '1', displayName: 'Oda Eiichiro', penName: 'Oda', genres: ['ACTION', 'ADVENTURE'], reputationScore: 4.9, ratingCount: 120, isRecommended: true },
        { userId: '2', displayName: 'Kishimoto Masashi', penName: 'Kishimoto', genres: ['ACTION', 'FANTASY'], reputationScore: 4.8, ratingCount: 95, isRecommended: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMangakas();
  }, [searchQuery]);

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={styles.header}>
        <TextInput
          placeholder="Search mangakas by name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={currentColors.textSecondary} />}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={currentColors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={mangakas}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <DirectoryCard
              name={item.displayName || item.penName || 'Unknown'}
              roles={item.genres || []}
              reputationScore={item.reputationScore}
              ratingCount={item.ratingCount}
              isRecommended={item.isRecommended}
            />
          )}
          ListEmptyComponent={
            <Typography align="center" color={currentColors.textSecondary}>
              No mangakas found.
            </Typography>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingBottom: 0 },
  loader: { marginTop: 40 },
  list: { padding: 16 },
});
