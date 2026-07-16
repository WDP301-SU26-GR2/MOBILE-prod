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
  const [inviteForm, setInviteForm] = useState({ seriesId: 'mock_series_1', role: 'BACKGROUND', hireStart: '2026-08-01', hireEnd: '2026-10-01' });
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
      // MOCK DATA for layout testing
      setAssistants([
        { userId: '1', displayName: 'John Doe', specializations: ['BACKGROUND', 'SCREENTONE'], reputationScore: 4.5, ratingCount: 45, isRecommended: true, availabilityStatus: 'AVAILABLE' },
        { userId: '2', displayName: 'Jane Smith', specializations: ['INKING', 'COLORING'], reputationScore: 4.2, ratingCount: 20, isRecommended: false, availabilityStatus: 'BUSY' },
      ]);
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
      alert('Invite sent successfully!');
      setShowInviteModal(false);
    } catch (error) {
      alert('Mock Invite sent successfully!');
      setShowInviteModal(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={styles.header}>
        <TextInput
          placeholder="Search assistants by name..."
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
              No assistants found.
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
                Invite {selectedAssistant.displayName}
              </Typography>
              
              <TextInput
                label="Select Series (Mock)"
                value="One Piece"
                editable={false}
              />
              <TextInput
                label="Role"
                value={inviteForm.role}
                onChangeText={(text) => setInviteForm(prev => ({...prev, role: text}))}
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="Start Date"
                    value={inviteForm.hireStart}
                    onChangeText={(text) => setInviteForm(prev => ({...prev, hireStart: text}))}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="End Date"
                    value={inviteForm.hireEnd}
                    onChangeText={(text) => setInviteForm(prev => ({...prev, hireEnd: text}))}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <Button 
                  title="Cancel" 
                  variant="outlined" 
                  onPress={() => setShowInviteModal(false)} 
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button 
                  title="Send Invite" 
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
