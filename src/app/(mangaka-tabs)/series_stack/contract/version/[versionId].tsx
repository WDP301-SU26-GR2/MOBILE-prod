import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Typography } from '../../../../../components/Typography';
import { Button } from '../../../../../components/Button';
import { mangakaApi } from '../../../../../api/mangaka';
import { useThemeStore } from '../../../../../store/useThemeStore';
import { colors } from '../../../../../theme/colors';
import { translateContractStatus } from '../../../../../utils/statusTranslator';

export default function ContractVersionDetail() {
  const { versionId, contractId } = useLocalSearchParams<{ versionId: string; contractId: string }>();
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const currentColors = colors[theme];
  const [version, setVersion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchVersion = useCallback(async () => {
    if (!contractId || !versionId) return;
    try {
      setLoading(true);
      const detail = await mangakaApi.getContractVersion(contractId, versionId);
      setVersion(detail);
    } catch (error: any) {
      console.log('Error fetching version', error);
      Alert.alert('Lỗi', 'Không thể tải phiên bản hợp đồng.');
    } finally {
      setLoading(false);
    }
  }, [contractId, versionId]);

  useEffect(() => {
    fetchVersion();
  }, [fetchVersion]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: currentColors.background }]}>
        <ActivityIndicator color={currentColors.primary} />
      </SafeAreaView>
    );
  }

  if (!version) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: currentColors.background }]}>
        <Typography>Không tìm thấy phiên bản.</Typography>
        <Button title="Quay lại" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </SafeAreaView>
    );
  }

  const clauses = version.clauses || version.terms || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={[styles.header, { borderBottomColor: currentColors.border }]}>
        <TouchableOpacity accessibilityLabel="Quay lại" onPress={() => router.back()}>
          <ChevronLeft color={currentColors.text} size={26} />
        </TouchableOpacity>
        <Typography variant="h2">Phiên bản {version.versionNumber}</Typography>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.detail, { backgroundColor: currentColors.surface }]}>
          <Typography variant="bodyBold">Thông tin phiên bản</Typography>
          <Typography variant="caption" color={currentColors.textSecondary} style={styles.line}>
            Trạng thái: {translateContractStatus(version.status)}
          </Typography>
          <Typography variant="caption" color={currentColors.textSecondary} style={styles.line}>
            Ngày tạo: {new Date(version.createdAt || Date.now()).toLocaleDateString('vi-VN')}
          </Typography>
          {version.notes && (
            <Typography variant="body" color={currentColors.textSecondary} style={styles.line}>
              Ghi chú: {version.notes}
            </Typography>
          )}
        </View>

        {clauses.length > 0 ? (
          <View style={[styles.detail, { backgroundColor: currentColors.surface, marginTop: 16 }]}>
            <Typography variant="bodyBold">Điều khoản</Typography>
            {clauses.map((clause: any, index: number) => (
              <View key={clause.id || index} style={[styles.clause, { borderColor: currentColors.border }]}>
                <Typography variant="bodyBold">{clause.title || `Điều khoản ${index + 1}`}</Typography>
                <Typography variant="body" color={currentColors.textSecondary} style={{ marginTop: 4 }}>
                  {clause.content || clause.description || '—'}
                </Typography>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.detail, { backgroundColor: currentColors.surface, marginTop: 16 }]}>
            <Typography color={currentColors.textSecondary}>Không có chi tiết điều khoản.</Typography>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1 },
  content: { padding: 16, paddingBottom: 40 },
  detail: { borderRadius: 12, padding: 16 },
  line: { marginTop: 8 },
  clause: { borderTopWidth: 1, marginTop: 12, paddingTop: 12 },
});
