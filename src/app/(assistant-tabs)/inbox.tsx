import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/Typography';
import { colors } from '../../theme/colors';
import { Button } from '../../components/Button';
import { assistantReadApi } from '../../api/assistant';
import { X } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function AssistantInbox() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  const fetchNotifications = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await assistantReadApi.getAllNotifications();
      setNotifications(data?.items || []);
      setUnreadCount(data?.unreadCount ?? 0);
    } catch (error) {
      console.log('Error fetching notifications', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAction = (item: any) => {
    const referenceType = String(item.referenceType || item.entityType || item.type || '').toUpperCase();
    const referenceId = item.referenceId || item.entityId;
    if (referenceType.startsWith('TASK') && referenceId) {
      router.push(`/(assistant-tabs)/task_stack/${referenceId}` as any);
      return;
    }
    if ((referenceType.includes('INVITE') || referenceType.includes('ASSIGNMENT') || referenceType.includes('COLLABORATION')) && referenceId) {
      router.push('/(assistant-tabs)/studio');
      return;
    }
    setSelectedNotification(item);
  };

  useEffect(() => {
    void fetchNotifications();
    const timer = setInterval(() => void fetchNotifications(false), 20000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

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
        style={[styles.card, !item.isRead && styles.unreadCard]}
        onPress={() => handleAction(item)}
      >
        <View style={{ flex: 1 }}>
          <Typography variant="bodyBold" style={{ marginBottom: 4 }}>{getNotificationTitle(item.type)}</Typography>
          <Typography variant="body" color={colors.textSecondary}>{item.content || item.message}</Typography>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h1">Hộp thư</Typography>
        <Typography variant="caption" color={colors.textSecondary}>Chỉ xem trên mobile</Typography>
        <Typography variant="caption" color={unreadCount > 0 ? colors.primary : colors.textSecondary}>{unreadCount} chưa đọc · tự cập nhật</Typography>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} /> :
          <Typography align="center" color={colors.textSecondary}>
            Không có thông báo nào.
          </Typography>
        }
      />

      <Modal
        visible={!!selectedNotification}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedNotification(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Typography variant="h2">Chi tiết thông báo</Typography>
              <TouchableOpacity onPress={() => setSelectedNotification(null)}>
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Typography variant="h3" style={{ marginBottom: 8 }}>
                {selectedNotification && getNotificationTitle(selectedNotification.type)}
              </Typography>
              <Typography variant="body" color={colors.textSecondary}>
                {selectedNotification?.content || selectedNotification?.message}
              </Typography>
              {selectedNotification?.createdAt && (
                <Typography variant="caption" color={colors.textSecondary} style={{ marginTop: 16 }}>
                  Thời gian: {new Date(selectedNotification.createdAt).toLocaleString()}
                </Typography>
              )}
            </View>
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <Typography variant="caption" color={colors.textSecondary} style={{ marginBottom: 12 }}>
                Thông báo được giữ ở chế độ chỉ xem trên mobile.
              </Typography>
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
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center'
  },
  unreadCard: {
    backgroundColor: '#F5F9FF',
    borderColor: colors.primary
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
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
