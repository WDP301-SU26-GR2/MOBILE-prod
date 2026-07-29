import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, ChevronLeft, ChevronRight, MoveHorizontal, MoveVertical } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Typography } from '../../../components/Typography';
import { Button } from '../../../components/Button';
import { publicApi } from '../../../api/public';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ChapterReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [readMode, setReadMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const flatListRef = useRef<FlatList>(null);
  const lastSignedUrlRefreshRef = useRef(0);

  const fetchChapter = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await publicApi.getChapterPages(id as string);
      setData(res);
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.status === 404) {
        setError('404');
      } else {
        setError('Đã có lỗi xảy ra khi tải chương truyện.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => void fetchChapter(), 0);
    return () => clearTimeout(timer);
  }, [fetchChapter]);

  const toggleOverlay = () => setOverlayVisible(!overlayVisible);
  const toggleReadMode = () => setReadMode(prev => prev === 'vertical' ? 'horizontal' : 'vertical');
  const refreshExpiredImages = () => {
    const now = Date.now();
    if (now - lastSignedUrlRefreshRef.current < 10000) return;
    lastSignedUrlRefreshRef.current = now;
    void fetchChapter();
  };

  const handleNextChapter = () => {
    if (data?.nextChapterId) {
      router.replace(`/(public)/chapter/${data.nextChapterId}`);
    }
  };

  const handlePrevChapter = () => {
    if (data?.prevChapterId) {
      router.replace(`/(public)/chapter/${data.prevChapterId}`);
    }
  };

  const handleVote = () => {
    if (data?.series?.id) {
      router.push(`/(public)/vote?seriesId=${data.series.id}`);
    }
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const first = viewableItems[0];
      setCurrentIndex(first.index);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: '#000' }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error === '404') {
    return (
      <View style={[styles.center, { backgroundColor: '#000' }]}>
        <Typography variant="h2" style={{ color: '#fff', marginBottom: 16 }}>404</Typography>
        <Typography variant="body" style={{ color: '#fff', marginBottom: 24 }}>Chương không tồn tại</Typography>
        <Button title="Quay lại" onPress={() => router.back()} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.center, { backgroundColor: '#000' }]}>
        <Typography variant="body" style={{ color: '#fff', marginBottom: 16 }}>{error}</Typography>
        <Button title="Thử lại" onPress={fetchChapter} />
      </View>
    );
  }

  const { series, chapter, pages, prevChapterId, nextChapterId } = data;
  const totalPages = pages?.length || 0;

  const renderItem = ({ item }: { item: any }) => {
    const isHorizontal = readMode === 'horizontal';
    
    return (
      <Pressable onPress={toggleOverlay}>
        <Image
          source={item.imageUrl}
          contentFit="contain"
          style={{
            width: SCREEN_WIDTH,
            height: isHorizontal ? SCREEN_HEIGHT : (SCREEN_WIDTH * 1.5),
            backgroundColor: '#000',
          }}
          onError={refreshExpiredImages}
        />
      </Pressable>
    );
  };

  const renderFooter = () => (
    <Pressable onPress={toggleOverlay} style={[styles.endCard, { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }]}>
      <Typography variant="h3" style={{ color: '#fff', marginBottom: 8 }}>
        Hết chương {chapter?.chapterNumber}
      </Typography>
      <Typography variant="body" style={{ color: '#aaa', marginBottom: 32 }}>
        Cảm ơn bạn đã đọc truyện
      </Typography>
      
      {nextChapterId ? (
        <Button 
          title="Chương tiếp theo" 
          onPress={handleNextChapter} 
          style={styles.endButton}
        />
      ) : (
        <Typography variant="body" style={{ color: '#fff', marginBottom: 16 }}>
          Đây là chương mới nhất
        </Typography>
      )}

      <Button 
        title="Bình chọn truyện này" 
        variant="outlined"
        onPress={handleVote} 
        style={styles.endButton}
      />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={pages}
        keyExtractor={(item, index) => item.pageNumber?.toString() || index.toString()}
        renderItem={renderItem}
        ListFooterComponent={renderFooter}
        horizontal={readMode === 'horizontal'}
        pagingEnabled={readMode === 'horizontal'}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        key={readMode} // force re-render when switching modes
      />

      {overlayVisible && (
        <>
          {/* Header Overlay */}
          <View style={[styles.headerOverlay, { paddingTop: insets.top || 16 }]}>
            <View style={styles.headerRow}>
              <Pressable onPress={() => router.back()} style={styles.iconButton}>
                <ArrowLeft color="#fff" size={24} />
              </Pressable>
              
              <View style={styles.headerTitleContainer}>
                <Typography variant="h3" style={styles.headerTitle} numberOfLines={1}>
                  {series?.title}
                </Typography>
                <Typography variant="caption" style={styles.headerSubtitle} numberOfLines={1}>
                  Chương {chapter?.chapterNumber} {chapter?.title ? `- ${chapter.title}` : ''}
                </Typography>
              </View>

              <Pressable onPress={toggleReadMode} style={styles.iconButton}>
                {readMode === 'vertical' ? (
                  <MoveHorizontal color="#fff" size={24} />
                ) : (
                  <MoveVertical color="#fff" size={24} />
                )}
              </Pressable>
            </View>
          </View>

          {/* Footer Overlay */}
          <View style={[styles.footerOverlay, { paddingBottom: insets.bottom || 16 }]}>
            <View style={styles.footerRow}>
              <Pressable 
                onPress={handlePrevChapter} 
                style={[styles.navButton, !prevChapterId && styles.navButtonDisabled]}
                disabled={!prevChapterId}
              >
                <ChevronLeft color={prevChapterId ? "#fff" : "#666"} size={28} />
              </Pressable>

              <View style={styles.pageIndicator}>
                <Typography variant="bodyBold" style={{ color: '#fff' }}>
                  {Math.min(currentIndex + 1, totalPages)} / {totalPages}
                </Typography>
              </View>

              <Pressable 
                onPress={handleNextChapter} 
                style={[styles.navButton, !nextChapterId && styles.navButtonDisabled]}
                disabled={!nextChapterId}
              >
                <ChevronRight color={nextChapterId ? "#fff" : "#666"} size={28} />
              </Pressable>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  endCard: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 20,
  },
  endButton: {
    width: 200,
    marginBottom: 16,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    padding: 12,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    color: '#ccc',
  },
  footerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    padding: 8,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  pageIndicator: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
});
