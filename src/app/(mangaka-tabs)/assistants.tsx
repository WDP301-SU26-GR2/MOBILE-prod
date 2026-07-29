import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from 'react-native';
import { Monitor, Search } from 'lucide-react-native';
import { Typography } from '../../components/Typography';
import { TextInput } from '../../components/TextInput';
import { DirectoryCard } from '../../components/DirectoryCard';
import { mangakaApi } from '../../api/mangaka';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';

export default function AssistantsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [assistants, setAssistants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useThemeStore((state) => state.theme);
  const currentColors = colors[theme];

  const fetchAssistants = useCallback(async () => {
    try {
      setLoading(true);
      const result = await mangakaApi.getAllAssistants({ ...(searchQuery ? { q: searchQuery } : {}) });
      setAssistants(result?.items || result || []);
    } catch { setAssistants([]); }
    finally { setLoading(false); }
  }, [searchQuery]);

  useEffect(() => { fetchAssistants(); }, [fetchAssistants]);
  const showAssistant = async (item: any) => {
    const userId = item.userId || item.id;
    try {
      const [profile, reviews] = await Promise.all([mangakaApi.getAssistantProfile(userId), mangakaApi.getAllAssistantReviews(userId)]);
      Alert.alert('Hồ sơ trợ lý', [profile?.displayName || item.displayName, profile?.availabilityStatus || item.availabilityStatus, `${(reviews?.items ?? reviews ?? []).length} đánh giá`].filter(Boolean).join('\n'));
    } catch { Alert.alert('Không thể tải hồ sơ', 'Vui lòng thử lại.'); }
  };
  return <View style={[styles.container, { backgroundColor: currentColors.background }]}>
    <View style={styles.header}>
      <TextInput placeholder="Tìm trợ lý theo tên..." value={searchQuery} onChangeText={setSearchQuery} leftIcon={<Search size={20} color={currentColors.textSecondary} />} />
      <View style={[styles.notice, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}><Monitor color={currentColors.primary} size={16} /><Typography variant="caption" color={currentColors.textSecondary} style={{ flex: 1 }}>Danh bạ chỉ xem trên mobile. Gửi lời mời cộng tác thực hiện trên bản web.</Typography></View>
    </View>
    {loading ? <ActivityIndicator size="large" color={currentColors.primary} style={styles.loader} /> : <FlatList data={assistants} keyExtractor={(item) => item.userId || item.id} contentContainerStyle={styles.list} renderItem={({ item }) => <DirectoryCard name={item.displayName || 'Unknown'} roles={item.specializations || []} reputationScore={item.reputationScore} ratingAvg={item.ratingAvg} ratingCount={item.ratingCount} isRecommended={item.isRecommended} availability={item.availabilityStatus} onPress={() => void showAssistant(item)} />} ListEmptyComponent={<Typography align="center" color={currentColors.textSecondary}>Không tìm thấy trợ lý nào.</Typography>} />}
  </View>;
}

const styles = StyleSheet.create({ container: { flex: 1 }, header: { padding: 16, gap: 10 }, notice: { flexDirection: 'row', gap: 8, alignItems: 'center', borderRadius: 10, borderWidth: 1, padding: 10 }, loader: { marginTop: 40 }, list: { padding: 16, paddingTop: 0 } });
