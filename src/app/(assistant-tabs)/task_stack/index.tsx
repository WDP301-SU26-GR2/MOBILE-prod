import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography } from '../../../components/Typography';
import { assistantReadApi } from '../../../api/assistant';
import { useThemeStore } from '../../../store/useThemeStore';
import { colors } from '../../../theme/colors';

const TABS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'IN_PROGRESS', label: 'Đang làm' },
  { id: 'SUBMITTED', label: 'Đã nộp' },
  { id: 'REVISION_REQUESTED', label: 'Cần sửa' },
  { id: 'APPROVED', label: 'Đã duyệt' },
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
      
      const res = await assistantReadApi.getAllTasks();
      setTasks(res?.items || []);
    } catch (e) {
      console.error(e);
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
      default: return currentColors.textSecondary;
    }
  };

  const filteredTasks = tasks.filter(t => activeTab === 'ALL' || t.status === activeTab);

  const renderItem = ({ item }: { item: any }) => {
    const deadlineDate = item.deadline ? new Date(item.deadline) : null;
    const daysLeft = deadlineDate ? Math.floor((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
    const deadlineColor = daysLeft != null && daysLeft < 2 ? currentColors.error : daysLeft != null && daysLeft < 5 ? currentColors.warning : currentColors.textSecondary;

    return (
      <TouchableOpacity 
        style={[styles.taskCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]} 
        onPress={() => router.push(`/(assistant-tabs)/task_stack/${item.id}`)}
      >
        <View style={styles.taskCardHeader}>
          <Typography variant="bodyBold">{item.series?.title} - Chương {item.chapter?.chapterNumber}</Typography>
          <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
            <Typography variant="caption" style={{ color: '#FFF' }}>{item.status}</Typography>
          </View>
        </View>
        <Typography variant="body" style={{ color: currentColors.textSecondary, marginBottom: 8 }}>
          Loại: {item.taskType} | Trang {item.page?.pageNumber}
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
