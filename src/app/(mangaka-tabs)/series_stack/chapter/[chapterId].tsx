import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Typography } from '../../../../components/Typography';
import { Button } from '../../../../components/Button';
import { useThemeStore } from '../../../../store/useThemeStore';
import { mangakaApi } from '../../../../api/mangaka';
import { colors } from '../../../../theme/colors';
import { ChevronLeft, Edit3, Image as ImageIcon, CheckCircle, MessageSquare } from 'lucide-react-native';

export default function ChapterDetail() {
  const { chapterId } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const [chapter, setChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchChapter();
  }, [chapterId]);

  const fetchChapter = async () => {
    try {
      setLoading(true);
      const data = await mangakaApi.getChapterDetail(chapterId as string);
      if (data) {
        try {
          const progressData = await mangakaApi.getChapterProgress(chapterId as string);
          setChapter({ ...data, ...progressData });
        } catch (progressError) {
          console.log('Error fetching progress', progressError);
          setChapter(data);
        }
      } else {
        throw new Error('Data is empty');
      }
    } catch (error: any) {
      console.log('Error fetching chapter detail', error);
      Alert.alert('Lỗi', `Không thể tải dữ liệu Chapter: ${error?.response?.data?.message || error.message}`);
      setChapter(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Typography>Đang tải...</Typography>
      </SafeAreaView>
    );
  }

  // If no chapter found or backend returned error, we show empty state
  if (!chapter) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
        <View style={[styles.header, { borderBottomColor: currentColors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
            <ChevronLeft color={currentColors.text} size={28} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Typography variant="h2">Chi tiết Chapter</Typography>
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Typography color={currentColors.textSecondary}>Không tìm thấy thông tin Chapter.</Typography>
        </View>
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
          <Typography variant="h2" numberOfLines={1}>
            {chapter?.chapterNumber ? `Ch. ${chapter.chapterNumber} - ` : ''}{chapter?.title || 'Chi tiết Chapter'}
          </Typography>
          <Typography variant="caption" color={currentColors.textSecondary}>Trạng thái: {chapter?.status || 'Chưa rõ'}</Typography>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Only show stats if backend provides them */}
        {(chapter?.totalPages !== undefined || chapter?.pagesReady !== undefined) && (
          <View style={[styles.statsRow, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
            <View style={styles.statBox}>
              <Typography variant="h3">{chapter.totalPages || 0}</Typography>
              <Typography variant="caption" color={currentColors.textSecondary}>Tổng số trang</Typography>
            </View>
            <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: currentColors.border }]}>
              <Typography variant="h3">{chapter.pagesReady || 0}</Typography>
              <Typography variant="caption" color={currentColors.success}>Trang đã xong</Typography>
            </View>
            <View style={styles.statBox}>
              <Typography variant="h3">{chapter.pagesPending || 0}</Typography>
              <Typography variant="caption" color={currentColors.warning}>Trang đang chờ</Typography>
            </View>
          </View>
        )}

        <Typography variant="h3" style={{ marginTop: 24, marginBottom: 12 }}>Quy trình làm việc</Typography>
        
        <TouchableOpacity 
          style={[styles.workflowCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}
          onPress={() => router.push({ pathname: '/(mangaka-tabs)/series_stack/name-workspace', params: { chapterId } })}
        >
          <Edit3 color={currentColors.primary} size={24} />
          <View style={{ flex: 1 }}>
            <Typography variant="bodyBold">Không gian làm Name</Typography>
            <Typography variant="caption" color={currentColors.textSecondary}>Tải lên và duyệt các trang nháp</Typography>
          </View>
          <ChevronLeft color={currentColors.textSecondary} size={20} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.workflowCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}
          onPress={() => router.push({ pathname: '/(mangaka-tabs)/series_stack/chapter/pages', params: { chapterId } })}
        >
          <ImageIcon color={currentColors.tertiary} size={24} />
          <View style={{ flex: 1 }}>
            <Typography variant="bodyBold">Trang & Công việc trợ lý</Typography>
            <Typography variant="caption" color={currentColors.textSecondary}>Upload trang, xem tiến độ task</Typography>
          </View>
          {chapter?.pagesPending > 0 && (
            <View style={[styles.badge, { backgroundColor: currentColors.warning }]}>
              <Typography variant="caption" color="#fff">{chapter.pagesPending}</Typography>
            </View>
          )}
          <ChevronLeft color={currentColors.textSecondary} size={20} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.workflowCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}
          onPress={() => router.push({ pathname: '/(mangaka-tabs)/deadline' })}
        >
          <MessageSquare color={currentColors.secondary} size={24} />
          <View style={{ flex: 1 }}>
            <Typography variant="bodyBold">Thương lượng Deadline</Typography>
            <Typography variant="caption" color={currentColors.textSecondary}>Xin gia hạn hoặc xem yêu cầu</Typography>
          </View>
          <ChevronLeft color={currentColors.textSecondary} size={20} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>

        {chapter?.editorCommentsCount > 0 && (
          <>
            <Typography variant="h3" style={{ marginTop: 24, marginBottom: 12 }}>Phản hồi & Đánh giá</Typography>
            <TouchableOpacity style={[styles.workflowCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
              <MessageSquare color={currentColors.secondary} size={24} />
              <View style={{ flex: 1 }}>
                <Typography variant="bodyBold">Bình luận của Editor</Typography>
                <Typography variant="caption" color={currentColors.textSecondary}>{chapter.editorCommentsCount} bình luận mới</Typography>
              </View>
              <View style={[styles.badge, { backgroundColor: currentColors.error }]}>
                <Typography variant="caption" color="#fff">{chapter.editorCommentsCount}</Typography>
              </View>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>

      {chapter?.status !== 'PUBLISHED' && chapter?.status !== 'READY_FOR_PRINT' && (
        <View style={[styles.footer, { borderTopColor: currentColors.border }]}>
          {chapter?.status === 'EDITOR_REVISION' || chapter?.status === 'EDITOR_REVIEW' ? (
            <Button 
              title="Nộp lại cho Editor" 
              variant="primary" 
              style={{ flex: 1 }} 
              onPress={async () => {
                try {
                  await mangakaApi.resubmitManuscript(chapterId as string); 
                  Alert.alert('Thành công', 'Đã nộp lại Manuscript cho Editor.');
                  fetchChapter();
                } catch (e: any) {
                  Alert.alert('Không thể nộp', e.response?.data?.message || 'Chưa đủ điều kiện nộp.');
                }
              }}
            />
          ) : chapter?.status === 'IN_PRODUCTION' || chapter?.status === 'DRAFT' ? (
            <Button 
              title="Nộp cho Editor" 
              variant="primary" 
              style={{ flex: 1 }} 
              onPress={async () => {
                try {
                  await mangakaApi.submitManuscript(chapterId as string); 
                  Alert.alert('Thành công', 'Đã nộp Manuscript cho Editor.');
                  fetchChapter();
                } catch (e: any) {
                  Alert.alert('Không thể nộp', e.response?.data?.message || 'Chưa đủ điều kiện nộp.');
                }
              }}
            />
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 1 
  },
  content: { flex: 1, padding: 16 },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
    marginBottom: 8
  },
  statBox: {
    flex: 1,
    alignItems: 'center'
  },
  workflowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    flexDirection: 'row'
  }
});
