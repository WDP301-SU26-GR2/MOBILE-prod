import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import { useThemeStore } from '../../../store/useThemeStore';
import { Typography } from '../../../components/Typography';
import { Button } from '../../../components/Button';
import { colors } from '../../../theme/colors';

export default function VoteDoneScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: currentColors.success + '20' }]}>
          <CheckCircle size={80} color={currentColors.success} />
        </View>
        
        <Typography variant="h1" style={[styles.title, { color: currentColors.text }]}>
          Cảm ơn bạn đã bình chọn!
        </Typography>
        
        <Typography variant="body" style={[styles.subtitle, { color: currentColors.textSecondary }]}>
          Kết quả sẽ được công bố sau khi kỳ bình chọn kết thúc.
        </Typography>
      </View>

      <View style={[styles.footer, { backgroundColor: currentColors.surface, borderTopColor: currentColors.border }]}>
        <Button
          title="Xem Bảng Xếp Hạng"
          onPress={() => router.push('/(public)/ranking' as any)}
          style={styles.button}
        />
        <Button
          title="Về Trang Chủ"
          onPress={() => router.push('/(public)')}
          variant="outlined"
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    gap: 12,
  },
  button: {
    width: '100%',
  }
});
