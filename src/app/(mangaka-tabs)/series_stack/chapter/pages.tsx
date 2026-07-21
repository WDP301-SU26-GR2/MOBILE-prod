import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, RefreshControl, Alert, ActivityIndicator, Modal, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { ChevronLeft, Plus, ImageIcon } from 'lucide-react-native';
import { Typography } from '../../../../components/Typography';
import { useThemeStore } from '../../../../store/useThemeStore';
import { colors } from '../../../../theme/colors';
import { mangakaApi } from '../../../../api/mangaka';
import { uploadFileToR2 } from '../../../../utils/upload';
import * as ImagePicker from 'expo-image-picker';

interface Page {
  id: string;
  pageNumber: number;
  status: 'DRAFT' | 'COMPLETED' | 'REVISING';
  originalFile?: string;
  compositeFile?: string;
  displayFile?: string;
}

const PageThumbnail = ({ page, currentColors, onPress, onLongPress }: { page: Page, currentColors: any, onPress: (url: string) => void, onLongPress: (page: Page) => void }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchUrl = async () => {
      const fileKey = page.displayFile || page.compositeFile || page.originalFile;
      if (!fileKey) {
        setLoading(false);
        return;
      }
      
      if (fileKey.startsWith('http')) {
        setImageUrl(fileKey);
        setLoading(false);
        return;
      }
      
      try {
        const url = await mangakaApi.getSignedUrl(fileKey);
        if (mounted) {
          setImageUrl(url);
          setLoading(false);
        }
      } catch (error) {
        if (mounted) setLoading(false);
      }
    };
    fetchUrl();
    return () => { mounted = false; };
  }, [page]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return currentColors.success || '#4CAF50';
      case 'REVISING': return currentColors.warning || '#FF9800';
      case 'DRAFT':
      default: return currentColors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Hoàn thành';
      case 'REVISING': return 'Đang sửa';
      case 'DRAFT': return 'Bản nháp';
      default: return status;
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.thumbnailContainer, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}
      onPress={() => { if (imageUrl) onPress(imageUrl); }}
      onLongPress={() => onLongPress(page)}
    >
      <View style={[styles.imageWrapper, { backgroundColor: currentColors.background }]}>
        {loading ? (
          <ActivityIndicator color={currentColors.primary} />
        ) : imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.noImage}>
            <ImageIcon size={24} color={currentColors.textSecondary} />
            <Typography variant="caption" style={{ color: currentColors.textSecondary, marginTop: 4 }}>Trống</Typography>
          </View>
        )}
      </View>
      <View style={[styles.pageNumberBadge, { backgroundColor: currentColors.primary }]}>
        <Typography variant="caption" style={{ color: '#FFF', fontWeight: 'bold' }}>{page.pageNumber}</Typography>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(page.status) }]}>
        <Typography variant="caption" style={{ color: '#FFF', fontSize: 10, fontWeight: '600' }}>{getStatusText(page.status)}</Typography>
      </View>
    </TouchableOpacity>
  );
};

