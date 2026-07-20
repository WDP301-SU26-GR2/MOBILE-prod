import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions, Alert, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../../components/Typography';
import { colors } from '../../../theme/colors';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useThemeStore } from '../../../store/useThemeStore';
import { ChevronLeft } from 'lucide-react-native';
import { mangakaApi } from '../../../api/mangaka';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_WIDTH = (width - 32 - (COLUMN_COUNT - 1) * 8) / COLUMN_COUNT;

export default function NameWorkspace() {
  const router = useRouter();
  const { chapterId } = useLocalSearchParams();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const [pages, setPages] = useState<any[]>([]);
  const [nameInfo, setNameInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  React.useEffect(() => {
    if (chapterId) {
      fetchNameData();
    }
  }, [chapterId]);

  const fetchNameData = async () => {
    try {
      setLoading(true);
      const data = await mangakaApi.getChapterNames(chapterId as string);
      if (data && data.items && data.items.length > 0) {
        const firstName = data.items[0];
        setNameInfo(firstName);
        
        // Xin signed URL cho từng trang
        const pagesWithUrls = await Promise.all(
          (firstName.pages || []).map(async (p: any) => {
            let finalUrl = p.fileUrl;
            if (p.fileUrl && !p.fileUrl.startsWith('http')) {
              const signed = await mangakaApi.getSignedUrl(p.fileUrl);
              if (signed) finalUrl = signed;
            }
            return { ...p, signedUrl: finalUrl };
          })
        );
        setPages(pagesWithUrls);
      } else {
        setNameInfo(null);
        setPages([]);
      }
    } catch (error) {
      console.log('Error fetching names:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.pageCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}
      onPress={() => setSelectedImage(item.signedUrl || item.fileUrl)}
    >
      <Image source={{ uri: item.signedUrl || item.fileUrl || 'https://via.placeholder.com/150' }} style={styles.pageImage} contentFit="cover" />
      <View style={styles.pageInfo}>
        <Typography variant="bodyBold">Trang {item.pageNumber}</Typography>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Typography>Đang tải...</Typography>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={[styles.header, { borderBottomColor: currentColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
          <ChevronLeft color={currentColors.text} size={28} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Typography variant="h2" numberOfLines={1}>Không gian làm Name</Typography>
          <Typography variant="body" color={currentColors.textSecondary} numberOfLines={1}>
            Trạng thái: {nameInfo?.status || 'Chưa có Name'}
          </Typography>
        </View>
      </View>

      {!nameInfo ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Typography color={currentColors.textSecondary}>Chapter này chưa có Name nào.</Typography>
        </View>
      ) : (
        <FlatList
          data={pages}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Fullscreen Image Viewer Modal */}
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
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' },
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
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, marginRight: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalOverlayBg: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  modalContent: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  fullImage: { width: '100%', height: '80%' }
});
