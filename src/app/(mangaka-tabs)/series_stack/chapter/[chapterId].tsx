import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Typography } from '../../../../components/Typography';
import { useThemeStore } from '../../../../store/useThemeStore';
import { mangakaApi } from '../../../../api/mangaka';
import { colors } from '../../../../theme/colors';
import { ChevronLeft, Edit3, Image as ImageIcon, MessageSquare } from 'lucide-react-native';

export default function ChapterDetail() {
  const { chapterId } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const [chapter, setChapter] = useState<any>(null);
  const [production, setProduction] = useState<any>({ stages: [], pages: [] });
  const [loading, setLoading] = useState(true);

  const fetchChapter = useCallback(async () => {
    try {
      setLoading(true);
      const data = await mangakaApi.getChapterDetail(chapterId as string);
      if (data) {
        try {
          const progress = await mangakaApi.getChapterProgress(chapterId as string);
          setChapter({ ...data, ...progress });
        } catch (progressError) {
          console.log('Error calculating progress', (progressError as any)?.message || "Unknown error");
          setChapter(data);
        }
        try {
          const stagesResult = await mangakaApi.getProductionStages(chapterId as string);
          const stages = stagesResult?.stages ?? [];
          const pagesResult = stages[0]?.id ? await mangakaApi.getStagePages(chapterId as string, stages[0].id) : [];
          const pages = pagesResult?.items ?? pagesResult ?? [];
          const firstPage = pages[0];
          const firstPageId = firstPage?.pageId;
          if (firstPageId) {
            const [regions, jobs, annotations] = await Promise.all([
              mangakaApi.getPageRegions(firstPageId), mangakaApi.getPageAiJobs(firstPageId), mangakaApi.getAllAnnotations({ targetType: 'PAGE', targetId: firstPageId }),
            ]);
            const firstJob = (jobs?.items ?? jobs ?? [])[0];
            if (firstJob?.id) await mangakaApi.getAiJob(firstJob.id);
            setProduction({ stages, pages, regions: regions?.items ?? regions ?? [], jobs: jobs?.items ?? jobs ?? [], annotations: annotations?.items ?? annotations ?? [] });
          } else setProduction({ stages, pages });
        } catch { setProduction({ stages: [], pages: [] }); }
      } else {
        throw new Error('Data is empty');
      }
    } catch (error: any) {
      console.log('Error fetching chapter detail', (error as any)?.message || "Unknown error");
      Alert.alert('Lỗi', `Không thể tải dữ liệu Chapter: ${error?.response?.data?.message || error.message}`);
      setChapter(null);
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  React.useEffect(() => {
    void fetchChapter();
  }, [fetchChapter]);

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
              <Typography variant="h3">{chapter.pagesCompleted ?? chapter.pagesReady ?? 0}</Typography>
              <Typography variant="caption" color={currentColors.success}>Trang đã xong</Typography>
            </View>
            <View style={styles.statBox}>
              <Typography variant="h3">{((chapter.pagesInProgress || 0) + (chapter.pagesNotStarted || 0)) || chapter.pagesPending || 0}</Typography>
              <Typography variant="caption" color={currentColors.warning}>Trang đang chờ</Typography>
            </View>
          </View>
        )}

        <Typography variant="h3" style={{ marginTop: 24, marginBottom: 12 }}>Quy trình làm việc</Typography>
        {production.stages?.length > 0 && <View style={[styles.productionCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
          <Typography variant="bodyBold">Production stages</Typography>
          <Typography variant="caption" color={currentColors.textSecondary}>{production.stages.map((stage: any) => stage.name || stage.code || stage.status).filter(Boolean).join(' · ')}</Typography>
          <Typography variant="caption" color={currentColors.textSecondary}>{production.pages?.length ?? 0} trang · {production.regions?.length ?? 0} vùng · {production.jobs?.length ?? 0} AI job · {production.annotations?.length ?? 0} ghi chú</Typography>
        </View>}
        
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
          onPress={() => router.push({ pathname: '/(mangaka-tabs)/deadline', params: { chapterId } } as any)}
        >
          <MessageSquare color={currentColors.textSecondary} size={24} />
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
              <MessageSquare color={currentColors.textSecondary} size={24} />
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
          <Typography variant="caption" color={currentColors.textSecondary} style={{ textAlign: 'center' }}>
            Nộp hoặc nộp lại manuscript thực hiện trên bản web.
          </Typography>
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
  productionCard: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 6, marginBottom: 12 },
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
