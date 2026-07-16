import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Typography } from '../../components/Typography';
import { Button } from '../../components/Button';
import { directoryApi } from '../../api/directory';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { colors } from '../../theme/colors';
import { User, Calendar } from 'lucide-react-native';

export default function InboxScreen() {
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const currentColors = colors[theme];
  const isMangaka = user?.role === 'MANGAKA';

  const fetchInvites = async () => {
    try {
      setLoading(true);
      const res = await directoryApi.getCollaborationInvites();
      if (res.success && res.data) {
        setInvites(res.data.items || []);
      }
    } catch (error) {
      console.log('Error fetching invites', error);
      // MOCK DATA for layout testing
      setInvites([
        { 
          id: 'inv_1', 
          seriesName: 'One Piece', 
          role: 'BACKGROUND', 
          hireStart: '2026-08-01', 
          hireEnd: '2026-12-31', 
          status: 'PENDING',
          senderName: isMangaka ? 'You' : 'Oda Eiichiro',
          receiverName: isMangaka ? 'John Doe' : 'You'
        },
        { 
          id: 'inv_2', 
          seriesName: 'Naruto Shippuden', 
          role: 'INKING', 
          hireStart: '2026-09-01', 
          hireEnd: '2026-10-01', 
          status: 'ACCEPTED',
          senderName: isMangaka ? 'You' : 'Kishimoto Masashi',
          receiverName: isMangaka ? 'Jane Smith' : 'You'
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleAction = async (id: string, action: 'accept' | 'decline' | 'cancel') => {
    try {
      if (action === 'accept') {
        await directoryApi.acceptInvite(id);
        Alert.alert('Success', 'Invite accepted!');
      } else if (action === 'decline') {
        await directoryApi.declineInvite(id);
        Alert.alert('Success', 'Invite declined!');
      } else if (action === 'cancel') {
        await directoryApi.cancelInvite(id);
        Alert.alert('Success', 'Invite cancelled!');
      }
      fetchInvites();
    } catch (error) {
      // Mock flow
      Alert.alert('Success (Mock)', `Invite ${action}ed!`);
      setInvites(prev => prev.map(inv => inv.id === id ? { ...inv, status: action === 'accept' ? 'ACCEPTED' : (action === 'decline' ? 'REJECTED' : 'CANCELLED') } : inv));
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isPending = item.status === 'PENDING';

    return (
      <View style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
        <View style={styles.cardHeader}>
          <Typography variant="bodyBold">{item.seriesName}</Typography>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'PENDING' ? '#FEF0C7' : (item.status === 'ACCEPTED' ? '#D1FADF' : '#FEE4E2') }]}>
            <Typography variant="label" font="label" color={item.status === 'PENDING' ? '#B54708' : (item.status === 'ACCEPTED' ? '#027A48' : '#B42318')} style={{ fontSize: 10 }}>
              {item.status}
            </Typography>
          </View>
        </View>

        <View style={styles.infoRow}>
          <User size={16} color={currentColors.textSecondary} />
          <Typography variant="bodyMedium" color={currentColors.textSecondary} style={styles.infoText}>
            {isMangaka ? `Sent to: ${item.receiverName}` : `From: ${item.senderName}`}
          </Typography>
        </View>

        <View style={styles.infoRow}>
          <Calendar size={16} color={currentColors.textSecondary} />
          <Typography variant="bodyMedium" color={currentColors.textSecondary} style={styles.infoText}>
            {item.hireStart} to {item.hireEnd}
          </Typography>
        </View>

        <Typography variant="label" font="label" color={currentColors.primary} style={styles.roleText}>
          Role: {item.role}
        </Typography>

        {isPending && (
          <View style={styles.actionRow}>
            {isMangaka ? (
              <Button 
                title="Cancel Invite" 
                variant="outlined" 
                onPress={() => handleAction(item.id, 'cancel')}
                style={styles.actionButton}
              />
            ) : (
              <>
                <Button 
                  title="Decline" 
                  variant="outlined" 
                  onPress={() => handleAction(item.id, 'decline')}
                  style={[styles.actionButton, { marginRight: 12 }]}
                />
                <Button 
                  title="Accept" 
                  onPress={() => handleAction(item.id, 'accept')}
                  style={styles.actionButton}
                />
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      {loading ? (
        <ActivityIndicator size="large" color={currentColors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={invites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          ListEmptyComponent={
            <Typography align="center" color={currentColors.textSecondary}>
              No invites found.
            </Typography>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { marginTop: 40 },
  list: { padding: 16 },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
  },
  roleText: {
    marginTop: 4,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#EAECF0',
    paddingTop: 16,
  },
  actionButton: {
    flex: 1,
  }
});
