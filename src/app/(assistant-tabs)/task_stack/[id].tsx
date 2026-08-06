import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Typography } from '../../../components/Typography';
import { Button } from '../../../components/Button';
import { assistantReadApi } from '../../../api/assistant';
import { useThemeStore } from '../../../store/useThemeStore';
import { colors } from '../../../theme/colors';
import { ArrowLeft } from 'lucide-react-native';
import * as Linking from 'expo-linking';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const currentColors = colors[theme];

  const [task, setTask] = useState<any>(null);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [versionUrls, setVersionUrls] = useState<Record<number, string>>({});
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({});
  const [imageFrame, setImageFrame] = useState({ width: 0, height: 0 });
  const [sourceSize, setSourceSize] = useState({ width: 0, height: 0 });
  const lastUrlRenewal = useRef(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await assistantReadApi.getTask(id as string);
      if (res) {
        const t = res;
        setTask(t);
        if (t.status === 'CANCELLED' && t.statusReason) {
          Alert.alert('Tự động huỷ', t.statusReason);
        }
        const pageId = t.pageId || t.page?.id;
        if (pageId) {
          assistantReadApi.getAllAnnotations({ targetType: 'PAGE', targetId: pageId })
            .then((data) => setAnnotations(data?.items || []))
            .catch(() => setAnnotations([]));
        }
        
        const pageFile = t.pageDisplayFile || t.pageOriginalFile;
        if (pageFile) {
          const url = await assistantReadApi.getTaskDownloadUrl(id as string, pageFile);
          setOriginalUrl(url);
        }

        if (t.versions && t.versions.length > 0) {
          const urls: Record<number, string> = {};
          for (const [index, v] of t.versions.entries()) {
            if (v.file) {
              const u = await assistantReadApi.getTaskDownloadUrl(id as string, v.file);
              if (u) urls[index] = u;
            }
          }
          setVersionUrls(urls);
        }
        if (t.assets?.length) {
          const urls: Record<string, string> = {};
          for (const asset of t.assets) {
            const key = asset.filePath || asset.file || asset.storageKey;
            if (key) {
              const url = await assistantReadApi.getSignedDownloadUrl(key);
              if (url) urls[asset.id ?? key] = url;
            }
          }
          setAssetUrls(urls);
        }
      }
    } catch (e) {
      console.error((e as any)?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const renewExpiredUrls = useCallback(() => {
    const now = Date.now();
    if (now - lastUrlRenewal.current < 10_000) return;
    lastUrlRenewal.current = now;
    void fetchData();
  }, [fetchData]);

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

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading || !task) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
        <ActivityIndicator size="large" color={currentColors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const getPriorityColor = (priority: unknown) => {
    const value = typeof priority === 'number' ? priority : String(priority).toUpperCase() === 'URGENT' ? 3 : String(priority).toUpperCase() === 'HIGH' ? 2 : 1;
    return value >= 3 ? currentColors.error : value >= 2 ? currentColors.warning : currentColors.primary;
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
          <Typography variant="h3">Nhiệm vụ {task.taskType}</Typography>
          <Typography variant="caption" color={currentColors.textSecondary}>Trang nguồn: {task.pageId || '—'}</Typography>
          <Typography variant="body" style={{ color: currentColors.textSecondary, marginTop: 4 }}>
            Độ ưu tiên: <Typography variant="bodyBold" style={{ color: getPriorityColor(task.priority) }}>{task.priority}</Typography>
          </Typography>
          <Typography variant="body" style={{ color: currentColors.textSecondary, marginTop: 4 }}>
            Hạn chót: {task.deadline ? new Date(task.deadline).toLocaleDateString('vi-VN') : 'Chưa đặt'}
          </Typography>
          {(task.description || task.note) && (
            <View style={{ marginTop: 12, padding: 8, backgroundColor: currentColors.background, borderRadius: 8 }}>
              <Typography variant="body">{task.description || task.note}</Typography>
            </View>
          )}
          {(task.chapterId || task.chapter?.id) && <Button title="Xem toàn bộ trang của chương" variant="outline" style={{ marginTop: 12 }} onPress={() => router.push(`/(assistant-tabs)/task_stack/chapter/${task.chapterId || task.chapter.id}` as any)} />}
        </View>

        {/* File Gốc */}
        {originalUrl && (
          <View style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
            <Typography variant="h3" style={{ marginBottom: 12 }}>File gốc của trang</Typography>
            <View style={styles.imageFrame} onLayout={(event) => setImageFrame(event.nativeEvent.layout)}>
              <Image
                source={{ uri: originalUrl }}
                style={styles.imagePreview}
                contentFit="contain"
                onLoad={(event: any) => setSourceSize({ width: event.source.width, height: event.source.height })}
                onError={renewExpiredUrls}
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
              onPress={() => Linking.openURL(originalUrl)}
            />
          </View>
        )}

        {/* Mobile is a read-only companion. Task transitions and uploads stay on web. */}
        <View style={styles.actionSection}>
          <View style={[styles.banner, { backgroundColor: currentColors.background, borderColor: currentColors.border, borderWidth: 1 }]}>
            <Typography variant="bodyBold">Trạng thái: {task.status}</Typography>
            <Typography variant="caption" color={currentColors.textSecondary}>Bắt đầu, nộp kết quả hoặc yêu cầu sửa được thực hiện trên bản web.</Typography>
          </View>
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
        </View>

        {/* Versions */}
        {task.versions && task.versions.length > 0 && (
          <View style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
            <Typography variant="h3" style={{ marginBottom: 12 }}>Phiên bản đã nộp</Typography>
            {task.versions.map((v: any, index: number) => (
              <View key={`${v.versionNumber ?? index}-${v.submittedAt ?? index}`} style={{ marginBottom: 16, borderBottomWidth: 1, borderBottomColor: currentColors.border, paddingBottom: 16 }}>
                <Typography variant="bodyBold">Phiên bản {v.versionNumber ?? v.version ?? index + 1}</Typography>
                <Typography variant="caption" style={{ color: currentColors.textSecondary }}>
                  Người nộp: {v.submitter?.displayName} | {new Date(v.submittedAt).toLocaleString('vi-VN')}
                </Typography>
                {versionUrls[index] && (
                  <Image source={{ uri: versionUrls[index] }} style={styles.thumbnail} contentFit="cover" onError={renewExpiredUrls} />
                )}
              </View>
            ))}
          </View>
        )}

        {task.assets?.length > 0 && (
          <View style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
            <Typography variant="h3" style={{ marginBottom: 12 }}>Tài nguyên đính kèm</Typography>
            {task.assets.map((asset: any, index: number) => {
              const key = asset.id ?? asset.filePath ?? index;
              const url = assetUrls[key];
              return (
                <View key={key} style={[styles.asset, { borderColor: currentColors.border }]}>
                  <Typography variant="bodyBold" style={{ flex: 1 }}>{asset.name || asset.fileName || `Tài nguyên ${index + 1}`}</Typography>
                  {url ? <Button title="Mở" variant="outline" onPress={() => void Linking.openURL(url)} /> : null}
                </View>
              );
            })}
          </View>
        )}

        {annotations.length > 0 && (
          <View style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
            <Typography variant="h3" style={{ marginBottom: 12 }}>Ghi chú trên trang</Typography>
            {annotations.map((annotation) => (
              <View key={annotation.id} style={[styles.annotation, { borderColor: currentColors.border }]}>
                <Typography variant="bodyBold">{annotation.author?.displayName || annotation.creator?.displayName || 'Thành viên studio'}</Typography>
                <Typography variant="body" style={{ color: currentColors.textSecondary, marginTop: 4 }}>
                  {annotation.content || annotation.comment || 'Không có nội dung'}
                </Typography>
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
  annotation: { paddingVertical: 10, borderBottomWidth: 1 },
  asset: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, paddingVertical: 10 },
  regionOverlay: { position: 'absolute', backgroundColor: 'rgba(255, 0, 0, 0.2)', borderWidth: 2, borderColor: 'red' }
});
