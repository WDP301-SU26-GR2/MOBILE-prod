import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, ScrollView, Modal, ActivityIndicator, TextInput as RNTextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Typography } from '../../components/Typography';
import { TextInput } from '../../components/TextInput';
import { Button } from '../../components/Button';
import { colors } from '../../theme/colors';
import { useThemeStore } from '../../store/useThemeStore';
import { mangakaApi } from '../../api/mangaka';
import { Search, Star, Users, Briefcase, Mail, XCircle, CheckCircle, Clock, Ban, Plus } from 'lucide-react-native';

const Avatar = ({ avatarKey, size = 48 }: { avatarKey?: string, size?: number }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (avatarKey) {
      if (avatarKey.startsWith('http')) setUrl(avatarKey);
      else mangakaApi.getSignedUrl(avatarKey).then(setUrl).catch(() => setUrl(null));
    }
  }, [avatarKey]);

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#E2E8F0', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      {url ? <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : <Users size={size * 0.5} color="#94A3B8" />}
    </View>
  );
};

export default function StudioScreen() {
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ASSISTANT' | 'INVITES' | 'ASSIGNMENTS'>('ASSISTANT');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Typography variant="h1">Studio</Typography>
        <Typography variant="body" color={currentColors.textSecondary}>Quản lý nhân sự và cộng tác viên</Typography>
      </View>

      <View style={[styles.segmentedControl, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
        <TouchableOpacity 
          style={[styles.segment, activeTab === 'ASSISTANT' && { backgroundColor: currentColors.primary }]}
          onPress={() => setActiveTab('ASSISTANT')}
        >
          <Typography variant="bodyBold" color={activeTab === 'ASSISTANT' ? '#FFF' : currentColors.textSecondary}>Trợ lý</Typography>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.segment, activeTab === 'INVITES' && { backgroundColor: currentColors.primary }]}
          onPress={() => setActiveTab('INVITES')}
        >
          <Typography variant="bodyBold" color={activeTab === 'INVITES' ? '#FFF' : currentColors.textSecondary}>Lời mời</Typography>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.segment, activeTab === 'ASSIGNMENTS' && { backgroundColor: currentColors.primary }]}
          onPress={() => setActiveTab('ASSIGNMENTS')}
        >
          <Typography variant="bodyBold" color={activeTab === 'ASSIGNMENTS' ? '#FFF' : currentColors.textSecondary}>Cộng tác</Typography>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'ASSISTANT' && <AssistantTab />}
        {activeTab === 'INVITES' && <InvitesTab />}
        {activeTab === 'ASSIGNMENTS' && <AssignmentsTab />}
      </View>
    </SafeAreaView>
  );
}

