import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../../components/Typography';
import { colors } from '../../../theme/colors';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../../store/useThemeStore';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_WIDTH = (width - 32 - (COLUMN_COUNT - 1) * 8) / COLUMN_COUNT;

export default function NameWorkspace() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const [pages, setPages] = useState([
    { id: '1', pageNumber: 1, imageUrl: 'https://via.placeholder.com/150', status: 'APPROVED' },
    { id: '2', pageNumber: 2, imageUrl: 'https://via.placeholder.com/150', status: 'NEEDS_REVISION' },
    { id: '3', pageNumber: 3, imageUrl: 'https://via.placeholder.com/150', status: 'DRAFT' },
    { id: '4', pageNumber: 4, imageUrl: 'https://via.placeholder.com/150', status: 'DRAFT' },
  ]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.pageCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
      <Image source={{ uri: item.imageUrl }} style={styles.pageImage} contentFit="cover" />
      <View style={styles.pageInfo}>
        <Typography variant="bodyBold">Trang {item.pageNumber}</Typography>
        <Typography variant="caption" color={currentColors.textSecondary}>Trạng thái: {item.status}</Typography>
      </View>
      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: currentColors.primary }]}>
        <Typography variant="caption" color="#fff">Duyệt</Typography>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={[styles.header, { borderBottomColor: currentColors.border }]}>
        <Typography variant="h2">Không gian làm Name</Typography>
        <Typography variant="body" color={currentColors.textSecondary}>Chương 45 - "Sự thức tỉnh"</Typography>
      </View>

      <FlatList
        data={pages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  list: { padding: 16, gap: 16 },
  pageCard: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center'
  },
  pageImage: { width: 60, height: 80 },
  pageInfo: { flex: 1, padding: 12 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, marginRight: 12 }
});
