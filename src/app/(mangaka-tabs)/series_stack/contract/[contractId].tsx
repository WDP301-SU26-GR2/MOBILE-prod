import React, { useEffect, useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Typography } from '../../../../components/Typography';
import { Button } from '../../../../components/Button';
import { mangakaApi } from '../../../../api/mangaka';
import { colors } from '../../../../theme/colors';
import { useThemeStore } from '../../../../store/useThemeStore';
import { ChevronLeft, FileText, CheckCircle, Clock, ShieldCheck, PenTool } from 'lucide-react-native';

export default function ContractDetailMangaka() {
  const { contractId } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<any>(null);
  
  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');

  const fetchContract = async () => {
    try {
      setLoading(true);
      const data = await mangakaApi.getContract(contractId as string);
      setContract(data);
    } catch (e) {
      console.log('Error fetching contract', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContract();
  }, [contractId]);

  const handleApprove = async () => {
    Alert.alert('Xác nhận', 'Bạn đồng ý với các điều khoản của hợp đồng này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đồng ý', onPress: async () => {
        try {
          setLoading(true);
          await mangakaApi.approveContract(contractId as string);
          Alert.alert('Thành công', 'Đã chuyển sang trạng thái chờ ký.');
          fetchContract();
        } catch (e: any) {
          Alert.alert('Lỗi', e.response?.data?.message || 'Không thể đồng ý');
          setLoading(false);
        }
      }}
    ]);
  };

  const handleSign = async () => {
    if (otp.length < 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập đủ 6 số OTP');
      return;
    }
    try {
      setLoading(true);
      setShowOtpModal(false);
      await mangakaApi.signContract(contractId as string, otp);
      Alert.alert('Thành công', 'Ký hợp đồng thành công!');
      fetchContract();
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Mã OTP không hợp lệ');
      setShowOtpModal(true);
      setLoading(false);
    }
  };

  if (loading && !contract) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={currentColors.primary} />
      </SafeAreaView>
    );
  }

  if (!contract) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Typography>Không tìm thấy hợp đồng</Typography>
        <Button title="Quay lại" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </SafeAreaView>
    );
  }

  const isDraft = contract.status === 'DRAFT' || contract.status === 'PENDING_MANGAKA';
  const isReadyToSign = contract.status === 'MANGAKA_SIGNED' || contract.status === 'WAITING_FOR_SIGNATURES'; // Exact statuses may vary based on backend

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={[styles.header, { borderBottomColor: currentColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <ChevronLeft color={currentColors.text} size={28} />
        </TouchableOpacity>
        <Typography variant="h2">Chi tiết Hợp đồng</Typography>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.statusBanner, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
          <FileText color={currentColors.primary} size={24} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Typography variant="bodyBold">Loại: {contract.contractType}</Typography>
            <Typography variant="caption" color={currentColors.primary}>Trạng thái: {contract.status}</Typography>
          </View>
        </View>

        {contract.boardDecision && (
          <View style={[styles.boardDecision, { backgroundColor: theme === 'dark' ? '#1A2A22' : '#E8F5E9' }]}>
            <ShieldCheck color={currentColors.success} size={20} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Typography variant="bodyBold" color={currentColors.success}>Căn cứ pháp lý</Typography>
              <Typography variant="caption" color={currentColors.text}>
                Duyệt serial hóa tại phiên: {contract.boardDecision.boardSession?.title || 'Board Session'} 
                {'\n'}Ngày: {new Date(contract.boardDecision.decidedAt).toLocaleDateString()}
              </Typography>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Typography variant="h3" style={{ marginBottom: 12 }}>Điều khoản chính</Typography>
          <View style={[styles.card, { backgroundColor: currentColors.surface }]}>
            <View style={styles.termRow}>
              <Typography variant="body" color={currentColors.textSecondary}>Tỷ lệ chia sẻ (Revenue Share)</Typography>
              <Typography variant="bodyBold">{contract.revenueShareRatio ? `${contract.revenueShareRatio}%` : 'N/A'}</Typography>
            </View>
            <View style={styles.termRow}>
              <Typography variant="body" color={currentColors.textSecondary}>Định giá (Valuation)</Typography>
              <Typography variant="bodyBold">{contract.valuation ? `${contract.valuation.toLocaleString()} VND` : 'N/A'}</Typography>
            </View>
            <View style={styles.termRow}>
              <Typography variant="body" color={currentColors.textSecondary}>Ngày hiệu lực</Typography>
              <Typography variant="bodyBold">{contract.effectiveDate ? new Date(contract.effectiveDate).toLocaleDateString() : 'Chưa định'}</Typography>
            </View>
          </View>
        </View>

        {/* State Tracker (Thanh tiến trình) có thể vẽ bằng UI đơn giản */}
        <View style={styles.section}>
          <Typography variant="h3" style={{ marginBottom: 12 }}>Tiến trình</Typography>
          <View style={[styles.tracker, { backgroundColor: currentColors.surface }]}>
            <View style={styles.trackerStep}>
              <CheckCircle color={currentColors.success} size={20} />
              <Typography variant="caption" style={{ marginLeft: 8 }}>Soạn thảo</Typography>
            </View>
            <View style={styles.trackerStep}>
              {contract.status !== 'DRAFT' ? <CheckCircle color={currentColors.success} size={20} /> : <Clock color={currentColors.textSecondary} size={20} />}
              <Typography variant="caption" style={{ marginLeft: 8 }}>Đồng ý</Typography>
            </View>
            <View style={styles.trackerStep}>
              {contract.status === 'FULLY_EXECUTED' ? <CheckCircle color={currentColors.success} size={20} /> : <Clock color={currentColors.textSecondary} size={20} />}
              <Typography variant="caption" style={{ marginLeft: 8 }}>Hoàn tất</Typography>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Bar */}
      <View style={[styles.actionBar, { backgroundColor: currentColors.surface, borderTopColor: currentColors.border }]}>
        {isDraft && (
          <>
            <Button title="Yêu cầu sửa" variant="outline" style={{ flex: 1, marginRight: 8 }} onPress={() => Alert.alert('Tính năng đang phát triển')} />
            <Button title="Đồng ý" style={{ flex: 1, marginLeft: 8 }} onPress={handleApprove} />
          </>
        )}
        {!isDraft && contract.status !== 'FULLY_EXECUTED' && (
          <Button 
            title="Ký Hợp đồng (OTP)" 
            icon={<PenTool color="#fff" size={18} style={{ marginRight: 8 }} />}
            style={{ flex: 1 }} 
            onPress={() => setShowOtpModal(true)} 
          />
        )}
        {contract.status === 'FULLY_EXECUTED' && (
          <Button title="Đã ký (Hoàn tất)" variant="outline" disabled style={{ flex: 1 }} />
        )}
      </View>

      {/* OTP Modal */}
      <Modal visible={showOtpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentColors.background }]}>
            <Typography variant="h2" style={{ marginBottom: 8, textAlign: 'center' }}>Xác thực chữ ký</Typography>
            <Typography variant="body" color={currentColors.textSecondary} style={{ marginBottom: 24, textAlign: 'center' }}>
              Mã OTP gồm 6 chữ số đã được gửi đến email của bạn. Vui lòng nhập để ký số hợp đồng này.
            </Typography>
            
            <TextInput
              style={[styles.otpInput, { color: currentColors.text, borderColor: currentColors.primary }]}
              placeholder="000000"
              placeholderTextColor={currentColors.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              autoFocus
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <Button title="Hủy" variant="outline" style={{ flex: 1 }} onPress={() => setShowOtpModal(false)} />
              <Button title="Xác nhận Ký" style={{ flex: 1 }} onPress={handleSign} loading={loading} />
            </View>
          </View>
        </View>
      </Modal>
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
  content: { padding: 16 },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  boardDecision: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  section: { marginBottom: 24 },
  card: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  termRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)'
  },
  tracker: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  trackerStep: { alignItems: 'center', flexDirection: 'row' },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
  },
  otpInput: {
    fontSize: 32,
    letterSpacing: 12,
    textAlign: 'center',
    fontWeight: 'bold',
    borderBottomWidth: 2,
    paddingVertical: 12,
    marginHorizontal: 32,
  }
});
