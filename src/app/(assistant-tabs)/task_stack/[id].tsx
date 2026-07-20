import React from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Typography } from '../../../components/Typography';
import { Button } from '../../../components/Button';
import { colors } from '../../../theme/colors';
import { ChevronLeft } from 'lucide-react-native';

export default function TaskDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [task, setTask] = React.useState<any>(null);

  // TODO: Fetch task detail from API
  React.useEffect(() => {
    // mock fetch
    // setTask({});
  }, [id]);

  if (!task) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Typography color={colors.textSecondary}>Không tìm thấy nhiệm vụ.</Typography>
        <Button title="Quay lại" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
          <ChevronLeft color={colors.text} size={28} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Typography variant="h2" numberOfLines={1}>{task.title}</Typography>
          <Typography variant="caption" color={colors.textSecondary}>Mangaka: {task.mangakaName}</Typography>
        </View>
        <View style={styles.badge}>
          <Typography variant="caption" color="#fff">{task.status}</Typography>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={styles.content}>
        <Typography variant="h3" style={{ marginBottom: 8 }}>Mô tả công việc</Typography>
        <Typography variant="body" style={{ marginBottom: 16, lineHeight: 24 }}>
          {task.description || 'Không có mô tả.'}
        </Typography>

        <Typography variant="h3" style={{ marginBottom: 8 }}>Tài liệu tham khảo</Typography>
        {task.references?.length ? (
          task.references.map((ref: any, idx: number) => (
            <View key={idx} style={styles.referenceCard}>
              <Typography variant="bodyMedium">🏙️ {ref.name || 'Tài liệu'}</Typography>
            </View>
          ))
        ) : (
          <Typography variant="body" color={colors.textSecondary}>Không có tài liệu đính kèm.</Typography>
        )}

        <Typography variant="h3" style={{ marginTop: 24, marginBottom: 8 }}>Nộp bài</Typography>
        <Button 
          title="Tải lên File" 
          variant="outlined" 
          onPress={() => Alert.alert('Tải lên', 'Tính năng đang phát triển')} 
          style={{ marginBottom: 16 }}
        />
        <Button 
          title="Gửi duyệt" 
          onPress={() => {
            Alert.alert('Thành công', 'Đã gửi duyệt!');
            router.back();
          }} 
        />
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { 
    padding: 16, 
    backgroundColor: colors.surface, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center'
  },
  badge: { alignSelf: 'flex-start', backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  content: { padding: 16 },
  referenceCard: { padding: 12, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border }
});
