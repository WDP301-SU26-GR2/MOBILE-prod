import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography } from '../../../components/Typography';
import { assistantReadApi } from '../../../api/assistant';
import { useThemeStore } from '../../../store/useThemeStore';
import { colors } from '../../../theme/colors';
import { translateTaskStatus, translateSpecialization } from '../../../utils/statusTranslator';

const TABS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'IN_PROGRESS', label: 'Đang làm' },
  { id: 'SUBMITTED', label: 'Đã nộp' },
  { id: 'REVISION_REQUESTED', label: 'Cần sửa' },
  { id: 'APPROVED', label: 'Đã duyệt' },
  { id: 'CANCELLED', label: 'Đã huỷ' },
];

export default function TaskListScreen() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const currentColors = colors[theme];

  const fetchTasks = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const assignments = await assistantReadApi.getAllStudioAssignments({ status: 'ACTIVE' }).catch(() => ({ items: [] }));
      const allTasksMap = new Map();
      
      await Promise.all((assignments?.items || []).map(async (assignment: any) => {
        if (!assignment.series?.id) return;
        try {
           const res = await assistantReadApi.getAllTasks({ seriesId: assignment.series.id });
           (res?.items || []).forEach((task: any) => {
               if (!allTasksMap.has(task.id)) {
                  allTasksMap.set(task.id, {
                     ...task,
                     injectedSeriesTitle: assignment.series.title
                  });
               }
           });
        } catch {}
      }));
      
      const res = await assistantReadApi.getAllTasks();
      (res?.items || []).forEach((task: any) => {
         if (!allTasksMap.has(task.id)) {
             allTasksMap.set(task.id, task);
         }
      });
      
      const mergedTasks = Array.from(allTasksMap.values());

      const itemsWithDetail = await Promise.all(mergedTasks.map(async (item: any) => {
        try {
          const detail = await assistantReadApi.getTask(item.id);
          return { ...item, ...detail };
        } catch { return item; }
      }));
      
      itemsWithDetail.sort((a, b) => {
        if (a.deadline && b.deadline) {
          const diff = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          if (diff !== 0) return diff;
        } else if (a.deadline && !b.deadline) {
          return -1;
        } else if (!a.deadline && b.deadline) {
          return 1;
        }
        
        const priorityA = typeof a.priority === 'number' ? a.priority : 999;
        const priorityB = typeof b.priority === 'number' ? b.priority : 999;
        if (priorityA !== priorityB) {
           return priorityA - priorityB;
        }

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setTasks(itemsWithDetail);
    } catch (e) {
      console.error((e as any)?.message || "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return currentColors.primary;
      case 'SUBMITTED': return currentColors.warning;
      case 'REVISION_REQUESTED': return currentColors.error;
      case 'APPROVED': return currentColors.success;
      case 'CANCELLED': return currentColors.textSecondary;
      default: return currentColors.textSecondary;
    }
  };

  const filteredTasks = tasks.filter(t => activeTab === 'ALL' || t.status === activeTab);

  const renderItem = ({ item }: { item: any }) => {
    const deadlineDate = item.deadline ? new Date(item.deadline) : null;
    const daysLeft = deadlineDate ? Math.floor((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
    const deadlineColor = daysLeft != null && daysLeft < 2 ? currentColors.error : daysLeft != null && daysLeft < 5 ? currentColors.warning : currentColors.textSecondary;

    const seriesTitle = item.injectedSeriesTitle || item.groupTitle || item.seriesTitle || item.series?.title || item.page?.chapter?.series?.title || 'Truyện N/A';
    
    // Only show chapter if it exists, otherwise hide it or show groupTitle
    const extractedChapter = item.chapterNumber || item.chapter?.chapterNumber || item.chapter?.number || item.page?.chapter?.chapterNumber || item.page?.chapter?.number;
    
    // If no chapter number but has group title (which is usually the chapter/group name), use it.
    const chapterDisplay = extractedChapter ? `Chương ${extractedChapter}` : (item.groupTitle || `Trang ${item.page?.pageNumber ?? '?'}`);

    const statusTranslated = translateTaskStatus(item.status);
    const taskTypeTranslated = translateSpecialization(item.taskType);

    return (
      <TouchableOpacity 
        style={[styles.taskCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]} 
        onPress={() => {
          if (item.status === 'CANCELLED' && item.statusReason) {
            Alert.alert('Lý do huỷ', item.statusReason);
          }
          router.push(`/(assistant-tabs)/task_stack/${item.id}`);
        }}
      >
        <View style={styles.taskCardHeader}>
          <Typography variant="bodyBold" numberOfLines={1} style={{ flex: 1, marginRight: 8 }}>
            {seriesTitle}{extractedChapter || item.groupTitle ? ` - ${chapterDisplay}` : ''}
          </Typography>
          <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
            <Typography variant="caption" style={{ color: '#FFF' }}>
              {statusTranslated}{item.status === 'CANCELLED' && item.statusReason ? ' ℹ️' : ''}
            </Typography>
          </View>
        </View>
        <Typography variant="body" style={{ color: currentColors.textSecondary, marginBottom: 8 }}>
          Loại: {taskTypeTranslated} | Trang {item.page?.pageNumber ?? '?'}
        </Typography>
        <Typography variant="caption" style={{ color: deadlineColor }}>
          Hạn chót: {deadlineDate ? deadlineDate.toLocaleDateString('vi-VN') : 'Chưa đặt'}
        </Typography>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity onPress={() => router.push('/(assistant-tabs)/task_stack/revisions' as any)} style={[styles.revisionButton, { borderColor: currentColors.border }]}>
          <Typography variant="caption" color={currentColors.primary}>Yêu cầu sửa</Typography>
        </TouchableOpacity>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map(tab => (
            <TouchableOpacity 
              key={tab.id} 
              onPress={() => setActiveTab(tab.id)}
              style={[
                styles.tabPill, 
                { 
                  backgroundColor: activeTab === tab.id ? currentColors.primary : currentColors.surface,
                  borderColor: currentColors.border 
                }
              ]}
            >
              <Typography variant="body" style={{ color: activeTab === tab.id ? '#FFF' : currentColors.text }}>
                {tab.label}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={currentColors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchTasks(true)} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Typography variant="body" style={{ color: currentColors.textSecondary }}>Không có công việc nào</Typography>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabsContainer: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  revisionButton: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7 },
  tabPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  listContent: { padding: 16, paddingBottom: 80 },
  taskCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  taskCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }
});