// --- TAB 1: ASSISTANTS ---
const AssistantTab = () => {
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const router = useRouter();
  
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [assistants, setAssistants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Invite modal state
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<any>(null);
  
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [hireStart, setHireStart] = useState(new Date());
  const [hireEnd, setHireEnd] = useState(() => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth;
  });
  
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onChangeStart = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowStartPicker(false);
    if (selectedDate) setHireStart(selectedDate);
  };

  const onChangeEnd = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowEndPicker(false);
    if (selectedDate) setHireEnd(selectedDate);
  };

  const TASK_OPTIONS = ['BACKGROUND', 'SCREENTONE', 'EFFECT_LINES', 'INKING', 'COLORING', 'LETTERING'];

  const toggleTask = (task: string) => {
    setSelectedTasks(prev => 
      prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]
    );
  };

  const openInviteModal = (assistant: any) => {
    setSelectedAssistant(assistant);
    setSelectedTasks([]);
    setInviteModalVisible(true);
  };

  const handleSendInvite = async () => {
    if (!selectedAssistant) return;
    if (selectedTasks.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 loại công việc.');
      return;
    }
    if (!hireStart || !hireEnd) {
      Alert.alert('Lỗi', 'Vui lòng nhập ngày bắt đầu và kết thúc.');
      return;
    }
    try {
      setIsSubmitting(true);
      const startIso = hireStart.toISOString();
      const endIso = hireEnd.toISOString();
      
      await mangakaApi.createCollaborationInvite({
        assistantId: selectedAssistant.userId || selectedAssistant.id,
        hireStart: startIso,
        hireEnd: endIso,
        taskTypes: selectedTasks
      });
      
      Alert.alert('Thành công', 'Đã gửi lời mời cộng tác thành công!');
      setInviteModalVisible(false);
      setSelectedAssistant(null);
      setSelectedTasks([]);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể gửi lời mời.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchText]);

  const fetchAssistants = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const params: any = { limit: 20 };
      if (debouncedSearch && debouncedSearch.trim().length > 0) {
        params.q = debouncedSearch.trim();
      }
      
      const data = await mangakaApi.getAssistants(params);
      setAssistants(data?.items || data || []);
    } catch (error) {
      console.log('Error fetching assistants', error);
      if (!isRefresh) setAssistants([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchAssistants();
  }, [fetchAssistants]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}
      onPress={() => openInviteModal(item)}
    >
      <View style={styles.cardHeader}>
        <Avatar avatarKey={item.avatar} size={56} />
        <View style={styles.cardInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Typography variant="h3">{item.displayName}</Typography>
            {item.isRecommended && (
              <View style={[styles.badgeSmall, { backgroundColor: currentColors.primary + '20' }]}>
                <Typography variant="caption" color={currentColors.primary}>Đề xuất</Typography>
              </View>
            )}
          </View>
          <View style={styles.statsRow}>
            <Star size={14} color="#F59E0B" fill="#F59E0B" />
            <Typography variant="caption" color={currentColors.textSecondary}>
              {item.ratingAvg ? Number(item.ratingAvg).toFixed(1) : 'Chưa có đánh giá'}
            </Typography>
            <View style={[styles.dot, { backgroundColor: currentColors.border }]} />
            <Typography variant="caption" color={currentColors.textSecondary}>
              {item.experienceLevel || 'Chưa cập nhật'}
            </Typography>
          </View>
        </View>
      </View>
      
      {item.specializations && item.specializations.length > 0 && (
        <View style={styles.chipContainer}>
          {item.specializations.slice(0, 3).map((spec: string, idx: number) => (
            <View key={idx} style={[styles.chip, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}>
              <Typography variant="caption" color={currentColors.text}>{spec}</Typography>
            </View>
          ))}
          {item.specializations.length > 3 && (
            <View style={[styles.chip, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}>
              <Typography variant="caption" color={currentColors.text}>+{item.specializations.length - 3}</Typography>
            </View>
          )}
        </View>
      )}

      <Button 
        title="Mời cộng tác" 
        variant="outline" 
        style={{ marginTop: 16 }}
        onPress={() => openInviteModal(item)} 
      />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={[styles.searchBar, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
          <Search size={20} color={currentColors.textSecondary} />
          <RNTextInput
            style={[styles.searchInput, { color: currentColors.text }]}
            placeholder="Tìm kiếm trợ lý theo tên..."
            placeholderTextColor={currentColors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <XCircle size={20} color={currentColors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={currentColors.primary} />
      ) : (
        <FlatList
          data={assistants}
          keyExtractor={item => item.userId || item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAssistants(true)} tintColor={currentColors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Users size={48} color={currentColors.border} />
              <Typography style={{ textAlign: 'center', marginTop: 16 }} color={currentColors.textSecondary}>
                Không tìm thấy trợ lý nào.
              </Typography>
            </View>
          }
        />
      )}

      {/* Invite Modal */}
      <Modal visible={inviteModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: currentColors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Typography variant="h2">Mời cộng tác</Typography>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                <XCircle size={24} color={currentColors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedAssistant && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <Avatar avatarKey={selectedAssistant.avatar} size={40} />
                  <View>
                    <Typography variant="bodyBold">{selectedAssistant.displayName}</Typography>
                    <Typography variant="caption" color={currentColors.textSecondary}>Trợ lý</Typography>
                  </View>
                </View>
              )}

              <Typography variant="bodyBold" style={{ marginBottom: 8 }}>Thời gian thuê</Typography>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                <View style={{ flex: 1 }}>
                  <Typography variant="caption" color={currentColors.textSecondary} style={{ marginBottom: 8 }}>Bắt đầu</Typography>
                  {Platform.OS === 'ios' ? (
                    <DateTimePicker
                      value={hireStart}
                      mode="date"
                      display="default"
                      locale="vi-VN"
                      themeVariant={theme === 'dark' ? 'dark' : 'light'}
                      textColor={currentColors.text}
                      onChange={onChangeStart}
                      style={{ alignSelf: 'flex-start' }}
                    />
                  ) : (
                    <>
                      <TouchableOpacity 
                        style={{ height: 44, backgroundColor: currentColors.background, borderWidth: 1, borderColor: currentColors.border, borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center' }}
                        onPress={() => setShowStartPicker(true)}
                      >
                        <Typography variant="body">{hireStart.toLocaleDateString('vi-VN')}</Typography>
                      </TouchableOpacity>
                      {showStartPicker && (
                        <DateTimePicker
                          value={hireStart}
                          mode="date"
                          display="default"
                          onChange={onChangeStart}
                        />
                      )}
                    </>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="caption" color={currentColors.textSecondary} style={{ marginBottom: 8 }}>Kết thúc</Typography>
                  {Platform.OS === 'ios' ? (
                    <DateTimePicker
                      value={hireEnd}
                      mode="date"
                      display="default"
                      locale="vi-VN"
                      themeVariant={theme === 'dark' ? 'dark' : 'light'}
                      textColor={currentColors.text}
                      onChange={onChangeEnd}
                      style={{ alignSelf: 'flex-start' }}
                    />
                  ) : (
                    <>
                      <TouchableOpacity 
                        style={{ height: 44, backgroundColor: currentColors.background, borderWidth: 1, borderColor: currentColors.border, borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center' }}
                        onPress={() => setShowEndPicker(true)}
                      >
                        <Typography variant="body">{hireEnd.toLocaleDateString('vi-VN')}</Typography>
                      </TouchableOpacity>
                      {showEndPicker && (
                        <DateTimePicker
                          value={hireEnd}
                          mode="date"
                          display="default"
                          onChange={onChangeEnd}
                        />
                      )}
                    </>
                  )}
                </View>
              </View>

              <Typography variant="bodyBold" style={{ marginBottom: 8 }}>Loại công việc</Typography>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {TASK_OPTIONS.map(task => {
                  const isSelected = selectedTasks.includes(task);
                  return (
                    <TouchableOpacity 
                      key={task}
                      style={[
                        styles.chip, 
                        { backgroundColor: isSelected ? currentColors.primary : currentColors.background, borderColor: isSelected ? currentColors.primary : currentColors.border }
                      ]}
                      onPress={() => toggleTask(task)}
                    >
                      <Typography variant="caption" color={isSelected ? '#FFF' : currentColors.text}>{task}</Typography>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              <Button 
                title={isSubmitting ? "Đang gửi..." : "Gửi lời mời"} 
                onPress={handleSendInvite}
                disabled={isSubmitting}
                style={{ marginBottom: 30 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// --- TAB 2: INVITES ---
const InvitesTab = () => {
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const fetchInvites = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const data = await mangakaApi.getCollaborationInvites();
      setInvites(data?.items || data || []);
    } catch (error) {
      console.log('Error fetching invites', error);
      if (!isRefresh) setInvites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const handleCancel = (id: string) => {
    Alert.alert('Hủy lời mời', 'Bạn có chắc chắn muốn hủy lời mời này?', [
      { text: 'Đóng', style: 'cancel' },
      { 
        text: 'Hủy lời mời', 
        style: 'destructive',
        onPress: async () => {
          try {
            await mangakaApi.cancelInvite(id);
            fetchInvites(true);
          } catch (e) {
            Alert.alert('Lỗi', 'Không thể hủy lời mời.');
          }
        }
      }
    ]);
  };

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'PENDING': return { label: 'Chờ phản hồi', color: currentColors.warning, icon: <Clock size={14} color="#FFF" /> };
      case 'ACCEPTED': return { label: 'Đã chấp nhận', color: currentColors.success, icon: <CheckCircle size={14} color="#FFF" /> };
      case 'DECLINED': return { label: 'Đã từ chối', color: currentColors.error, icon: <XCircle size={14} color="#FFF" /> };
      case 'CANCELLED': return { label: 'Đã hủy', color: currentColors.textSecondary, icon: <Ban size={14} color="#FFF" /> };
      default: return { label: status, color: currentColors.textSecondary, icon: null };
    }
  };

  const filteredInvites = invites.filter(i => filter === 'ALL' ? true : i.status === filter);

  const renderItem = ({ item }: { item: any }) => {
    const statusData = getStatusDisplay(item.status);
    
    return (
      <View style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
        <View style={styles.cardHeader}>
          <Avatar avatarKey={item.assistant?.avatar} size={48} />
          <View style={styles.cardInfo}>
            <Typography variant="bodyBold">{item.assistant?.displayName || 'Trợ lý ẩn danh'}</Typography>
            <Typography variant="caption" color={currentColors.textSecondary}>Truyện: {item.series?.title || 'Không xác định'}</Typography>
          </View>
        </View>

        <View style={[styles.infoRow, { backgroundColor: currentColors.background }]}>
          <View style={styles.infoCol}>
            <Typography variant="caption" color={currentColors.textSecondary}>Trạng thái</Typography>
            <View style={[styles.statusBadge, { backgroundColor: statusData.color }]}>
              {statusData.icon}
              <Typography variant="caption" color="#FFF" style={{ marginLeft: 4 }}>{statusData.label}</Typography>
            </View>
          </View>
          <View style={styles.infoCol}>
            <Typography variant="caption" color={currentColors.textSecondary}>Thời gian</Typography>
            <Typography variant="caption">
              {new Date(item.hireStart).toLocaleDateString('vi-VN')} - {new Date(item.hireEnd).toLocaleDateString('vi-VN')}
            </Typography>
          </View>
        </View>

        {item.taskTypes && item.taskTypes.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Typography variant="caption" color={currentColors.textSecondary} style={{ marginBottom: 4 }}>Công việc:</Typography>
            <View style={styles.chipContainer}>
              {item.taskTypes.map((task: string, idx: number) => (
                <View key={idx} style={[styles.chip, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}>
                  <Typography variant="caption" color={currentColors.text}>{task}</Typography>
                </View>
              ))}
            </View>
          </View>
        )}

        {item.status === 'PENDING' && (
          <Button 
            title="Hủy lời mời" 
            variant="outline" 
            style={{ marginTop: 16, borderColor: currentColors.error }}
            textStyle={{ color: currentColors.error }}
            onPress={() => handleCancel(item.id)} 
          />
        )}
      </View>
    );
  };

  const filters = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PENDING', label: 'Chờ phản hồi' },
    { id: 'ACCEPTED', label: 'Đã chấp nhận' },
    { id: 'DECLINED', label: 'Đã từ chối' },
    { id: 'CANCELLED', label: 'Đã hủy' }
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingVertical: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {filters.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.filterChip, 
                { borderColor: currentColors.border },
                filter === f.id && { backgroundColor: currentColors.primary, borderColor: currentColors.primary }
              ]}
              onPress={() => setFilter(f.id)}
            >
              <Typography variant="caption" color={filter === f.id ? '#FFF' : currentColors.textSecondary}>{f.label}</Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={currentColors.primary} />
      ) : (
        <FlatList
          data={filteredInvites}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchInvites(true)} tintColor={currentColors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Mail size={48} color={currentColors.border} />
              <Typography style={{ textAlign: 'center', marginTop: 16 }} color={currentColors.textSecondary}>
                Chưa có lời mời nào.
              </Typography>
            </View>
          }
        />
      )}


    </View>
  );
};

// --- TAB 3: ASSIGNMENTS ---
const AssignmentsTab = () => {
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const fetchAssignments = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const data = await mangakaApi.getStudioAssignments();
      setAssignments(data?.items || data || []);
    } catch (error) {
      console.log('Error fetching assignments', error);
      if (!isRefresh) setAssignments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleTerminate = (id: string) => {
    // A full implementation would use a Modal for reason input, but Alert.prompt is iOS only
    // So we'll show a simple alert for now that uses a default reason, or a custom modal
    Alert.alert('Chấm dứt cộng tác', 'Bạn có chắc chắn muốn chấm dứt cộng tác với trợ lý này?', [
      { text: 'Đóng', style: 'cancel' },
      { 
        text: 'Chấm dứt', 
        style: 'destructive',
        onPress: async () => {
          try {
            await mangakaApi.terminateAssignment(id, 'Yêu cầu từ Mangaka');
            fetchAssignments(true);
          } catch (e) {
            Alert.alert('Lỗi', 'Không thể chấm dứt cộng tác.');
          }
        }
      }
    ]);
  };

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'ACTIVE': return { label: 'Đang hoạt động', color: currentColors.success };
      case 'COMPLETED': return { label: 'Đã hoàn thành', color: currentColors.textSecondary };
      case 'TERMINATED': return { label: 'Đã chấm dứt', color: currentColors.error };
      default: return { label: status, color: currentColors.textSecondary };
    }
  };

  const filteredAssignments = assignments.filter(i => filter === 'ALL' ? true : i.status === filter);

  const renderItem = ({ item }: { item: any }) => {
    const statusData = getStatusDisplay(item.status);
    const isExpired = new Date() > new Date(item.hireEnd);
    
    return (
      <View style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
        <View style={styles.cardHeader}>
          <Avatar avatarKey={item.assistant?.avatar} size={48} />
          <View style={styles.cardInfo}>
            <Typography variant="bodyBold">{item.assistant?.displayName || 'Trợ lý ẩn danh'}</Typography>
            <Typography variant="caption" color={currentColors.textSecondary}>Truyện: {item.series?.title || 'Không xác định'}</Typography>
          </View>
        </View>

        <View style={[styles.infoRow, { backgroundColor: currentColors.background }]}>
          <View style={styles.infoCol}>
            <Typography variant="caption" color={currentColors.textSecondary}>Trạng thái</Typography>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <View style={[styles.statusDot, { backgroundColor: statusData.color }]} />
              <Typography variant="caption" color={statusData.color}>{statusData.label}</Typography>
            </View>
          </View>
          <View style={styles.infoCol}>
            <Typography variant="caption" color={currentColors.textSecondary}>Thời hạn</Typography>
            <Typography variant="caption" color={isExpired && item.status === 'ACTIVE' ? currentColors.error : currentColors.text}>
              {new Date(item.hireEnd).toLocaleDateString('vi-VN')} {isExpired && item.status === 'ACTIVE' ? '(Hết hạn)' : ''}
            </Typography>
          </View>
        </View>

        {item.status === 'ACTIVE' && (
          <Button 
            title="Chấm dứt cộng tác" 
            variant="outline" 
            style={{ marginTop: 16, borderColor: currentColors.error }}
            textStyle={{ color: currentColors.error }}
            onPress={() => handleTerminate(item.id)} 
          />
        )}
      </View>
    );
  };

  const filters = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'ACTIVE', label: 'Đang hoạt động' },
    { id: 'COMPLETED', label: 'Đã hoàn thành' },
    { id: 'TERMINATED', label: 'Đã chấm dứt' }
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingVertical: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {filters.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.filterChip, 
                { borderColor: currentColors.border },
                filter === f.id && { backgroundColor: currentColors.primary, borderColor: currentColors.primary }
              ]}
              onPress={() => setFilter(f.id)}
            >
              <Typography variant="caption" color={filter === f.id ? '#FFF' : currentColors.textSecondary}>{f.label}</Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={currentColors.primary} />
      ) : (
        <FlatList
          data={filteredAssignments}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAssignments(true)} tintColor={currentColors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Briefcase size={48} color={currentColors.border} />
              <Typography style={{ textAlign: 'center', marginTop: 16 }} color={currentColors.textSecondary}>
                Chưa có cộng tác nào.
              </Typography>
            </View>
          }
        />
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  content: { flex: 1 },
  list: { padding: 16, gap: 16, paddingBottom: 80 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 32
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  cardInfo: {
    flex: 1,
    gap: 4
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%'
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    gap: 16
  },
  infoCol: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start'
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  }
});
