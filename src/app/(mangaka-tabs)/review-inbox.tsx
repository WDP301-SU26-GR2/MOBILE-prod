import React, { useEffect, useState } from 'react';
import { Alert, View, StyleSheet, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/Typography';
import { mangakaApi } from '../../api/mangaka';
import { colors } from '../../theme/colors';
import { ChevronLeft, CheckCircle, FileEdit, HelpCircle } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';

export default function ReviewInbox() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const [loading, setLoading] = useState(true);
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);

  const fetchInbox = async () => {
    try {
      setLoading(true);
      const [tasksData, revisionsData, seriesData] = await Promise.all([
        mangakaApi.getAllTasks({ status: 'SUBMITTED' }),
        mangakaApi.getAllRevisionRequests({ isResolved: 'false' }),
        mangakaApi.getAllMySeries()
      ]);
      
      setTasks(tasksData?.items || []);
      setRevisions(revisionsData?.items || []);
      setFranchises(seriesData?.items?.filter((s: any) => s.franchiseConsentStatus === 'PENDING') || []);
    } catch (e) {
      console.log('Error fetching review inbox:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const renderItem = ({ item, type }: { item: any; type: 'task' | 'revision' | 'franchise' }) => {
    let title = '';
    let description = '';
    let icon = <HelpCircle color={currentColors.primary} size={24} />;
    let onPress = () => {};

    if (type === 'task') {
      title = `Công việc: ${item.taskType}`;
      description = `Chapter ${item.chapter?.chapterNumber || '?'}`;
      icon = <CheckCircle color={currentColors.success} size={24} />;
      onPress = () => router.push({ pathname: '/(mangaka-tabs)/series_stack/review/[taskId]', params: { taskId: item.id } });
    } else if (type === 'revision') {
      title = `Yêu cầu sửa: ${item.targetType}`;
      description = `Vòng ${item.round}: ${item.reason}`;
      icon = <FileEdit color={currentColors.warning} size={24} />;
      onPress = () => Alert.alert(
        title,
        [
          item.series?.title,
          description,
          item.requester?.displayName ? `Người yêu cầu: ${item.requester.displayName}` : null,
          item.recipient?.displayName ? `Người sửa: ${item.recipient.displayName}` : null,
          item.createdAt ? `Tạo lúc: ${new Date(item.createdAt).toLocaleString('vi-VN')}` : null,
        ].filter(Boolean).join('\n'),
      );
    } else if (type === 'franchise') {
      title = `Đồng ý bản quyền: ${item.title}`;
      description = `Cần xác nhận nhượng quyền cho phần tiếp theo (thực hiện trên web)`;
      icon = <HelpCircle color={currentColors.primary} size={24} />;
      onPress = () => Alert.alert(
        'Thao tác trên web',
        'Mobile chỉ hiển thị trạng thái. Việc xác nhận nhượng quyền được thực hiện trên bản web.',
      );
    }

    return (
      <TouchableOpacity style={[styles.card, { backgroundColor: currentColors.surface }]} onPress={onPress}>
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.cardContent}>
          <Typography variant="bodyBold" numberOfLines={1}>{title}</Typography>
          <Typography variant="caption" color={currentColors.textSecondary} numberOfLines={2}>
            {description}
          </Typography>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={[styles.header, { borderBottomColor: currentColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <ChevronLeft color={currentColors.text} size={28} />
        </TouchableOpacity>
        <Typography variant="h2">Hộp việc cần duyệt</Typography>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchInbox} tintColor={currentColors.primary} />}
      >
        {tasks.length === 0 && revisions.length === 0 && franchises.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <Typography color={currentColors.textSecondary}>Bạn không có việc nào cần duyệt.</Typography>
          </View>
        )}

        {franchises.length > 0 && (
          <View style={styles.section}>
            <Typography variant="h3" style={styles.sectionTitle}>Đồng ý bản quyền ({franchises.length})</Typography>
            {franchises.map(item => <React.Fragment key={`f-${item.id}`}>{renderItem({ item, type: 'franchise' })}</React.Fragment>)}
          </View>
        )}

        {tasks.length > 0 && (
          <View style={styles.section}>
            <Typography variant="h3" style={styles.sectionTitle}>Công việc hoàn thành ({tasks.length})</Typography>
            {tasks.map(item => <React.Fragment key={`t-${item.id}`}>{renderItem({ item, type: 'task' })}</React.Fragment>)}
          </View>
        )}

        {revisions.length > 0 && (
          <View style={styles.section}>
            <Typography variant="h3" style={styles.sectionTitle}>Yêu cầu sửa ({revisions.length})</Typography>
            {revisions.map(item => <React.Fragment key={`r-${item.id}`}>{renderItem({ item, type: 'revision' })}</React.Fragment>)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  scrollContent: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: { marginBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  iconContainer: { marginRight: 12 },
  cardContent: { flex: 1 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
});
