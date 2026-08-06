import React, { useCallback, useEffect, useState } from 'react';
import { Alert, View, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Typography } from '../../../components/Typography';
import { Button } from '../../../components/Button';
import { mangakaApi } from '../../../api/mangaka';
import { colors } from '../../../theme/colors';
import { useThemeStore } from '../../../store/useThemeStore';
import { CheckCircle, Clock, UserCheck, ChevronLeft } from 'lucide-react-native';

export default function SeriesDetailMangaka() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const [series, setSeries] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [seriesNames, setSeriesNames] = useState<any[]>([]);
  const [publicationVersions, setPublicationVersions] = useState<any[]>([]);
  const [seriesPayments, setSeriesPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const [seriesData, chaptersData, contractsData, namesData, publicationsData, paymentsData] = await Promise.all([
        mangakaApi.getSeriesDetail(id as string),
        mangakaApi.getChapters(id as string),
        mangakaApi.getContracts({ seriesId: id as string }),
        mangakaApi.getAllSeriesNames(id as string),
        mangakaApi.getPublicationVersions(id as string),
        mangakaApi.getSeriesPayments(id as string),
      ]);
      
      let finalCoverUrl = seriesData.coverImageUrl || seriesData.coverImage;
      if (finalCoverUrl && !finalCoverUrl.startsWith('http')) {
        const signed = await mangakaApi.getSignedUrl(finalCoverUrl).catch(() => null);
        if (signed) finalCoverUrl = signed;
      }
      
      setSeries({ ...seriesData, signedCoverUrl: finalCoverUrl });
      setChapters(chaptersData?.items || chaptersData || []);
      setContracts(contractsData?.items || contractsData || []);
      setSeriesNames(namesData?.items || namesData || []);
      setPublicationVersions(publicationsData?.items || publicationsData || []);
      setSeriesPayments(paymentsData?.items || paymentsData?.data || paymentsData || []);
    } catch (e) {
      console.log('Error fetching series detail or chapters', (e as any)?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

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
            <View style={{ gap: 16 }}>
              {series.status === 'HIATUS' && (
                <View style={[styles.actionBox, { backgroundColor: `${currentColors.warning}15`, borderColor: currentColors.warning }]}>
                  <Typography variant="bodyBold" style={{ color: currentColors.warning, marginBottom: 4 }}>
                    ⏸ Tạm ngưng
                  </Typography>
                  {!!series.hiatusExpectedReturnDate ? (
                    <Typography variant="body" color={currentColors.textSecondary}>
                      Dự kiến trở lại: {new Date(series.hiatusExpectedReturnDate).toLocaleDateString('vi-VN')}
                    </Typography>
                  ) : null}
                </View>
              )}
              
              <TouchableOpacity 
                style={[styles.actionBox, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}
                onPress={() => router.push('/(mangaka-tabs)/series_stack/series-requests')}
              >
                <Typography variant="bodyBold" style={{ color: currentColors.primary }}>
                  Xem yêu cầu thay đổi trạng thái →
                </Typography>
                <Typography variant="caption" color={currentColors.textSecondary}>
                  Yêu cầu rút hồ sơ / tạm ngưng / kết thúc sớm
                </Typography>
              </TouchableOpacity>

              <View>
                <Typography variant="h3" color={currentColors.text} style={{ marginBottom: 8 }}>Tóm tắt</Typography>
                <Typography variant="body" color={currentColors.textSecondary} style={{ marginBottom: 16 }}>
                {series.proposal?.synopsis || 'Chưa có tóm tắt.'}
              </Typography>
              {(seriesNames.length > 0 || publicationVersions.length > 0 || seriesPayments.length > 0) && <View style={[styles.actionBox, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
                <Typography variant="bodyBold">Name & phiên bản xuất bản</Typography>
                {seriesNames.map((name: any, index: number) => <TouchableOpacity key={name.id || index} onPress={() => name.id && void mangakaApi.getSeriesName(id as string, name.id).then((detail) => Alert.alert('Name của series', detail?.title || detail?.status || 'Chi tiết Name'))}><Typography variant="caption" color={currentColors.primary}>Xem Name {name.title || index + 1}</Typography></TouchableOpacity>)}
                {publicationVersions.map((version: any, index: number) => <TouchableOpacity key={version.id || index} onPress={() => version.id && void mangakaApi.getPublicationVersion(version.id).then((detail) => Alert.alert('Phiên bản xuất bản', detail?.version || detail?.status || 'Chi tiết phiên bản'))}><Typography variant="caption" color={currentColors.primary}>Xem phiên bản xuất bản {version.versionNumber || index + 1}</Typography></TouchableOpacity>)}
                {seriesPayments.length > 0 && <Typography variant="caption" color={currentColors.textSecondary}>{seriesPayments.length} khoản thanh toán theo series</Typography>}
              </View>}
              
              {isProposal && series.status === 'DRAFT' && (
                <View style={[styles.actionBox, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
                  <Typography variant="bodyMedium" color={currentColors.text} style={{ marginBottom: 16 }}>
                    Bản nháp đang chờ nộp.
                  </Typography>
                  <Typography variant="caption" color={currentColors.textSecondary}>Nộp đề xuất thực hiện trên bản web.</Typography>
                </View>
              )}

              {isAbandoned && (
                <View style={[styles.actionBox, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
                  <Typography variant="bodyMedium" color={currentColors.error} style={{ marginBottom: 16 }}>
                    Đề xuất đã bị từ chối hoặc thu hồi. Bạn có thể nộp lại.
                  </Typography>
                  <Typography variant="caption" color={currentColors.textSecondary}>Nộp lại đề xuất thực hiện trên bản web.</Typography>
                </View>
              )}

              {series.status === 'SERIALIZED' && (
                <View style={[styles.actionBox, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
                  <Typography variant="bodyMedium" color={currentColors.text} style={{ marginBottom: 16 }}>
                    Truyện đang được xuất bản.
                  </Typography>
                  <Typography variant="caption" color={currentColors.textSecondary}>Tạo chương mới thực hiện trên bản web.</Typography>
                </View>
              )}
            </View>
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
