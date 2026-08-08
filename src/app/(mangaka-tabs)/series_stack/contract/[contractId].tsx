import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { ChevronLeft, FileText, Monitor } from 'lucide-react-native';
import { Typography } from '../../../../components/Typography';
import { Button } from '../../../../components/Button';
import { mangakaApi } from '../../../../api/mangaka';
import { useThemeStore } from '../../../../store/useThemeStore';
import { colors } from '../../../../theme/colors';
import { translateContractStatus, translateContractType, translatePaymentStatus, translateConditionStatus } from '../../../../utils/statusTranslator';

/** Contract approval, OTP signing, and amendments remain web-only. */
export default function ContractDetailMangaka() {
  const { contractId } = useLocalSearchParams<{ contractId: string }>();
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const currentColors = colors[theme];
  const [contract, setContract] = useState<any>(null);
  const [related, setRelated] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const fetchContract = useCallback(async () => {
    if (!contractId) return;
    try {
      setLoading(true);
      const [contractData, status, versions, amendments, conditions, payments] = await Promise.all([
        mangakaApi.getContract(contractId), mangakaApi.getContractStatus(contractId), mangakaApi.getContractVersions(contractId), mangakaApi.getContractAmendments(contractId), mangakaApi.getPaymentConditions(contractId), mangakaApi.getContractPayments(contractId),
      ]);
      setContract(contractData); setRelated({ status, versions: versions?.items ?? versions ?? [], amendments: amendments?.items ?? amendments ?? [], conditions: conditions?.data ?? conditions?.items ?? [], payments: payments?.items ?? payments?.data ?? [] });
    }
    catch { setContract(null); }
    finally { setLoading(false); }
  }, [contractId]);

  useEffect(() => { fetchContract(); }, [fetchContract]);

  const downloadPdf = async () => {
    try {
      const pdf = await mangakaApi.getContractPdf(contractId);
      if (!pdf?.downloadUrl) throw new Error('Không tìm thấy tệp PDF.');
      await Linking.openURL(pdf.downloadUrl);
    } catch (error: any) {
      Alert.alert('Không thể tải PDF', error?.response?.data?.message || error?.message || 'Vui lòng thử lại.');
    }
  };

  if (loading) return <SafeAreaView style={[styles.center, { backgroundColor: currentColors.background }]}><ActivityIndicator color={currentColors.primary} /></SafeAreaView>;
  if (!contract) return <SafeAreaView style={[styles.center, { backgroundColor: currentColors.background }]}><Typography>Không tìm thấy hợp đồng.</Typography><Button title="Quay lại" onPress={() => router.back()} style={{ marginTop: 16 }} /></SafeAreaView>;

  const clauses = contract.clauses || contract.terms || [];
  return <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
    <View style={[styles.header, { borderBottomColor: currentColors.border }]}>
      <TouchableOpacity accessibilityLabel="Quay lại" onPress={() => router.back()}><ChevronLeft color={currentColors.text} size={26} /></TouchableOpacity>
      <Typography variant="h2">Hợp đồng</Typography>
    </View>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
        <FileText color={currentColors.primary} size={24} />
        <View style={styles.cardCopy}>
          <Typography variant="bodyBold">{translateContractType(contract.contractType) || 'Hợp đồng Series'}</Typography>
          <Typography variant="caption" color={currentColors.primary}>Trạng thái: {translateContractStatus(contract.status) || '—'}</Typography>
        </View>
      </View>
      <View style={[styles.webNotice, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
        <Monitor color={currentColors.primary} size={18} />
        <Typography variant="caption" color={currentColors.textSecondary} style={styles.cardCopy}>Duyệt điều khoản, yêu cầu sửa và ký OTP thực hiện trên bản web.</Typography>
      </View>
      {contract.boardDecision?.comment && <View style={[styles.detail, { backgroundColor: currentColors.surface }]}><Typography variant="bodyBold">Ý kiến hội đồng</Typography><Typography variant="body" color={currentColors.textSecondary} style={{ marginTop: 8 }}>{contract.boardDecision.comment}</Typography></View>}
      <View style={[styles.detail, { backgroundColor: currentColors.surface }]}>
        <Typography variant="bodyBold">Thông tin hợp đồng</Typography>
        <Typography variant="body" color={currentColors.textSecondary} style={styles.line}>Hiệu lực: {contract.effectiveDate ? new Date(contract.effectiveDate).toLocaleDateString('vi-VN') : '—'}</Typography>
        <Typography variant="body" color={currentColors.textSecondary} style={styles.line}>Hết hạn: {contract.expiryDate ? new Date(contract.expiryDate).toLocaleDateString('vi-VN') : '—'}</Typography>
      </View>
      <View style={[styles.detail, { backgroundColor: currentColors.surface }]}>
        <Typography variant="bodyBold">Theo dõi hợp đồng</Typography>
        <Typography variant="caption" color={currentColors.textSecondary}>Trạng thái: {translateContractStatus(related.status?.status || contract.status) || '—'} · {related.versions?.length ?? 0} phiên bản · {related.amendments?.length ?? 0} phụ lục</Typography>
        {related.conditions?.map((condition: any, index: number) => <Typography key={condition.id || index} variant="caption" color={currentColors.textSecondary} style={styles.line}>Điều kiện chi trả: {condition.status ? translateConditionStatus(condition.status) : (condition.name || condition.type || `#${index + 1}`)}</Typography>)}
        {related.versions?.map((version: any, index: number) => <TouchableOpacity key={version.id || index} onPress={() => version.id && router.push({ pathname: '/(mangaka-tabs)/series_stack/contract/version/[versionId]', params: { contractId, versionId: version.id } })} style={[styles.linkRow, { borderColor: currentColors.border }]}><Typography variant="caption" color={currentColors.primary}>Xem phiên bản {version.versionNumber ?? index + 1}</Typography></TouchableOpacity>)}
        {related.amendments?.map((amendment: any, index: number) => <TouchableOpacity key={amendment.id || index} onPress={() => amendment.id && void mangakaApi.getContractAmendment(contractId, amendment.id).then((detail) => Alert.alert('Phụ lục', detail?.title || detail?.status || 'Chi tiết phụ lục'))} style={[styles.linkRow, { borderColor: currentColors.border }]}><Typography variant="caption" color={currentColors.primary}>Xem phụ lục {index + 1}</Typography></TouchableOpacity>)}
        <Typography variant="caption" color={currentColors.textSecondary} style={styles.line}>{related.payments?.length ?? 0} khoản thanh toán liên quan</Typography>
      </View>
      {clauses.length > 0 && <View style={[styles.detail, { backgroundColor: currentColors.surface }]}><Typography variant="bodyBold">Điều khoản</Typography>{clauses.map((clause: any, index: number) => <View key={clause.id || index} style={[styles.clause, { borderColor: currentColors.border }]}><Typography variant="bodyBold">{clause.title || `Điều khoản ${index + 1}`}</Typography><Typography variant="body" color={currentColors.textSecondary} style={{ marginTop: 4 }}>{clause.content || clause.description || '—'}</Typography></View>)}</View>}
      <Button title="Tải hợp đồng PDF" variant="outline" onPress={downloadPdf} style={{ marginTop: 4 }} />
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1 }, content: { padding: 16, paddingBottom: 40, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 16 }, cardCopy: { flex: 1, marginLeft: 12 }, webNotice: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12 },
  detail: { borderRadius: 12, padding: 16 }, line: { marginTop: 8 }, linkRow: { borderTopWidth: 1, paddingTop: 8, marginTop: 8 }, clause: { borderTopWidth: 1, marginTop: 12, paddingTop: 12 },
});
