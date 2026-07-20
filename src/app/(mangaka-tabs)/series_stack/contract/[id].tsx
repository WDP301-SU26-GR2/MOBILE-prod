import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Typography } from '../../../../components/Typography';
import { Button } from '../../../../components/Button';
import { TextInput } from '../../../../components/TextInput';
import { colors } from '../../../../theme/colors';

export default function ContractDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  React.useEffect(() => {
    fetchContract();
  }, [id]);

  const fetchContract = async () => {
    try {
      const data = await mangakaApi.getContract(id as string);
      setContract(data);
    } catch (e: any) {
      console.log('Error fetching contract', e);
      Alert.alert('Lỗi', 'Không thể tải hợp đồng.');
    } finally {
      setFetching(false);
    }
  };

  const handleSign = async () => {
    if (otp.length !== 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập đúng 6 số OTP.');
      return;
    }
    setLoading(true);
    try {
      await mangakaApi.signContract(id as string, otp);
      Alert.alert('Ký thành công', 'Hợp đồng đã được ký số hợp lệ!');
      router.back();
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể ký hợp đồng.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Typography>Đang tải hợp đồng...</Typography>
      </View>
    );
  }

  if (!contract) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Typography>Không tìm thấy hợp đồng</Typography>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView>
        <View style={styles.header}>
          <Typography variant="h2">Hợp Đồng Xuất Bản</Typography>
          <Typography variant="body" color={colors.textSecondary}>Mã HĐ: {contract.id}</Typography>
        </View>

        <View style={styles.content}>
          <View style={styles.document}>
            <Typography variant="h3" style={{ textAlign: 'center', marginBottom: 16 }}>HỢP ĐỒNG HỢP TÁC</Typography>
            <Typography variant="body" style={styles.docText}>
              Bên A (Nhà xuất bản): {contract.editor?.displayName || 'Chưa phân công'}{'\n'}
              Bên B (Tác giả): {contract.mangaka?.displayName || 'Tác giả'}{'\n\n'}
              Hai bên thỏa thuận xuất bản tác phẩm "{contract.series?.title || 'Không rõ'}" với tỷ lệ sở hữu của Bên B là {contract.mangakaOwnershipPct || 0}%.
              {'\n\n'}... (Nội dung chi tiết hợp đồng) ...
            </Typography>
          </View>

          <View style={styles.signatureBox}>
            <Typography variant="h3" style={{ marginBottom: 12 }}>Ký điện tử bằng OTP</Typography>
            <Typography variant="caption" color={colors.textSecondary} style={{ marginBottom: 16 }}>
              Bằng việc nhập OTP, bạn đồng ý với các điều khoản của hợp đồng. OTP đã được gửi vào email của bạn.
            </Typography>
            <TextInput
              label="Mã OTP"
              placeholder="Nhập 6 số"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
            />
            <Button 
              title="Ký Hợp Đồng" 
              onPress={handleSign} 
              loading={loading}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  content: { padding: 16 },
  document: { 
    padding: 24, 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#E0E0E0',
    minHeight: 300,
    marginBottom: 24
  },
  docText: { lineHeight: 24 },
  signatureBox: {
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border
  }
});
