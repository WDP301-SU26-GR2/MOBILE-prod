import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/Typography';
import { colors } from '../../theme/colors';
import { useThemeStore } from '../../store/useThemeStore';
import { mangakaApi } from '../../api/mangaka';
import { X } from 'lucide-react-native';
import { Button } from '../../components/Button';

export default function MangakaInbox() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await mangakaApi.getAllNotifications();
      setNotifications(data?.items || []);
      setUnreadCount(data?.unreadCount ?? 0);
    } catch (error) {
      console.log('Error fetching notifications', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    const timer = setInterval(() => void fetchNotifications(false), 20000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  const handleAction = (item: any) => setSelectedNotification(item);

  const handleDeepLink = (item: any) => {
    setSelectedNotification(null);
    const referenceType = String(item.referenceType || item.type || '').toUpperCase();
    if (referenceType.startsWith('CONTRACT')) {
      router.push(`/(mangaka-tabs)/series_stack/contract/${item.referenceId}`);
    } else if (referenceType.startsWith('TASK') || referenceType.startsWith('REVIEW')) {
      router.push(`/(mangaka-tabs)/series_stack/review/${item.referenceId}`);
    } else if (referenceType.startsWith('CHAPTER') || referenceType.startsWith('MANUSCRIPT')) {
      router.push(`/(mangaka-tabs)/series_stack/chapter/${item.referenceId}`);
    } else if (referenceType.startsWith('NAME')) {
      router.push(`/(mangaka-tabs)/series_stack/${item.referenceId}`);
    } else if (referenceType.startsWith('SERIES') || referenceType.startsWith('PROPOSAL')) {
      router.push(`/(mangaka-tabs)/series_stack/${item.referenceId}`);
    } else if (referenceType.startsWith('SURVEY') || referenceType.startsWith('RANKING')) {
      router.push('/(mangaka-tabs)/ranking');
    } else if (referenceType.includes('INVITE') || referenceType.includes('ASSIGNMENT') || referenceType.includes('COLLABORATION')) {
      router.push('/(mangaka-tabs)/studio');
    }
  };

  const canDeepLink = (item: any) => {
    if (!item?.referenceId) return false;
    const type = String(item.referenceType || item.type || '').toUpperCase();
    return ['CONTRACT', 'TASK', 'REVIEW', 'CHAPTER', 'MANUSCRIPT', 'NAME', 'SERIES', 'PROPOSAL', 'SURVEY', 'RANKING', 'INVITE', 'ASSIGNMENT', 'COLLABORATION'].some((prefix) => type.includes(prefix));
  };

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'CONTRACT': return 'Hợp đồng';
      case 'REVIEW': return 'Duyệt bài';
      case 'TASK': return 'Nhiệm vụ';
      case 'DEADLINE': return 'Nhắc nhở hạn chót';
      case 'SURVEY': return 'Khảo sát';
      case 'BOARD': return 'Thông báo chung';
      case 'SYSTEM': return 'Hệ thống';
      case 'INVITE': return 'Lời mời cộng tác';
      default: return 'Thông báo';
    }
  };

  const renderItem = ({ item }: { item: any }) => (
      <TouchableOpacity 
        style={[
          styles.card, 
          { backgroundColor: currentColors.surface, borderColor: currentColors.border },
          !item.isRead && { backgroundColor: theme === 'dark' ? '#1A2A3A' : '#F5F9FF', borderColor: currentColors.primary }
        ]}
        onPress={() => handleAction(item)}
      >
        <View style={{ flex: 1 }}>
          <Typography variant="bodyBold" style={{ marginBottom: 4 }}>{getNotificationTitle(item.type)}</Typography>
          <Typography variant="body" color={currentColors.textSecondary}>{item.content || item.message}</Typography>
        </View>
        {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: currentColors.primary }]} />}
      </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Typography variant="h1">Thông báo</Typography>
          <Typography variant="caption" color={unreadCount > 0 ? currentColors.primary : currentColors.textSecondary}>{unreadCount} chưa đọc · tự cập nhật</Typography>
        </View>
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={loading ? <ActivityIndicator color={currentColors.primary} style={{ marginTop: 32 }} /> :
            <Typography style={{ textAlign: 'center', marginTop: 24 }} color={currentColors.textSecondary}>
              Không có thông báo nào.
            </Typography>
          }
        />
      </View>

      <Modal
        visible={!!selectedNotification}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedNotification(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentColors.background }]}>
            <View style={styles.modalHeader}>
              <Typography variant="h2">Chi tiết thông báo</Typography>
              <TouchableOpacity onPress={() => setSelectedNotification(null)}>
                <X color={currentColors.text} size={24} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Typography variant="h3" style={{ marginBottom: 8 }}>
                {selectedNotification && getNotificationTitle(selectedNotification.type)}
              </Typography>
              <Typography variant="body" color={currentColors.textSecondary}>
                {selectedNotification?.content || selectedNotification?.message}
              </Typography>
              {selectedNotification?.createdAt && (
                <Typography variant="caption" color={currentColors.textSecondary} style={{ marginTop: 16 }}>
                  Thời gian: {new Date(selectedNotification.createdAt).toLocaleString()}
                </Typography>
              )}
            </View>
            <View style={[styles.modalFooter, { borderTopColor: currentColors.border }]}>
              {selectedNotification && canDeepLink(selectedNotification) && (
                <Button 
                  title="Đi tới chi tiết" 
                  onPress={() => handleDeepLink(selectedNotification)} 
                  style={{ marginBottom: 12 }}
                />
              )}
              <Button 
                title="Đóng" 
                variant="outline" 
                onPress={() => setSelectedNotification(null)} 
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  content: { flex: 1 },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center'
  },
  deleteAction: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 8,
    marginBottom: 0
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 12
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  modalBody: {
    padding: 20
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1
  }
});
