import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput as RNTextInput, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/Typography';
import { Button } from '../../components/Button';
import { useThemeStore } from '../../store/useThemeStore';
import { colors } from '../../theme/colors';
import { ChevronLeft, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react-native';
import { mangakaApi } from '../../api/mangaka';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ phản hồi',
  COUNTERED: 'Đã phản hồi ngược',
  AGREED: 'Đã đồng ý',
  REJECTED: 'Đã từ chối',
  WITHDRAWN: 'Đã thu hồi',
  FINALIZED: 'Đã chốt',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'warning',
  COUNTERED: 'primary',
  AGREED: 'success',
  REJECTED: 'error',
  WITHDRAWN: 'textSecondary',
  FINALIZED: 'success',
};

export default function DeadlineNegotiationScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [requestedDeadline, setRequestedDeadline] = useState('');
  const [reason, setReason] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await mangakaApi.getDeadlineRequests();
      setRequests(data?.items || []);
    } catch (e) {
      console.log('Error fetching deadline requests', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCreate = async () => {
    if (!selectedChapterId || !requestedDeadline || !reason) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin.');
      return;
    }
    try {
      setCreating(true);
      await mangakaApi.createDeadlineRequest({ chapterId: selectedChapterId, requestedDeadline, reason });
      Alert.alert('Thành công', 'Đã gửi yêu cầu thương lượng.');
      setShowCreateForm(false);
      setSelectedChapterId('');
      setRequestedDeadline('');
      setReason('');
      fetchRequests();
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể gửi yêu cầu');
    } finally {
      setCreating(false);
    }
  };

  const handleWithdraw = async (id: string) => {
    Alert.alert('Xác nhận', 'Thu hồi yêu cầu này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Thu hồi', style: 'destructive',
        onPress: async () => {
          try {
            await mangakaApi.withdrawDeadlineRequest(id);
            fetchRequests();
          } catch (e: any) {
            Alert.alert('Lỗi', e.response?.data?.message || 'Không thể thu hồi');
          }
        }
      }
    ]);
  };

  const handleAgree = async (id: string) => {
    try {
      await mangakaApi.agreeDeadlineRequest(id);
      Alert.alert('Đã đồng ý', 'Yêu cầu thương lượng đã được xác nhận.');
      fetchRequests();
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể đồng ý');
    }
  };

  const inputStyle = [styles.input, { backgroundColor: currentColors.surface, color: currentColors.text, borderColor: currentColors.border }];

  const getStatusColor = (status: string) => {
    const key = STATUS_COLORS[status] || 'textSecondary';
    return (currentColors as any)[key] || currentColors.textSecondary;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={[styles.header, { borderBottomColor: currentColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <ChevronLeft color={currentColors.text} size={28} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Typography variant="h2">Thương lượng Deadline</Typography>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: currentColors.primary }]}
          onPress={() => setShowCreateForm(!showCreateForm)}
        >
          <Typography variant="caption" color="#FFF">{showCreateForm ? 'Đóng' : '+ Mới'}</Typography>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {showCreateForm && (
          <View style={[styles.card, { backgroundColor: currentColors.surface }]}>
            <Typography variant="h3" style={{ marginBottom: 16 }}>Tạo yêu cầu mới</Typography>

            <Typography variant="caption" color={currentColors.textSecondary} style={{ marginBottom: 4 }}>ID Chapter</Typography>
            <RNTextInput
              style={inputStyle}
              placeholder="Dán ID của chapter vào đây..."
              placeholderTextColor={currentColors.textSecondary}
              value={selectedChapterId}
              onChangeText={setSelectedChapterId}
            />

            <Typography variant="caption" color={currentColors.textSecondary} style={{ marginTop: 12, marginBottom: 4 }}>Deadline mới (ISO 8601, vd: 2026-08-15T00:00:00Z)</Typography>
            <RNTextInput
              style={inputStyle}
              placeholder="2026-08-15T00:00:00Z"
              placeholderTextColor={currentColors.textSecondary}
              value={requestedDeadline}
              onChangeText={setRequestedDeadline}
            />

            <Typography variant="caption" color={currentColors.textSecondary} style={{ marginTop: 12, marginBottom: 4 }}>Lý do</Typography>
            <RNTextInput
              style={[inputStyle, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Nêu lý do cần gia hạn..."
              placeholderTextColor={currentColors.textSecondary}
              value={reason}
              onChangeText={setReason}
              multiline
            />

            <Button title="Gửi yêu cầu" onPress={handleCreate} loading={creating} style={{ marginTop: 16 }} />
          </View>
        )}

        {loading && !requests.length && (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Typography color={currentColors.textSecondary}>Đang tải...</Typography>
          </View>
        )}

        {!loading && requests.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Calendar color={currentColors.border} size={48} />
            <Typography color={currentColors.textSecondary} style={{ marginTop: 16, textAlign: 'center' }}>
              Chưa có yêu cầu thương lượng nào.{'\n'}Nhấn '+ Mới' để tạo yêu cầu.
            </Typography>
          </View>
        )}

        {requests.map(req => (
          <View key={req.id} style={[styles.card, { backgroundColor: currentColors.surface }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
              <Clock color={getStatusColor(req.status)} size={18} />
              <Typography variant="bodyBold" style={{ flex: 1 }}>
                Ch. {req.chapter?.chapterNumber || '?'} - {req.chapter?.title || req.chapterId}
              </Typography>
              <View style={[styles.badge, { backgroundColor: getStatusColor(req.status) + '22' }]}>
                <Typography variant="caption" style={{ color: getStatusColor(req.status) }}>
                  {STATUS_LABELS[req.status] || req.status}
                </Typography>
              </View>
            </View>

            <Typography variant="caption" color={currentColors.textSecondary}>
              Series: {req.series?.title || 'Không rõ'}
            </Typography>
            <Typography variant="caption" color={currentColors.textSecondary} style={{ marginTop: 4 }}>
              Deadline đề xuất: {req.requestedDeadline ? new Date(req.requestedDeadline).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Chưa rõ'}
            </Typography>
            {req.reason && (
              <Typography variant="body" style={{ marginTop: 8 }}>{req.reason}</Typography>
            )}

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              {req.status === 'PENDING' && req.requestedBy === 'MANGAKA' && (
                <Button title="Thu hồi" variant="outline" style={{ flex: 1 }} onPress={() => handleWithdraw(req.id)} />
              )}
              {req.status === 'COUNTERED' && req.requestedBy === 'EDITOR' && (
                <>
                  <Button title="Đồng ý" style={{ flex: 1 }} onPress={() => handleAgree(req.id)} />
                  <Button title="Từ chối" variant="outline" style={{ flex: 1 }} onPress={() => Alert.alert('Tính năng', 'Tính năng phản hồi ngược đang phát triển')} />
                </>
              )}
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  content: { padding: 16, gap: 16 },
  card: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
