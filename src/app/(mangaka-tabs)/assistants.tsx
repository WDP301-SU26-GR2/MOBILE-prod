import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Typography } from '../../components/Typography';
import { TextInput } from '../../components/TextInput';
import { DirectoryCard } from '../../components/DirectoryCard';
import { directoryApi } from '../../api/directory';
import { Search } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { colors } from '../../theme/colors';
import { Button } from '../../components/Button';

export default function AssistantsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [assistants, setAssistants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssistant, setSelectedAssistant] = useState<any>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ seriesId: '', role: 'BACKGROUND', hireStart: '', hireEnd: '' });
  const [sending, setSending] = useState(false);

  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const currentColors = colors[theme];
  const isMangaka = user?.role === 'MANGAKA';

  const fetchAssistants = async () => {
    try {
      setLoading(true);
      const res = await directoryApi.getAssistants({ q: searchQuery });
      if (res.success && res.data) {
        setAssistants(res.data.items || []);
      }
    } catch (error) {
      console.log('Error fetching assistants', error);
      setAssistants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssistants();
  }, [searchQuery]);

  const handleInvite = async () => {
    try {
      setSending(true);
      await directoryApi.sendCollaborationInvite({
        assistantId: selectedAssistant.userId,
        ...inviteForm,
      });
      alert('Gửi lời mời thành công!');
      setShowInviteModal(false);
    } catch (error: any) {
      alert('Gửi lời mời thất bại: ' + (error.response?.data?.message || 'Vui lòng thử lại'));
      setShowInviteModal(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={styles.header}>
        <TextInput
          placeholder="Tìm trợ lý theo tên..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={currentColors.textSecondary} />}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={currentColors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={assistants}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <DirectoryCard
              name={item.displayName || 'Unknown'}
              roles={item.specializations || []}
              reputationScore={item.reputationScore}
              ratingCount={item.ratingCount}
              isRecommended={item.isRecommended}
              availability={item.availabilityStatus}
              onInvitePress={isMangaka ? () => {
                setSelectedAssistant(item);
                setShowInviteModal(true);
              } : undefined}
            />
          )}
          ListEmptyComponent={
            <Typography align="center" color={currentColors.textSecondary}>
              Không tìm thấy trợ lý nào.
            </Typography>
          }
        />
      )}

      {showInviteModal && selectedAssistant && (
        <View style={StyleSheet.absoluteFillObject}>
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
          <View style={styles.modalCenter}>
            <View style={[styles.modalContent, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
              <Typography variant="h3" font="headline" style={{ marginBottom: 16 }}>
                Mời {selectedAssistant.displayName}
              </Typography>
              
              <TextInput
                label="ID Truyện"
                value={inviteForm.seriesId}
                onChangeText={(text) => setInviteForm(prev => ({...prev, seriesId: text}))}
                placeholder="Nhập ID Truyện của bạn"
              />
              <TextInput
                label="Vai trò"
                value={inviteForm.role}
                onChangeText={(text) => setInviteForm(prev => ({...prev, role: text}))}
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="Ngày Bắt đầu"
                    value={inviteForm.hireStart}
                    onChangeText={(text) => setInviteForm(prev => ({...prev, hireStart: text}))}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="Ngày Kết thúc"
                    value={inviteForm.hireEnd}
                    onChangeText={(text) => setInviteForm(prev => ({...prev, hireEnd: text}))}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <Button 
                  title="Hủy" 
                  variant="outlined" 
                  onPress={() => setShowInviteModal(false)} 
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button 
                  title="Gửi Lời mời" 
                  onPress={handleInvite} 
                  loading={sending} 
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingBottom: 0 },
  loader: { marginTop: 40 },
  list: { padding: 16 },
  modalOverlay: { flex: 1 },
  modalCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 16,
  }
});
