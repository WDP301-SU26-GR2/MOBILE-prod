import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Monitor } from 'lucide-react-native';
import { Typography } from '../../components/Typography';
import { mangakaApi } from '../../api/mangaka';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';

export default function StudioScreen() {
  const theme = useThemeStore((state) => state.theme);
  const currentColors = colors[theme];
  const [tab, setTab] = useState<'INVITES' | 'ASSIGNMENTS'>('INVITES');
  const [invites, setInvites] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [inviteResult, assignmentResult] = await Promise.all([mangakaApi.getAllCollaborationInvites(), mangakaApi.getAllStudioAssignments()]);
      setInvites(inviteResult?.items || []);
      setAssignments(assignmentResult?.items || []);
    } catch { setInvites([]); setAssignments([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);
  const data = tab === 'INVITES' ? invites : assignments;
  const showDetail = async (item: any) => {
    try {
      const detail = tab === 'INVITES' ? await mangakaApi.getCollaborationInvite(item.id) : await mangakaApi.getStudioAssignment(item.id);
      const taskTypes = tab === 'INVITES' ? detail?.taskTypes : detail?.assignedTaskTypes;
      Alert.alert(tab === 'INVITES' ? 'Chi tiết lời mời' : 'Chi tiết cộng tác', [detail?.series?.title, detail?.status, taskTypes?.join(', ')].filter(Boolean).join('\n'));
    } catch { Alert.alert('Không thể tải chi tiết', 'Vui lòng thử lại.'); }
  };

  return <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
    <View style={styles.header}><Typography variant="h1">Studio</Typography><Typography variant="caption" color={currentColors.textSecondary}>Chỉ xem trên mobile</Typography></View>
    <View style={styles.tabs}>{(['INVITES', 'ASSIGNMENTS'] as const).map((item) => <TouchableOpacity key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && { borderBottomColor: currentColors.primary, borderBottomWidth: 2 }]}><Typography variant="bodyBold" color={tab === item ? currentColors.primary : currentColors.textSecondary}>{item === 'INVITES' ? 'Lời mời' : 'Cộng tác'}</Typography></TouchableOpacity>)}</View>
    <FlatList data={data} keyExtractor={(item) => item.id} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />} contentContainerStyle={styles.list} ListHeaderComponent={<View style={[styles.notice, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}><Monitor size={18} color={currentColors.primary} /><Typography variant="caption" color={currentColors.textSecondary} style={{ flex: 1 }}>Mời, huỷ lời mời, đổi vai trò và chấm dứt cộng tác thực hiện trên bản web.</Typography></View>} ListEmptyComponent={loading ? <ActivityIndicator color={currentColors.primary} style={{ marginTop: 32 }} /> : <Typography align="center" color={currentColors.textSecondary} style={{ marginTop: 32 }}>Không có dữ liệu.</Typography>} renderItem={({ item }) => <TouchableOpacity onPress={() => void showDetail(item)} style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}><View style={styles.row}><Typography variant="bodyBold">{item.assistant?.displayName || item.mangaka?.displayName || item.user?.displayName || 'Thành viên studio'}</Typography><Typography variant="caption" color={currentColors.primary}>{item.status || '—'}</Typography></View><Typography variant="body" color={currentColors.textSecondary} style={{ marginTop: 6 }}>{item.series?.title || item.role || item.taskTypes?.join(', ') || '—'}</Typography>{(item.hireStart || item.hireEnd) && <Typography variant="caption" color={currentColors.textSecondary} style={{ marginTop: 8 }}>Thời hạn: {item.hireStart ? new Date(item.hireStart).toLocaleDateString('vi-VN') : '—'} — {item.hireEnd ? new Date(item.hireEnd).toLocaleDateString('vi-VN') : '—'}</Typography>}</TouchableOpacity>} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({ container: { flex: 1 }, header: { padding: 16, paddingBottom: 10 }, tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }, tab: { flex: 1, alignItems: 'center', padding: 14 }, list: { padding: 16, paddingBottom: 40 }, notice: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 }, card: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 } });