export default function ChapterPagesScreen() {
  const router = useRouter();
  const { chapterId, chapterNumber } = useLocalSearchParams<{ chapterId: string, chapterNumber?: string }>();
  const theme = useThemeStore((state) => state.theme);
  const currentColors = colors[theme];
  const insets = useSafeAreaInsets();

  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    try {
      if (!chapterId) return;
      const res = await mangakaApi.getChapterPages(chapterId);
      if (res && res.items) {
        setPages([...res.items].sort((a: Page, b: Page) => a.pageNumber - b.pageNumber));
      }
    } catch (error) {
      console.error('Error fetching chapter pages:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách trang');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [chapterId]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPages();
  };

  const handleAddPage = async () => {
    if (!chapterId) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Cần quyền truy cập ảnh', 'Hãy cho phép ứng dụng truy cập thư viện ảnh để thêm trang truyện.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 50,
      orderedSelection: true,
      quality: 1,
    });

    if (pickerResult.canceled || !pickerResult.assets.length) return;

    const supportedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (pickerResult.assets.some((asset) => asset.mimeType && !supportedTypes.has(asset.mimeType))) {
      Alert.alert('Định dạng chưa hỗ trợ', 'Chỉ có thể tải lên ảnh JPEG, PNG hoặc WebP.');
      return;
    }

    try {
      setLoading(true);
      let pageNumber = pages.reduce((max, page) => Math.max(max, page.pageNumber), 0) + 1;
      for (const asset of pickerResult.assets) {
        const contentType = asset.mimeType || 'image/jpeg';
        const fileName = asset.fileName || `page-${pageNumber}.${contentType.split('/')[1]}`;
        const originalFile = await uploadFileToR2(asset.uri, fileName, contentType);
        await mangakaApi.createPage(chapterId, { pageNumber, originalFile });
        pageNumber += 1;
      }
      await fetchPages();
      Alert.alert('Thành công', `Đã thêm ${pickerResult.assets.length} trang.`);
    } catch (error: any) {
      Alert.alert('Không thể thêm trang', error.response?.data?.message || error.message || 'Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const draftCount = pages.filter(p => p.status === 'DRAFT').length;
  const completedCount = pages.filter(p => p.status === 'COMPLETED').length;
  const revisingCount = pages.filter(p => p.status === 'REVISING').length;

  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: currentColors.border }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <ChevronLeft size={24} color={currentColors.text} />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Typography variant="h3" style={{ color: currentColors.text }}>
          Quản lý Trang {chapterNumber ? `- Ch. ${chapterNumber}` : ''}
        </Typography>
        <View style={[styles.headerBadge, { backgroundColor: currentColors.surface }]}>
          <Typography variant="caption" style={{ color: currentColors.primary, fontWeight: 'bold' }}>
            {pages.length}
          </Typography>
        </View>
      </View>
    </View>
  );

  const renderStatusBar = () => (
    <View style={[styles.statusBar, { backgroundColor: currentColors.surface, borderBottomColor: currentColors.border }]}>
      <View style={styles.statusItem}>
        <View style={[styles.statusDot, { backgroundColor: currentColors.textSecondary }]} />
        <Typography variant="caption" style={{ color: currentColors.textSecondary }}>Nháp: {draftCount}</Typography>
      </View>
      <View style={styles.statusItem}>
        <View style={[styles.statusDot, { backgroundColor: currentColors.warning || '#FF9800' }]} />
        <Typography variant="caption" style={{ color: currentColors.textSecondary }}>Đang sửa: {revisingCount}</Typography>
      </View>
      <View style={styles.statusItem}>
        <View style={[styles.statusDot, { backgroundColor: currentColors.success || '#4CAF50' }]} />
        <Typography variant="caption" style={{ color: currentColors.textSecondary }}>Hoàn thành: {completedCount}</Typography>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Typography variant="body" style={{ color: currentColors.textSecondary, textAlign: 'center', marginTop: 40 }}>
          Chưa có trang nào. Hãy thêm trang đầu tiên!
        </Typography>
      </View>
    );
  };

  const handlePageOptions = (page: Page) => {
    if (page.status === 'COMPLETED') {
      Alert.alert('Không thể chỉnh sửa', 'Trang đã hoàn thành không thể sửa hoặc xoá.');
      return;
    }
    Alert.alert('Tuỳ chọn trang ' + page.pageNumber, 'Bạn muốn làm gì?', [
      { text: 'Huỷ', style: 'cancel' },
      { 
        text: 'Xoá trang', 
        style: 'destructive',
        onPress: () => {
          Alert.alert('Xác nhận', 'Bạn có chắc muốn xoá trang này?', [
            { text: 'Huỷ', style: 'cancel' },
            { 
              text: 'Xoá', 
              style: 'destructive',
              onPress: async () => {
                try {
                  const deleted = await mangakaApi.deletePage(page.id);
                  await fetchPages();
                  const taskCount = deleted?.deletedTasks ?? 0;
                  Alert.alert('Đã xoá trang', taskCount ? `Đã xoá kèm ${taskCount} task chưa duyệt.` : 'Danh sách trang đã được đánh số lại tự động.');
                } catch (e: any) {
                  Alert.alert('Lỗi', 'Không thể xoá trang');
                }
              }
            }
          ]);
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      {renderHeader()}
      {renderStatusBar()}
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentColors.primary} />
        </View>
      ) : (
        <FlatList
          data={pages}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item }) => <PageThumbnail page={item} currentColors={currentColors} onPress={setSelectedImage} onLongPress={handlePageOptions} />}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={currentColors.primary} />
          }
        />
      )}

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: currentColors.primary, bottom: insets.bottom + 20 }]} 
        onPress={handleAddPage}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalOverlayBg} onPress={() => setSelectedImage(null)} />
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedImage(null)}>
              <Typography color="#FFF" variant="bodyBold">Đóng X</Typography>
            </TouchableOpacity>
            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.fullImage} contentFit="contain" />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    flex: 1,
  },
  headerBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  listContent: {
    padding: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  thumbnailContainer: {
    width: '48%',
    aspectRatio: 0.7,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumberBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    left: 6,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalOverlayBg: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  modalContent: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  fullImage: { width: '100%', height: '80%' }
});
