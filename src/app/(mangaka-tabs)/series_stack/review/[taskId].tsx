import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Typography } from '../../../../components/Typography';
import { Button } from '../../../../components/Button';
import { colors } from '../../../../theme/colors';
import { Image } from 'expo-image';
import { ChevronLeft } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function CompositeReview() {
  const { taskId } = useLocalSearchParams();
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  
  React.useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const data = await mangakaApi.getReviewTask(taskId as string);
      setTask(data);
      if (data) {
        if (data.pageOriginalFile) {
           const origUrl = await mangakaApi.getTaskDownloadUrl(taskId as string, data.pageOriginalFile);
           setOriginalUrl(origUrl);
        }
        const latestVersion = data.versions && data.versions.length > 0 ? data.versions[data.versions.length - 1] : null;
        if (latestVersion?.file) {
           const resUrl = await mangakaApi.getTaskDownloadUrl(taskId as string, latestVersion.file);
           setResultUrl(resUrl);
        }
      }
    } catch (error) {
      console.log('Error fetching review task', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết bài nộp.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn duyệt bài này?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Duyệt', 
        onPress: async () => {
          try {
            await mangakaApi.approveTask(taskId as string);
            Alert.alert('Thành công', 'Đã duyệt bài nộp của Assistant.');
            router.back();
          } catch (e: any) {
            Alert.alert('Lỗi', e.response?.data?.message || 'Lỗi khi duyệt bài.');
          }
        } 
      }
    ]);
  };

  const handleRevision = () => {
    Alert.prompt(
      'Yêu cầu sửa',
      'Vui lòng nhập lý do:',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Gửi yêu cầu', 
          onPress: async (reason) => {
            if (!reason) {
              Alert.alert('Lỗi', 'Vui lòng nhập lý do.');
              return;
            }
            try {
              await mangakaApi.rejectTask(taskId as string, reason);
              Alert.alert('Thành công', 'Đã gửi yêu cầu sửa lại cho Assistant.');
              router.back();
            } catch (e: any) {
              Alert.alert('Lỗi', e.response?.data?.message || 'Lỗi khi gửi yêu cầu.');
            }
          } 
        }
      ],
      'plain-text'
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Typography>Đang tải dữ liệu...</Typography>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Typography>Không tìm thấy bài nộp.</Typography>
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
          <Typography variant="h2">Duyệt bài Tổng hợp</Typography>
          <Typography variant="body" color={colors.textSecondary}>
            Nhiệm vụ: {task.taskType || 'Không rõ'}
          </Typography>
        </View>
      </View>
      <ScrollView style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomWidth: 0, paddingTop: 0 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <Image 
            source={{ uri: task.assistant?.avatar || 'https://via.placeholder.com/40' }} 
            style={{ width: 32, height: 32, borderRadius: 16 }} 
          />
          <Typography variant="body" color={colors.textSecondary}>
            Trợ lý: {task.assistant?.displayName || 'Không rõ'}
          </Typography>
        </View>
      </View>

      <View style={styles.content}>
        <Typography variant="h3" style={{ marginBottom: 12 }}>Bài nộp (Kết quả)</Typography>
        <Image 
          source={{ uri: resultUrl || 'https://via.placeholder.com/400x533' }} 
          style={styles.imagePreview} 
          contentFit="contain"
        />

        <Typography variant="h3" style={{ marginBottom: 12, marginTop: 16 }}>Bản gốc (Nền)</Typography>
        <Image 
          source={{ uri: originalUrl || 'https://via.placeholder.com/400x533' }} 
          style={styles.imagePreview} 
          contentFit="contain"
        />

        <View style={styles.actions}>
          <Button 
            title="Yêu cầu sửa" 
            variant="outline" 
            onPress={handleRevision} 
            style={styles.btn}
          />
          <Button 
            title="Duyệt bài" 
            onPress={handleApprove} 
            style={styles.btn}
          />
        </View>
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
  content: { padding: 16 },
  imagePreview: { width: width - 32, height: (width - 32) * 1.33, backgroundColor: '#E0E0E0', borderRadius: 8, marginBottom: 24 },
  actions: { flexDirection: 'row', gap: 16 },
  btn: { flex: 1 }
});
