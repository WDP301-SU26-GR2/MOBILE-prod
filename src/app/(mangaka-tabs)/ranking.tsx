import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography } from '../../components/Typography';
import { UserCircle } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useThemeStore } from '../../store/useThemeStore';

export default function RankingMangaka() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={styles.header}>
        <Typography variant="h1">Xếp hạng</Typography>
      </View>
      <View style={styles.content}>
        <Typography variant="h2">Xếp hạng Xưởng</Typography>
        <Typography variant="body" color={currentColors.textSecondary} style={{ marginTop: 8 }}>
          Tính năng đang phát triển.
        </Typography>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
