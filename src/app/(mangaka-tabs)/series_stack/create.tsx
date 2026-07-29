import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Monitor } from 'lucide-react-native';
import { Typography } from '../../../components/Typography';
import { useThemeStore } from '../../../store/useThemeStore';
import { colors } from '../../../theme/colors';

/** Proposal creation is intentionally web-only for the internal mobile companion. */
export default function CreateProposal() {
  const router = useRouter();
  const theme = useThemeStore();
  const currentColors = colors[theme.theme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={[styles.header, { borderBottomColor: currentColors.border }]}>
        <TouchableOpacity accessibilityLabel="Quay lại" onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={currentColors.text} size={24} />
        </TouchableOpacity>
        <Typography variant="h2">Đề xuất Series</Typography>
      </View>

      <View style={[styles.notice, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
        <View style={[styles.icon, { backgroundColor: currentColors.background }]}>
          <Monitor color={currentColors.primary} size={28} />
        </View>
        <Typography variant="h3" style={styles.title}>Tạo đề xuất trên bản web</Typography>
        <Typography variant="body" color={currentColors.textSecondary} style={styles.copy}>
          Mobile chỉ hỗ trợ theo dõi dữ liệu sản xuất. Việc tạo, lưu nháp và nộp đề xuất Series cần được thực hiện trên bản web.
        </Typography>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1 },
  backButton: { padding: 4 },
  notice: { margin: 16, padding: 24, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 16, textAlign: 'center' },
  copy: { marginTop: 8, textAlign: 'center', lineHeight: 22 },
});
