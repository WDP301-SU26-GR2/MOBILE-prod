import React, { useCallback, useEffect, useState } from 'react';
import { Alert, View, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/Typography';
import { mangakaApi } from '../../api/mangaka';
import { colors } from '../../theme/colors';
import { useThemeStore } from '../../store/useThemeStore';
import { ChevronLeft, DollarSign, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { translatePaymentStatus, translatePaymentType } from '../../utils/statusTranslator';

export default function EarningsScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const [loading, setLoading] = useState(true);
  
  const [earnings, setEarnings] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const user = useAuthStore((state) => state.user);

  const fetchEarnings = useCallback(async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?.userId;
      const [earningsData, paymentsData] = await Promise.all([
        mangakaApi.getMangakaEarningsDashboard(),
        userId ? mangakaApi.getUserPayments(userId) : Promise.resolve(null)
      ]);
      setEarnings(earningsData);
      setPayments(paymentsData?.items || paymentsData?.data || []);
    } catch (e) {
      console.log('Error fetching earnings', (e as any)?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchEarnings();
  }, [fetchEarnings]);

  const formatVND = (amount: number) => {
    return (amount || 0).toLocaleString('vi-VN') + ' đ';
  };

  const getStatusColor = (status: string) => {
    if (status === 'PAID') return currentColors.success;
    if (status === 'TRIGGERED' || status === 'APPROVED') return currentColors.warning;
    if (status === 'MISSED') return currentColors.error;
    return currentColors.textSecondary;
  };

  const showPayment = async (id: string) => {
    try {
      const payment = await mangakaApi.getPayment(id);
      Alert.alert('Chi tiết thanh toán', [translatePaymentType(payment?.paymentType), translatePaymentStatus(payment?.status), payment?.amount != null ? formatVND(payment.amount) : null, payment?.note].filter(Boolean).join('\n'));
    } catch { Alert.alert('Không thể tải chi tiết', 'Vui lòng thử lại.'); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={[styles.header, { borderBottomColor: currentColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <ChevronLeft color={currentColors.text} size={28} />
        </TouchableOpacity>
        <Typography variant="h2">Thu nhập & Thanh toán</Typography>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchEarnings} />}
      >
        <View style={styles.overviewGrid}>
          <View style={[styles.overviewCard, { backgroundColor: currentColors.surface, borderLeftColor: currentColors.success }]}>
            <Typography variant="caption" color={currentColors.textSecondary}>Tổng đã nhận</Typography>
            <Typography variant="h2" color={currentColors.success} style={{ marginTop: 4 }}>
              {formatVND(earnings?.totalPaid)}
            </Typography>
          </View>

          <View style={[styles.overviewCard, { backgroundColor: currentColors.surface, borderLeftColor: currentColors.warning }]}>
            <Typography variant="caption" color={currentColors.textSecondary}>Chờ chi</Typography>
            <Typography variant="h2" color={currentColors.warning} style={{ marginTop: 4 }}>
              {formatVND(earnings?.totalPending)}
            </Typography>
          </View>

          <View style={[styles.overviewCard, { backgroundColor: currentColors.surface, borderLeftColor: currentColors.error }]}>
            <Typography variant="caption" color={currentColors.textSecondary}>Trượt mốc (Missed)</Typography>
            <Typography variant="h3" color={currentColors.error} style={{ marginTop: 4 }}>
              {formatVND(earnings?.totalMissed)}
            </Typography>
          </View>
        </View>

        <View style={styles.section}>
          <Typography variant="h3" style={{ marginBottom: 16 }}>Lịch sử thanh toán</Typography>
          {payments.length === 0 && !loading && (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <DollarSign color={currentColors.border} size={48} />
              <Typography color={currentColors.textSecondary} style={{ marginTop: 16 }}>Chưa có giao dịch nào.</Typography>
            </View>
          )}

          {payments.map(payment => (
            <TouchableOpacity key={payment.id} onPress={() => void showPayment(payment.id)} style={[styles.paymentCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
              <View style={styles.iconBox}>
                {payment.status === 'PAID' ? (
                  <ArrowUpRight color={currentColors.success} size={24} />
                ) : payment.status === 'MISSED' ? (
                  <ArrowDownRight color={currentColors.error} size={24} />
                ) : (
                  <Clock color={currentColors.warning} size={24} />
                )}
              </View>
              <View style={styles.paymentInfo}>
                <Typography variant="bodyBold">{translatePaymentType(payment.paymentType)}</Typography>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                  <Typography variant="caption" style={{ color: getStatusColor(payment.status) }}>
                    {translatePaymentStatus(payment.status)}
                  </Typography>
                  <Typography variant="caption" color={currentColors.textSecondary}>
                    • {new Date(payment.createdAt).toLocaleDateString()}
                  </Typography>
                </View>
              </View>
              <Typography variant="bodyBold" style={{ color: getStatusColor(payment.status) }}>
                {payment.status === 'PAID' ? '+' : ''}{formatVND(payment.amount)}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
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
  content: { padding: 16, paddingBottom: 40 },
  overviewGrid: { gap: 12, marginBottom: 24 },
  overviewCard: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  section: { marginBottom: 24 },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: { flex: 1 }
});
