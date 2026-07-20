import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Typography } from '../../../../components/Typography';
import { Button } from '../../../../components/Button';
import { useThemeStore } from '../../../../store/useThemeStore';
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
      setChapter(data);
    } catch (error) {
      console.log('Error fetching chapter detail', error);
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
          <Typography variant="caption" color={currentColors.textSecondary}>Status: {chapter?.status || 'Unknown'}</Typography>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Only show stats if backend provides them */}
        {(chapter?.totalPages !== undefined || chapter?.pagesReady !== undefined) && (
          <View style={[styles.statsRow, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
            <View style={styles.statBox}>
              <Typography variant="h3">{chapter.totalPages || 0}</Typography>
              <Typography variant="caption" color={currentColors.textSecondary}>Total Pages</Typography>
            </View>
            <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: currentColors.border }]}>
              <Typography variant="h3">{chapter.pagesReady || 0}</Typography>
              <Typography variant="caption" color={currentColors.success}>Pages Ready</Typography>
            </View>
            <View style={styles.statBox}>
              <Typography variant="h3">{chapter.pagesPending || 0}</Typography>
              <Typography variant="caption" color={currentColors.warning}>Pages Pending</Typography>
            </View>
          </View>
        )}

        <Typography variant="h3" style={{ marginTop: 24, marginBottom: 12 }}>Workflow</Typography>
        
        <TouchableOpacity 
          style={[styles.workflowCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}
          onPress={() => router.push('/(mangaka-tabs)/series_stack/name-workspace')}
        >
          <Edit3 color={currentColors.primary} size={24} />
          <View style={{ flex: 1 }}>
            <Typography variant="bodyBold">Name Workspace</Typography>
            <Typography variant="caption" color={currentColors.textSecondary}>Upload and review draft pages</Typography>
          </View>
          <ChevronLeft color={currentColors.textSecondary} size={20} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.workflowCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
          <ImageIcon color={currentColors.tertiary} size={24} />
          <View style={{ flex: 1 }}>
            <Typography variant="bodyBold">Composite & Inking</Typography>
            <Typography variant="caption" color={currentColors.textSecondary}>Manage assistant tasks</Typography>
          </View>
          <ChevronLeft color={currentColors.textSecondary} size={20} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>

        {chapter?.editorCommentsCount > 0 && (
          <>
            <Typography variant="h3" style={{ marginTop: 24, marginBottom: 12 }}>Feedback & Review</Typography>
            <TouchableOpacity style={[styles.workflowCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
              <MessageSquare color={currentColors.secondary} size={24} />
              <View style={{ flex: 1 }}>
                <Typography variant="bodyBold">Editor Comments</Typography>
                <Typography variant="caption" color={currentColors.textSecondary}>{chapter.editorCommentsCount} new comments</Typography>
              </View>
              <View style={[styles.badge, { backgroundColor: currentColors.error }]}>
                <Typography variant="caption" color="#fff">{chapter.editorCommentsCount}</Typography>
              </View>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>

      {chapter?.status !== 'PUBLISHED' && chapter?.status !== 'COMPLETED' && (
        <View style={[styles.footer, { borderTopColor: currentColors.border }]}>
          <Button 
            title={chapter?.status === 'REVISING' ? "Nộp lại (Re-submit)" : "Nộp Chapter"} 
            variant="primary" 
            style={{ flex: 1 }} 
            onPress={async () => {
              try {
                // Sẽ ném lỗi 409 TasksNotAllApproved hoặc RevisionNotResolved nếu chưa đủ điều kiện
                await mangakaApi.submitChapter(chapterId as string); 
                Alert.alert('Thành công', 'Đã nộp Chapter.');
                fetchChapter();
              } catch (e: any) {
                Alert.alert('Không thể nộp', e.response?.data?.message || 'Chưa đủ điều kiện nộp.');
              }
            }}
          />
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
