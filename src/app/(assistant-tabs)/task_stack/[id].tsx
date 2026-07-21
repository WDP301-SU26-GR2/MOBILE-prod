import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Typography } from '../../../components/Typography';
import { Button } from '../../../components/Button';
import { mangakaApi } from '../../../api/mangaka';
import { useThemeStore } from '../../../store/useThemeStore';
import { colors } from '../../../theme/colors';
import { ArrowLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadFileToR2 } from '../../../utils/upload';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const currentColors = colors[theme];

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [versionUrls, setVersionUrls] = useState<Record<string, string>>({});
  const [imageFrame, setImageFrame] = useState({ width: 0, height: 0 });
  const [sourceSize, setSourceSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await mangakaApi.getTask(id as string);
      if (res) { // getTask returns data directly now due to mangakaApi updates? Wait, mangakaApi.getTask returns res.data?.data
        const t = res;
        setTask(t);
        
        if (t.pageOriginalFile) {
          const url = await mangakaApi.getTaskDownloadUrl(id as string, t.pageOriginalFile);
          setOriginalUrl(url);
        }

        if (t.versions && t.versions.length > 0) {
          const urls: Record<string, string> = {};
          for (const v of t.versions) {
            if (v.file) {
              const u = await mangakaApi.getTaskDownloadUrl(id as string, v.file);
              if (u) urls[v.id] = u;
            }
          }
          setVersionUrls(urls);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async () => {
    try {
      await mangakaApi.startTask(id as string);
      fetchData();
    } catch (e) {
      console.error(e);
      Alert.alert('Lỗi', 'Không thể bắt đầu công việc');
    }
  };

  const handleSubmitResult = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Cần quyền truy cập ảnh', 'Hãy cho phép ứng dụng truy cập thư viện ảnh để nộp kết quả.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (pickerResult.canceled || !pickerResult.assets[0]) return;

    const asset = pickerResult.assets[0];
    const contentType = asset.mimeType || 'image/jpeg';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) {
      Alert.alert('Định dạng chưa hỗ trợ', 'Chỉ có thể nộp ảnh JPEG, PNG hoặc WebP.');
      return;
    }

    try {
      setLoading(true);
      const fileName = asset.fileName || `task-${id}.${contentType.split('/')[1]}`;
      const resultFile = await uploadFileToR2(asset.uri, fileName, contentType);
      await mangakaApi.submitTask(id as string, resultFile);
      Alert.alert('Đã nộp kết quả', 'Mangaka sẽ nhận được bài nộp để duyệt.');
      await fetchData();
    } catch (error: any) {
      Alert.alert('Không thể nộp kết quả', error.response?.data?.message || error.message || 'Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const getRegionFrame = (coordinates: { x: number; y: number; width: number; height: number }) => {
    if (!imageFrame.width || !imageFrame.height || !sourceSize.width || !sourceSize.height) return null;

    const scale = Math.min(imageFrame.width / sourceSize.width, imageFrame.height / sourceSize.height);
    const renderedWidth = sourceSize.width * scale;
    const renderedHeight = sourceSize.height * scale;
    const offsetX = (imageFrame.width - renderedWidth) / 2;
    const offsetY = (imageFrame.height - renderedHeight) / 2;

    return {
      left: offsetX + coordinates.x * scale,
      top: offsetY + coordinates.y * scale,
      width: coordinates.width * scale,
      height: coordinates.height * scale,
    };
  };

  if (loading || !task) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
        <ActivityIndicator size="large" color={currentColors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'URGENT': return currentColors.error;
      case 'HIGH': return currentColors.warning;
      default: return currentColors.primary;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <ArrowLeft color={currentColors.text} size={24} />
        </TouchableOpacity>
        <Typography variant="h2">{task.taskType}</Typography>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Info Card */}
        <View style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
          <Typography variant="h3">{task.series?.title} - Chương {task.chapter?.chapterNumber}</Typography>
          <Typography variant="body" style={{ color: currentColors.textSecondary, marginTop: 4 }}>
            Độ ưu tiên: <Typography variant="bodyBold" style={{ color: getPriorityColor(task.priority) }}>{task.priority}</Typography>
          </Typography>
          <Typography variant="body" style={{ color: currentColors.textSecondary, marginTop: 4 }}>
            Hạn chót: {new Date(task.deadline).toLocaleDateString('vi-VN')}
          </Typography>
          {task.note && (
            <View style={{ marginTop: 12, padding: 8, backgroundColor: currentColors.background, borderRadius: 8 }}>
              <Typography variant="body">{task.note}</Typography>
            </View>
          )}
        </View>

        {/* File Gốc */}
        {originalUrl && (
          <View style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
            <Typography variant="h3" style={{ marginBottom: 12 }}>File gốc - Trang {task.page?.pageNumber}</Typography>
            <View style={styles.imageFrame} onLayout={(event) => setImageFrame(event.nativeEvent.layout)}>
              <Image
                source={{ uri: originalUrl }}
                style={styles.imagePreview}
                contentFit="contain"
                onLoad={(event: any) => setSourceSize({ width: event.source.width, height: event.source.height })}
              />
              {(task.regions || []).map((region: any) => {
                const frame = region.coordinates ? getRegionFrame(region.coordinates) : null;
                return frame ? <View key={region.id} style={[styles.regionOverlay, frame]} /> : null;
              })}
            </View>
            <Button 
              title="Tải về" 
              variant="outline" 
              style={{ marginTop: 12 }} 
              onPress={() => Alert.alert('Tính năng tải về đang phát triển')} 
            />
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionSection}>
          {task.status === 'ASSIGNED' && (
            <Button title="Bắt đầu làm" onPress={handleStartTask} />
          )}
          {task.status === 'IN_PROGRESS' && (
            <Button title="Upload kết quả & Nộp" onPress={handleSubmitResult} loading={loading} />
          )}
          {task.status === 'REVISION_REQUESTED' && (
            <View>
              <View style={[styles.banner, { backgroundColor: currentColors.error }]}>
                <Typography variant="bodyBold" style={{ color: '#FFF' }}>Cần sửa lại</Typography>
              </View>
              <Button title="Upload bản sửa" onPress={handleSubmitResult} loading={loading} style={{ marginTop: 12 }} />
            </View>
          )}
          {task.status === 'SUBMITTED' && (
            <View style={[styles.banner, { backgroundColor: currentColors.warning }]}>
              <Typography variant="bodyBold" style={{ color: '#000' }}>Đang chờ duyệt...</Typography>
            </View>
          )}
          {task.status === 'APPROVED' && (
            <View style={[styles.banner, { backgroundColor: currentColors.success }]}>
              <Typography variant="bodyBold" style={{ color: '#FFF' }}>Đã hoàn thành ✓</Typography>
            </View>
          )}
          {task.status === 'ON_HOLD' && (
            <View style={[styles.banner, { backgroundColor: currentColors.warning }]}>
              <Typography variant="bodyBold" style={{ color: '#000' }}>Tạm ngưng - chờ Mangaka giao lại</Typography>
            </View>
          )}
        </View>

        {/* Versions */}
        {task.versions && task.versions.length > 0 && (
          <View style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
            <Typography variant="h3" style={{ marginBottom: 12 }}>Phiên bản đã nộp</Typography>
            {[...task.versions].reverse().map((v: any, index: number) => (
              <View key={v.id} style={{ marginBottom: 16, borderBottomWidth: 1, borderBottomColor: currentColors.border, paddingBottom: 16 }}>
                <Typography variant="bodyBold">Phiên bản {v.version}</Typography>
                <Typography variant="caption" style={{ color: currentColors.textSecondary }}>
                  Người nộp: {v.submitter?.displayName} | {new Date(v.submittedAt).toLocaleString('vi-VN')}
                </Typography>
                {versionUrls[v.id] && (
                  <Image source={{ uri: versionUrls[v.id] }} style={styles.thumbnail} contentFit="cover" />
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  content: { padding: 16, paddingBottom: 40 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  imageFrame: { width: '100%', height: 300, position: 'relative' },
  imagePreview: { width: '100%', height: '100%', backgroundColor: '#eee', borderRadius: 8 },
  thumbnail: { width: 100, height: 100, borderRadius: 8, marginTop: 8 },
  actionSection: { marginBottom: 16 },
  banner: { padding: 16, borderRadius: 8, alignItems: 'center' },
  regionOverlay: { position: 'absolute', backgroundColor: 'rgba(255, 0, 0, 0.2)', borderWidth: 2, borderColor: 'red' }
});
