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

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const currentColors = colors[theme];

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [versionUrls, setVersionUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await mangakaApi.getTask(id as string);
      if (res && res.data) {
        const t = res.data;
        setTask(t);
        
        if (t.page?.originalFile && !t.page.originalFile.startsWith('http')) {
          const urlRes = await mangakaApi.getSignedUrl(t.page.originalFile);
          if (urlRes?.data) setOriginalUrl(urlRes.data);
        } else if (t.page?.originalFile) {
          setOriginalUrl(t.page.originalFile);
        }

        if (t.versions && t.versions.length > 0) {
          const urls: Record<string, string> = {};
          for (const v of t.versions) {
            if (v.resultFile && !v.resultFile.startsWith('http')) {
              const u = await mangakaApi.getSignedUrl(v.resultFile);
              if (u?.data) urls[v.id] = u.data;
            } else if (v.resultFile) {
              urls[v.id] = v.resultFile;
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
            <Image source={{ uri: originalUrl }} style={styles.imagePreview} contentFit="contain" />
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
            <Button title="Upload kết quả & Nộp" onPress={() => Alert.alert('Tính năng upload sẽ sớm ra mắt')} />
          )}
          {task.status === 'REVISION_REQUESTED' && (
            <View>
              <View style={[styles.banner, { backgroundColor: currentColors.error }]}>
                <Typography variant="bodyBold" style={{ color: '#FFF' }}>Cần sửa lại</Typography>
              </View>
              <Button title="Upload bản sửa" onPress={() => Alert.alert('Tính năng upload sẽ sớm ra mắt')} style={{ marginTop: 12 }} />
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
  imagePreview: { width: '100%', height: 300, backgroundColor: '#eee', borderRadius: 8 },
  thumbnail: { width: 100, height: 100, borderRadius: 8, marginTop: 8 },
  actionSection: { marginBottom: 16 },
  banner: { padding: 16, borderRadius: 8, alignItems: 'center' }
});
