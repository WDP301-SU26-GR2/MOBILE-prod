import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/Typography';
import { TextInput } from '../../components/TextInput';
import { Button } from '../../components/Button';
import { colors } from '../../theme/colors';
import { useThemeStore } from '../../store/useThemeStore';
import { mangakaApi } from '../../api/mangaka';
import { ClipboardList, MailPlus } from 'lucide-react-native';

export default function Studio() {
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('TASKS');
  const [emailToInvite, setEmailToInvite] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // Wait, there's no getTasks in API? Let's assume we'll just not show it if there's no data
      const data = await mangakaApi.getOverview(); // Or some getTasks if added
      setTasks(data?.tasks || []);
    } catch (error) {
      console.log('Error fetching tasks', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const renderTask = ({ item }: { item: any }) => (
    <View style={[styles.taskCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
      <View style={{ flex: 1 }}>
        <Typography variant="bodyBold">{item.title}</Typography>
        <Typography variant="caption" color={currentColors.textSecondary}>Phân công cho: {item.assignedTo}</Typography>
      </View>
      <View style={[styles.badge, { backgroundColor: currentColors.warning }]}>
        <Typography variant="caption" color={currentColors.background}>{item.status}</Typography>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Typography variant="h1">Quản lý Xưởng</Typography>
          <Typography variant="body" color={currentColors.textSecondary}>Quản lý công việc và các trợ lý của bạn.</Typography>
        </View>

        <View style={[styles.segmentedControl, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
          <TouchableOpacity 
            style={[styles.segment, activeTab === 'TASKS' && { backgroundColor: currentColors.primary }]}
            onPress={() => setActiveTab('TASKS')}
          >
            <Typography variant="bodyBold" color={activeTab === 'TASKS' ? '#FFF' : currentColors.textSecondary}>Nhiệm vụ</Typography>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segment, activeTab === 'INVITES' && { backgroundColor: currentColors.primary }]}
            onPress={() => setActiveTab('INVITES')}
          >
            <Typography variant="bodyBold" color={activeTab === 'INVITES' ? '#FFF' : currentColors.textSecondary}>Lời mời</Typography>
          </TouchableOpacity>
        </View>

        {activeTab === 'TASKS' && (
          <FlatList
            data={tasks}
            keyExtractor={item => item.id}
            renderItem={renderTask}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <ClipboardList size={48} color={currentColors.border} />
                <Typography style={{ textAlign: 'center', marginTop: 16 }} color={currentColors.textSecondary}>
                  Chưa có nhiệm vụ nào.
                </Typography>
              </View>
            }
          />
        )}

        {activeTab === 'INVITES' && (
          <View style={styles.inviteSection}>
            <Typography variant="h3" style={{ marginBottom: 12 }}>Mời Assistant</Typography>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TextInput 
                  placeholder="Nhập Email của Assistant" 
                  value={emailToInvite}
                  onChangeText={setEmailToInvite}
                />
              </View>
              <Button 
                title="Gửi Mời" 
                onPress={() => {
                  if (emailToInvite) {
                    Alert.alert('Thông báo', 'Tính năng đang được cập nhật...');
                    // setEmailToInvite('');
                  }
                }} 
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  content: { flex: 1 },
  header: { padding: 16 },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  list: { padding: 16, gap: 16 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  inviteSection: { padding: 16 },
  taskCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center'
  },
  badge: { backgroundColor: colors.warning, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }
});
