import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Typography } from '../../../components/Typography';
import { Button } from '../../../components/Button';
import { mangakaApi } from '../../../api/mangaka';
import { colors } from '../../../theme/colors';
import { useThemeStore } from '../../../store/useThemeStore';
import { Edit2, Plus, Image as ImageIcon, CheckCircle, Clock, UserCheck, ChevronLeft } from 'lucide-react-native';

export default function SeriesDetailMangaka() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const [series, setSeries] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const [seriesData, chaptersData, contractsData] = await Promise.all([
        mangakaApi.getSeriesDetail(id as string),
        mangakaApi.getChapters(id as string),
        mangakaApi.getContracts({ seriesId: id as string })
      ]);
      
      let finalCoverUrl = seriesData.coverImageUrl || seriesData.coverImage;
      if (finalCoverUrl && !finalCoverUrl.startsWith('http')) {
        const signed = await mangakaApi.getSignedUrl(finalCoverUrl).catch(() => null);
        if (signed) finalCoverUrl = signed;
      }
      
      setSeries({ ...seriesData, signedCoverUrl: finalCoverUrl });
      setChapters(chaptersData?.items || chaptersData || []);
      setContracts(contractsData?.items || contractsData || []);
    } catch (e) {
      console.log('Error fetching series detail or chapters', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={currentColors.primary} />
      </SafeAreaView>
    );
  }

  if (!series) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Typography variant="body" color={currentColors.text}>Không tìm thấy truyện.</Typography>
        <Button title="Quay lại" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </SafeAreaView>
    );
  }

  const isProposal = series.status === 'DRAFT' || series.status === 'IN_REVIEW' || series.status === 'PROPOSAL_REVISION';
  const isAbandoned = series.status === 'ABANDONED' || series.status === 'WITHDRAWN';

  const handleReopen = async () => {
    try {
      setLoading(true);
      await mangakaApi.reopenSeries(series.id);
      Alert.alert('Thành công', 'Đã chuyển thành Bản nháp, vui lòng nộp lại.');
      fetchDetail();
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Lỗi nộp lại');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <ScrollView>
        <View style={[styles.header, { backgroundColor: currentColors.surface }]}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginRight: 8, alignSelf: 'flex-start' }}>
            <ChevronLeft color={currentColors.text} size={28} />
          </TouchableOpacity>
          <Image 
            source={{ uri: series.signedCoverUrl || series.coverImageUrl || 'https://via.placeholder.com/100' }} 
            style={styles.cover} 
            contentFit="cover"
          />
          <View style={styles.headerInfo}>
            <Typography variant="h2" color={currentColors.text}>{series.title}</Typography>
            <View style={[styles.badge, { backgroundColor: currentColors.primary }]}>
              <Typography variant="caption" color="#fff">{series.status}</Typography>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <UserCheck size={14} color={currentColors.textSecondary} />
              <Typography variant="caption" color={currentColors.textSecondary}>
                Editor phụ trách: {series.editor ? series.editor.displayName : 'Đang chờ Editor nhận'}
              </Typography>
            </View>
          </View>
        </View>

        <View style={[styles.tabs, { borderBottomColor: currentColors.border, backgroundColor: currentColors.surface }]}>
          <TouchableOpacity 
            style={activeTab === 'OVERVIEW' ? [styles.tabActive, { borderBottomColor: currentColors.primary }] : styles.tabInactive}
            onPress={() => setActiveTab('OVERVIEW')}
          >
            <Typography variant="bodyBold" color={activeTab === 'OVERVIEW' ? currentColors.primary : currentColors.textSecondary}>Tổng quan</Typography>
          </TouchableOpacity>
          <TouchableOpacity 
            style={activeTab === 'CHAPTERS' ? [styles.tabActive, { borderBottomColor: currentColors.primary }] : styles.tabInactive}
            onPress={() => setActiveTab('CHAPTERS')}
          >
            <Typography variant="bodyBold" color={activeTab === 'CHAPTERS' ? currentColors.primary : currentColors.textSecondary}>Các chương</Typography>
          </TouchableOpacity>
          <TouchableOpacity 
            style={activeTab === 'CONTRACTS' ? [styles.tabActive, { borderBottomColor: currentColors.primary }] : styles.tabInactive}
            onPress={() => setActiveTab('CONTRACTS')}
          >
            <Typography variant="bodyBold" color={activeTab === 'CONTRACTS' ? currentColors.primary : currentColors.textSecondary}>Hợp đồng</Typography>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {activeTab === 'OVERVIEW' && (
            <View>
              <Typography variant="h3" color={currentColors.text} style={{ marginBottom: 8 }}>Tóm tắt</Typography>
              <Typography variant="body" color={currentColors.textSecondary} style={{ marginBottom: 16 }}>
                {series.proposal?.synopsis || 'Chưa có tóm tắt.'}
              </Typography>
              
              {isProposal && series.status === 'DRAFT' && (
                <View style={[styles.actionBox, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
                  <Typography variant="bodyMedium" color={currentColors.text} style={{ marginBottom: 16 }}>
                    Bản nháp đang chờ nộp.
                  </Typography>
                  <Button title="Nộp Đề xuất" onPress={() => mangakaApi.submitProposal(series.id)} />
                </View>
              )}

              {isAbandoned && (
                <View style={[styles.actionBox, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
                  <Typography variant="bodyMedium" color={currentColors.error} style={{ marginBottom: 16 }}>
                    Đề xuất đã bị từ chối hoặc thu hồi. Bạn có thể nộp lại.
                  </Typography>
                  <Button 
                    title="Nộp lại" 
                    onPress={() => Alert.alert('Xác nhận', 'Chuyển series này về Bản nháp?', [
                      { text: 'Hủy', style: 'cancel' },
                      { text: 'Đồng ý', onPress: handleReopen }
                    ])} 
                  />
                </View>
              )}

              {series.status === 'SERIALIZED' && (
                <View style={[styles.actionBox, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
                  <Typography variant="bodyMedium" color={currentColors.text} style={{ marginBottom: 16 }}>
                    Truyện đang được xuất bản.
                  </Typography>
                  <Button title="Tạo Chương Mới" onPress={() => {}} />
                </View>
              )}
            </View>
          )}

          {activeTab === 'CHAPTERS' && (
            <View>
              <Typography variant="h3" color={currentColors.text} style={{ marginBottom: 16 }}>Danh sách Chương</Typography>
              
              {chapters.length === 0 ? (
                <Typography variant="body" color={currentColors.textSecondary}>Chưa có chương nào.</Typography>
              ) : (
                chapters.map((chapter: any) => (
                  <TouchableOpacity 
                    key={chapter.id}
                    style={[styles.chapterCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}
                    onPress={() => router.push({ pathname: '/(mangaka-tabs)/series_stack/chapter/[chapterId]', params: { chapterId: chapter.id } })}
                  >
                    <View style={{ flex: 1 }}>
                      <Typography variant="bodyBold">
                        Chương {chapter.chapterNumber}: {chapter.title}
                      </Typography>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        {chapter.status === 'PUBLISHED' ? (
                          <>
                            <CheckCircle size={14} color={currentColors.success} />
                            <Typography variant="caption" color={currentColors.success}>Đã xuất bản</Typography>
                          </>
                        ) : (
                          <>
                            <Clock size={14} color={currentColors.warning} />
                            <Typography variant="caption" color={currentColors.warning}>
                              {chapter.status || 'Đang tiến hành'}
                            </Typography>
                          </>
                        )}
                      </View>
                    </View>
                    {chapter.status === 'PUBLISHED' ? (
                      <View style={{ alignItems: 'flex-end' }}>
                        <Typography variant="caption" color={currentColors.textSecondary} style={{ marginBottom: 4 }}>
                          {chapter.views || 0} lượt xem
                        </Typography>
                        <Button 
                          title="Xem" 
                          variant="outline" 
                          style={{ paddingHorizontal: 12, paddingVertical: 4 }} 
                          textStyle={{ fontSize: 12 }} 
                          onPress={() => router.push({ pathname: '/(mangaka-tabs)/series_stack/chapter/[chapterId]', params: { chapterId: chapter.id } })} 
                        />
                      </View>
                    ) : (
                      <Button 
                        title="Tiếp tục" 
                        variant="primary" 
                        style={{ paddingHorizontal: 12, paddingVertical: 6 }} 
                        textStyle={{ fontSize: 12 }} 
                        onPress={() => router.push({ pathname: '/(mangaka-tabs)/series_stack/chapter/[chapterId]', params: { chapterId: chapter.id } })} 
                      />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {activeTab === 'CONTRACTS' && (
            <View>
              <Typography variant="h3" color={currentColors.text} style={{ marginBottom: 16 }}>Danh sách Hợp đồng</Typography>
              {contracts.length === 0 ? (
                <Typography variant="body" color={currentColors.textSecondary}>Chưa có hợp đồng nào được tạo.</Typography>
              ) : (
                contracts.map((contract: any) => (
                  <TouchableOpacity 
                    key={contract.id}
                    style={[styles.chapterCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}
                    onPress={() => router.push({ pathname: '/(mangaka-tabs)/series_stack/contract/[contractId]', params: { contractId: contract.id } })}
                  >
                    <View style={{ flex: 1 }}>
                      <Typography variant="bodyBold">Hợp đồng: {contract.contractType}</Typography>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Typography variant="caption" color={currentColors.primary}>{contract.status}</Typography>
                        <Typography variant="caption" color={currentColors.textSecondary}> • Cập nhật: {new Date(contract.updatedAt || contract.createdAt).toLocaleDateString()}</Typography>
                      </View>
                    </View>
                    <Button 
                      title="Xem" 
                      variant="outline" 
                      style={{ paddingHorizontal: 16, paddingVertical: 8 }} 
                      onPress={() => router.push({ pathname: '/(mangaka-tabs)/series_stack/contract/[contractId]', params: { contractId: contract.id } })}
                    />
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, flexDirection: 'row', gap: 16 },
  cover: { width: 80, height: 110, borderRadius: 8 },
  headerInfo: { flex: 1, justifyContent: 'center', gap: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tabActive: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2 },
  tabInactive: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  content: { padding: 16 },
  section: { marginTop: 32 },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12
  },
  actionBox: { padding: 16, borderRadius: 12, marginTop: 16, borderWidth: 1 }
});
