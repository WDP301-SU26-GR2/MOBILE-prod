import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/Typography';
import { colors } from '../../theme/colors';
import { Button } from '../../components/Button';
import { mangakaApi } from '../../api/mangaka';
import { Swipeable } from 'react-native-gesture-handler';
import { Trash2, CheckCheck, X } from 'lucide-react-native';

export default function AssistantInbox() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  React.useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await mangakaApi.getNotifications();
      setNotifications(data?.items || data || []);
    } catch (error) {
      console.log('Error fetching notifications', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReadAll = async () => {
    try {
      await mangakaApi.readAllNotifications();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.log('Error reading all notifications', e);
    }
  };

  const handleDelete = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await mangakaApi.deleteNotification(id);
    } catch (e) {
      console.log('Delete failed on backend, continuing...', e);
    }
  };

  const handleAction = async (item: any) => {
    if (!item.isRead) {
      try {
        await mangakaApi.readNotification(item.id);
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
      } catch (e) {}
    }

    setSelectedNotification(item);
  };

  const handleDeepLink = (item: any) => {
    setSelectedNotification(null);
    if (item.type === 'INVITE') {
      Alert.alert(
        'Lời mời cộng tác', 
        'Bạn có muốn đồng ý lời mời này không?',
        [
          { text: 'Từ chối', style: 'cancel' },
          { text: 'Đồng ý', onPress: () => console.log('Accepted') }
        ]
      );
    } else if (item.type === 'TASK') {
      // Implement task route
    }
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
    <Swipeable
      renderRightActions={() => (
        <TouchableOpacity 
          style={styles.deleteAction} 
          onPress={() => handleDelete(item.id)}
        >
          <Trash2 color="#FFF" size={24} />
        </TouchableOpacity>
      )}
    >
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
    </Swipeable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h1">Hộp thư</Typography>
        <TouchableOpacity onPress={handleReadAll} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <CheckCheck size={18} color={colors.primary} />
          <Typography variant="bodyBold" color={colors.primary}>Đọc tất cả</Typography>
        </TouchableOpacity>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
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
              {selectedNotification && (selectedNotification.type === 'INVITE' || selectedNotification.type === 'TASK') && (
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
  deleteAction: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 8,
    marginBottom: 0
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
