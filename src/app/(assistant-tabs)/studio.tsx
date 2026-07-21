import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Typography } from '../../components/Typography';
import { Button } from '../../components/Button';
import { mangakaApi } from '../../api/mangaka';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';

export default function StudioScreen() {
  const [activeTab, setActiveTab] = useState<'INVITES' | 'COLLABS'>('INVITES');
  const [invites, setInvites] = useState<any[]>([]);
  const [collabs, setCollabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const theme = useThemeStore((state) => state.theme);
  const currentColors = colors[theme];

  const fetchInvites = async () => {
    try {
      const res = await mangakaApi.getCollaborationInvites();
      setInvites(res?.items || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCollabs = async () => {
    try {
      const res = await mangakaApi.getStudioAssignments();
      setCollabs(res?.items || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchInvites(), fetchCollabs()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcceptInvite = async (id: string) => {
    try {
      await mangakaApi.acceptInvite(id);
      Alert.alert('Thành công', 'Đã chấp nhận lời mời!');
      fetchData();
    } catch (e) {
      console.error(e);
      Alert.alert('Lỗi', 'Không thể chấp nhận lời mời');
    }
  };

  const handleDeclineInvite = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn từ chối lời mời này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Từ chối', style: 'destructive', onPress: async () => {
        try {
          await mangakaApi.declineInvite(id);
          fetchData();
        } catch (e) {
          console.error(e);
          Alert.alert('Lỗi', 'Không thể từ chối lời mời');
        }
      }}
    ]);
  };

  const renderInviteItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
      <View style={styles.row}>
        <Image source={{ uri: item.mangaka?.avatar || 'https://via.placeholder.com/40' }} style={styles.avatar} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Typography variant="bodyBold">{item.mangaka?.displayName}</Typography>
          <Typography variant="body" style={{ color: currentColors.textSecondary }}>{item.series?.title}</Typography>
        </View>
        <Typography variant="caption" style={{ color: currentColors.primary }}>{item.status}</Typography>
      </View>
      <View style={{ marginTop: 12 }}>
        <Typography variant="caption" style={{ color: currentColors.textSecondary }}>
          Thời gian: {new Date(item.hireStart).toLocaleDateString('vi-VN')} - {new Date(item.hireEnd).toLocaleDateString('vi-VN')}
        </Typography>
        <Typography variant="caption" style={{ color: currentColors.textSecondary, marginTop: 4 }}>
          Công việc: {item.taskTypes?.join(', ') || 'N/A'}
        </Typography>
      </View>
      
      {item.status === 'PENDING' && (
        <View style={styles.actionRow}>
          <Button title="Từ chối" variant="outline" onPress={() => handleDeclineInvite(item.id)} style={{ flex: 1, marginRight: 8 }} />
          <Button title="Chấp nhận" onPress={() => handleAcceptInvite(item.id)} style={{ flex: 1 }} />
        </View>
      )}
    </View>
  );

  const renderCollabItem = ({ item }: { item: any }) => {
    const isExpired = new Date() > new Date(item.hireEnd);
    
    return (
      <View style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
        <View style={styles.row}>
          <Image source={{ uri: item.mangaka?.avatar || 'https://via.placeholder.com/40' }} style={styles.avatar} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Typography variant="bodyBold">{item.mangaka?.displayName}</Typography>
            <Typography variant="body" style={{ color: currentColors.textSecondary }}>{item.series?.title}</Typography>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Typography variant="caption" style={{ 
              color: item.status === 'ACTIVE' ? currentColors.success : item.status === 'TERMINATED' ? currentColors.error : currentColors.textSecondary 
            }}>
              {item.status}
            </Typography>
            {isExpired && <Typography variant="caption" style={{ color: currentColors.error }}>Đã hết hạn</Typography>}
          </View>
        </View>
        <View style={{ marginTop: 12 }}>
          <Typography variant="caption" style={{ color: currentColors.textSecondary }}>
            Hợp đồng: {new Date(item.hireStart).toLocaleDateString('vi-VN')} - {new Date(item.hireEnd).toLocaleDateString('vi-VN')}
          </Typography>
        </View>
      </View>
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
  actionRow: { flexDirection: 'row', marginTop: 16 }
});
