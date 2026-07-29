import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Typography } from '../../../../components/Typography';
import { colors } from '../../../../theme/colors';
import { Image } from 'expo-image';
import { ChevronLeft } from 'lucide-react-native';
import { mangakaApi } from '../../../../api/mangaka';
import * as Linking from 'expo-linking';
import { Button } from '../../../../components/Button';

const { width } = Dimensions.get('window');

export default function CompositeReview() {
  const { taskId } = useLocalSearchParams();
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [versionUrls, setVersionUrls] = useState<Record<number, string>>({});
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({});
  const [annotations, setAnnotations] = useState<any[]>([]);
  const lastUrlRenewal = useRef(0);
  
  const fetchTask = useCallback(async () => {
    try {
      const data = await mangakaApi.getReviewTask(taskId as string);
      setTask(data);
      if (data) {
        const displayFile = data.pageDisplayFile || data.pageOriginalFile;
        if (displayFile) {
           const origUrl = await mangakaApi.getTaskDownloadUrl(taskId as string, displayFile);
           setOriginalUrl(origUrl);
        }
        const latestVersion = data.versions && data.versions.length > 0 ? data.versions[data.versions.length - 1] : null;
        if (latestVersion?.file) {
           const resUrl = await mangakaApi.getTaskDownloadUrl(taskId as string, latestVersion.file);
           setResultUrl(resUrl);
        }
        const signedVersions: Record<number, string> = {};
        await Promise.all((data.versions ?? []).map(async (version: any, index: number) => {
          if (!version.file) return;
          const url = await mangakaApi.getTaskDownloadUrl(taskId as string, version.file);
          if (url) signedVersions[index] = url;
        }));
        setVersionUrls(signedVersions);
        const signedAssets: Record<string, string> = {};
        await Promise.all((data.assets ?? []).map(async (asset: any) => {
          const url = await mangakaApi.getTaskDownloadUrl(taskId as string, asset.filePath);
          if (url) signedAssets[asset.id] = url;
        }));
        setAssetUrls(signedAssets);
        if (data.pageId) {
          const feedback = await mangakaApi.getAllAnnotations({ targetType: 'PAGE', targetId: data.pageId });
          setAnnotations(feedback?.items ?? []);
        }
      }
    } catch (error) {
      console.log('Error fetching review task', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết bài nộp.');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const renewExpiredUrls = useCallback(() => {
    const now = Date.now();
    if (now - lastUrlRenewal.current < 10_000) return;
    lastUrlRenewal.current = now;
    void fetchTask();
  }, [fetchTask]);

  React.useEffect(() => {
    void fetchTask();
  }, [fetchTask]);

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
        <View style={styles.infoCard}>
          <Typography variant="bodyBold">Trạng thái: {task.status} · Ưu tiên {task.priority}</Typography>
          <Typography variant="body" color={colors.textSecondary}>Hạn: {task.deadline ? new Date(task.deadline).toLocaleString('vi-VN') : 'Chưa đặt'}</Typography>
          {task.description ? <Typography variant="body" color={colors.textSecondary}>{task.description}</Typography> : null}
          <Typography variant="caption" color={colors.textSecondary}>{task.regions?.length ?? 0} vùng được giao</Typography>
        </View>
        <Typography variant="h3" style={{ marginBottom: 12 }}>Bài nộp (Kết quả)</Typography>
        <Image 
          source={{ uri: resultUrl || 'https://via.placeholder.com/400x533' }} 
          style={styles.imagePreview} 
          contentFit="contain"
          onError={resultUrl ? renewExpiredUrls : undefined}
        />

        {(task.versions ?? []).map((version: any, index: number) => <View key={`${version.versionNumber}-${index}`} style={styles.infoCard}>
          <Typography variant="bodyBold">Phiên bản {version.versionNumber} · {version.reviewStatus}</Typography>
          <Typography variant="caption" color={colors.textSecondary}>{new Date(version.submittedAt).toLocaleString('vi-VN')}</Typography>
          {version.reviewerNote ? <Typography variant="body" color={colors.textSecondary}>{version.reviewerNote}</Typography> : null}
          {versionUrls[index] ? <Image source={{ uri: versionUrls[index] }} style={styles.versionPreview} contentFit="contain" onError={renewExpiredUrls} /> : null}
        </View>)}

        {(task.assets ?? []).length > 0 && <View style={styles.infoCard}>
          <Typography variant="h3">Tài nguyên tham khảo</Typography>
          {task.assets.map((asset: any) => <View key={asset.id} style={styles.assetRow}><Typography variant="body" style={{ flex: 1 }}>{asset.name} · {asset.assetType || 'OTHER'}</Typography>{assetUrls[asset.id] ? <Button title="Mở" variant="outline" onPress={() => void Linking.openURL(assetUrls[asset.id])} /> : null}</View>)}
        </View>}

        {annotations.length > 0 && <View style={styles.infoCard}>
          <Typography variant="h3">Feedback trên trang</Typography>
          {annotations.map((annotation) => <View key={annotation.id} style={styles.feedback}><Typography variant="bodyBold">{annotation.author?.displayName || annotation.authorRole || 'Thành viên'}</Typography><Typography variant="body" color={colors.textSecondary}>{annotation.content || 'Không có nội dung'}</Typography></View>)}
        </View>}

        <Typography variant="h3" style={{ marginBottom: 12, marginTop: 16 }}>Bản gốc (Nền)</Typography>
        <Image 
          source={{ uri: originalUrl || 'https://via.placeholder.com/400x533' }} 
          style={styles.imagePreview} 
          contentFit="contain"
          onError={originalUrl ? renewExpiredUrls : undefined}
        />

        <View style={[styles.actions, { flexDirection: 'column' }]}>
          <Typography variant="bodyBold">Chế độ xem trên mobile</Typography>
          <Typography variant="body" color={colors.textSecondary}>Duyệt hoặc yêu cầu chỉnh sửa bài nộp cần thực hiện trên bản web.</Typography>
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
  infoCard: { padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 10, gap: 6, marginBottom: 16 },
  versionPreview: { width: '100%', height: 220, marginTop: 8 },
  assetRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8 },
  feedback: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 8 },
  btn: { flex: 1 }
});
