import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Typography } from '../../components/Typography';
import { assistantReadApi } from '../../api/assistant';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';
import { translateCollaboratorStatus, translateSpecialization } from '../../utils/statusTranslator';

export default function StudioScreen() {
  const [activeTab, setActiveTab] = useState<'INVITES' | 'COLLABS'>('INVITES');
  const [invites, setInvites] = useState<any[]>([]);
  const [collabs, setCollabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const theme = useThemeStore((state) => state.theme);
  const currentColors = colors[theme];

  const fetchInvites = useCallback(async () => {
    try {
      const res = await assistantReadApi.getAllCollaborationInvites();
      const itemsWithDetail = await Promise.all((res?.items || []).map(async (item: any) => {
        try {
          const detail = await assistantReadApi.getCollaborationInvite(item.id);
          return { ...item, taskTypes: detail?.taskTypes || detail?.assignedTaskTypes || item.taskTypes || item.assignedTaskTypes };
        } catch { return item; }
      }));
      setInvites(itemsWithDetail);
    } catch (e) {
      console.error((e as any)?.message || "Unknown error");
    }
  }, []);

  const fetchCollabs = useCallback(async () => {
    try {
      const res = await assistantReadApi.getAllStudioAssignments();
      const itemsWithDetail = await Promise.all((res?.items || []).map(async (item: any) => {
        try {
          const detail = await assistantReadApi.getStudioAssignment(item.id);
          return { ...item, assignedTaskTypes: detail?.assignedTaskTypes || detail?.taskTypes || item.assignedTaskTypes || item.taskTypes };
        } catch { return item; }
      }));
      setCollabs(itemsWithDetail);
    } catch (e) {
      console.error((e as any)?.message || "Unknown error");
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchInvites(), fetchCollabs()]);
    setLoading(false);
  }, [fetchInvites, fetchCollabs]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const showInviteDetail = async (item: any) => {
    try {
      const detail = await assistantReadApi.getCollaborationInvite(item.id);
      const title = detail?.series?.title || item.series?.title || item.series?.titleVn;
      const tasks = (detail?.taskTypes || item.taskTypes)?.map(translateSpecialization).join(', ') || (detail?.assignedTaskTypes || item.assignedTaskTypes)?.map(translateSpecialization).join(', ');
      const note = detail?.note || detail?.message;
      
      Alert.alert('Chi tiết lời mời', [
        title ? `Truyện: ${title}` : null,
        tasks ? `Công việc: ${tasks}` : null,
        note ? `Ghi chú: ${note}` : null
      ].filter(Boolean).join('\n'));
    } catch { Alert.alert('Không thể tải chi tiết', 'Vui lòng thử lại.'); }
  };

  const showAssignmentDetail = async (item: any) => {
    try {
      const detail = await assistantReadApi.getStudioAssignment(item.id);
      const title = detail?.series?.title || item.series?.title || item.series?.titleVn;
      const status = translateCollaboratorStatus(detail?.status || item.status);
      const tasks = (detail?.assignedTaskTypes || item.assignedTaskTypes || detail?.taskTypes || item.taskTypes)?.map(translateSpecialization).join(', ');
      
      Alert.alert('Chi tiết cộng tác', [
        title ? `Truyện: ${title}` : null,
        status ? `Trạng thái: ${status}` : null,
        tasks ? `Công việc: ${tasks}` : null
      ].filter(Boolean).join('\n'));
    } catch { Alert.alert('Không thể tải chi tiết', 'Vui lòng thử lại.'); }
  };

  const renderInviteItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => void showInviteDetail(item)} style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
      <View style={styles.row}>
        <Image source={{ uri: item.mangaka?.avatar || item.mangaka?.avatarUrl || item.user?.avatar || item.user?.avatarUrl || 'https://via.placeholder.com/40' }} style={styles.avatar} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Typography variant="bodyBold">{item.mangaka?.displayName || item.user?.displayName || 'Thành viên'}</Typography>
          <Typography variant="body" style={{ color: currentColors.textSecondary }}>{item.series?.title || item.series?.titleVn}</Typography>
        </View>
        <Typography variant="caption" style={{ color: currentColors.primary }}>{translateCollaboratorStatus(item.status)}</Typography>
      </View>
      <View style={{ marginTop: 12 }}>
        <Typography variant="caption" style={{ color: currentColors.textSecondary }}>
          Thời gian: {item.hireStart ? new Date(item.hireStart).toLocaleDateString('vi-VN') : '—'} - {item.hireEnd ? new Date(item.hireEnd).toLocaleDateString('vi-VN') : '—'}
        </Typography>
        <Typography variant="caption" style={{ color: currentColors.textSecondary, marginTop: 4 }}>
          Công việc: {item.taskTypes?.map(translateSpecialization).join(', ') || item.assignedTaskTypes?.map(translateSpecialization).join(', ') || 'N/A'}
        </Typography>
      </View>
      
      {item.status === 'PENDING' && (
        <View style={[styles.readOnlyNotice, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}>
          <Typography variant="caption" style={{ color: currentColors.textSecondary }}>
            Lời mời chỉ hiển thị trên mobile. Hãy dùng bản web để phản hồi.
          </Typography>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCollabItem = ({ item }: { item: any }) => {
    const isExpired = new Date() > new Date(item.hireEnd);
    
    return (
      <TouchableOpacity onPress={() => void showAssignmentDetail(item)} style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
        <View style={styles.row}>
          <Image source={{ uri: item.mangaka?.avatar || item.mangaka?.avatarUrl || item.user?.avatar || item.user?.avatarUrl || 'https://via.placeholder.com/40' }} style={styles.avatar} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Typography variant="bodyBold">{item.mangaka?.displayName || item.user?.displayName || 'Thành viên'}</Typography>
            <Typography variant="body" style={{ color: currentColors.textSecondary }}>{item.series?.title || item.series?.titleVn}</Typography>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Typography variant="caption" style={{ 
              color: item.status === 'ACTIVE' ? currentColors.success : item.status === 'TERMINATED' ? currentColors.error : currentColors.textSecondary 
            }}>
              {translateCollaboratorStatus(item.status)}
            </Typography>
            {isExpired && <Typography variant="caption" style={{ color: currentColors.error }}>Đã hết hạn</Typography>}
          </View>
        </View>
        <View style={{ marginTop: 12 }}>
          <Typography variant="caption" style={{ color: currentColors.textSecondary }}>
            Hợp đồng: {item.hireStart ? new Date(item.hireStart).toLocaleDateString('vi-VN') : '—'} - {item.hireEnd ? new Date(item.hireEnd).toLocaleDateString('vi-VN') : '—'}
          </Typography>
          <Typography variant="caption" style={{ color: currentColors.textSecondary, marginTop: 4 }}>
            Công việc: {item.taskTypes?.map(translateSpecialization).join(', ') || item.assignedTaskTypes?.map(translateSpecialization).join(', ') || 'N/A'}
          </Typography>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'INVITES' && { borderBottomColor: currentColors.primary, borderBottomWidth: 2 }]} 
          onPress={() => setActiveTab('INVITES')}
        >
          <Typography variant="bodyBold" style={{ color: activeTab === 'INVITES' ? currentColors.primary : currentColors.textSecondary }}>Lời mời</Typography>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'COLLABS' && { borderBottomColor: currentColors.primary, borderBottomWidth: 2 }]} 
          onPress={() => setActiveTab('COLLABS')}
        >
          <Typography variant="bodyBold" style={{ color: activeTab === 'COLLABS' ? currentColors.primary : currentColors.textSecondary }}>Cộng tác</Typography>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={currentColors.primary} style={{ marginTop: 40 }} />
      ) : activeTab === 'INVITES' ? (
        <FlatList
          data={invites}
          keyExtractor={item => item.id.toString()}
          renderItem={renderInviteItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Typography variant="body" style={{ textAlign: 'center', marginTop: 40, color: currentColors.textSecondary }}>Chưa có lời mời nào</Typography>}
        />
      ) : (
        <FlatList
          data={collabs}
          keyExtractor={item => item.id.toString()}
          renderItem={renderCollabItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Typography variant="body" style={{ textAlign: 'center', marginTop: 40, color: currentColors.textSecondary }}>Chưa có cộng tác nào</Typography>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 80 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee' },
  readOnlyNotice: { marginTop: 16, padding: 10, borderWidth: 1, borderRadius: 8 }
});
