import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography } from '../../../components/Typography';
import { TextInput } from '../../../components/TextInput';
import { Button } from '../../../components/Button';
import { mangakaApi } from '../../../api/mangaka';
import { colors } from '../../../theme/colors';
import { useThemeStore } from '../../../store/useThemeStore';
import { UploadCloud, CheckCircle } from 'lucide-react-native';

export default function CreateProposal() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    synopsis: string;
    genres: string[];
    demographic: string;
    estimatedLength: string;
  }>({
    title: '',
    synopsis: '',
    genres: [],
    demographic: 'SHONEN',
    estimatedLength: ''
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await mangakaApi.createProposal(formData);
      Alert.alert('Thành công', 'Đã lưu bản nháp đề xuất!');
      router.back();
    } catch (e: any) {
      console.log('Error creating proposal', e);
      const errRes = e.response?.data;
      if (errRes?.code === 'Error.ValidationFailed' && errRes.errors) {
        const newErrors: Record<string, string> = {};
        errRes.errors.forEach((err: any) => {
          if (err.path) newErrors[err.path] = err.message;
        });
        setFieldErrors(newErrors);
        setStep(1); // Quay lại bước 1 nếu có lỗi form
      } else {
        Alert.alert('Lỗi', errRes?.message || 'Tạo đề xuất thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <View style={[styles.header, { borderBottomColor: currentColors.border }]}>
          <Typography variant="h2">Tạo Đề Xuất Mới</Typography>
          <Typography variant="caption" color={currentColors.textSecondary}>Bước {step} / 4</Typography>
        </View>

        <ScrollView style={styles.content}>
          {step === 1 && (
            <View>
              <Typography variant="h3" style={styles.stepTitle}>1. Thông tin chung</Typography>
              <TextInput
                label="Tên truyện"
                value={formData.title}
                error={fieldErrors.title}
                onChangeText={(text) => {
                  setFormData({ ...formData, title: text });
                  if (fieldErrors.title) setFieldErrors(prev => ({ ...prev, title: '' }));
                }}
                placeholder="Nhập tên truyện..."
              />
              <TextInput
                label="Tóm tắt"
                value={formData.synopsis}
                error={fieldErrors.synopsis}
                onChangeText={(text) => {
                  setFormData({ ...formData, synopsis: text });
                  if (fieldErrors.synopsis) setFieldErrors(prev => ({ ...prev, synopsis: '' }));
                }}
                placeholder="Tóm tắt ngắn gọn..."
                multiline
                style={{ height: 100 }}
              />
              <Typography variant="bodyBold" style={{ marginTop: 16, marginBottom: 8 }}>Thể loại (Genres)</Typography>
              <View style={styles.chipRow}>
                {['Action', 'Fantasy', 'Romance', 'Sci-Fi'].map(g => (
                  <TouchableOpacity 
                    key={g} 
                    style={[
                      styles.chip, 
                      { backgroundColor: currentColors.border },
                      formData.genres.includes(g) && { backgroundColor: currentColors.primary }
                    ]}
                    onPress={() => {
                      if(formData.genres.includes(g)) setFormData({...formData, genres: formData.genres.filter(x => x !== g)});
                      else setFormData({...formData, genres: [...formData.genres, g]});
                    }}
                  >
                    <Typography variant="caption" color={formData.genres.includes(g) ? '#fff' : currentColors.textSecondary}>{g}</Typography>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                label="Đối tượng (Demographic)"
                value={formData.demographic}
                error={fieldErrors.demographic}
                onChangeText={(text) => {
                  setFormData({ ...formData, demographic: text });
                  if (fieldErrors.demographic) setFieldErrors(prev => ({ ...prev, demographic: '' }));
                }}
                placeholder="SHONEN, SHOJO, SEINEN..."
                style={{ marginTop: 16 }}
              />
            </View>
          )}

          {step === 2 && (
            <View>
              <Typography variant="h3" style={styles.stepTitle}>2. Ảnh bìa & Thiết kế nhân vật</Typography>
              <TouchableOpacity style={[styles.uploadBox, { borderColor: currentColors.border }]}>
                <UploadCloud color={currentColors.textSecondary} size={32} />
                <Typography variant="caption" color={currentColors.textSecondary} style={{ marginTop: 8 }}>Chọn ảnh bìa</Typography>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View>
              <Typography variant="h3" style={styles.stepTitle}>3. Bản nháp (Name Draft - Tùy chọn)</Typography>
              <TouchableOpacity style={[styles.uploadBox, { borderColor: currentColors.border }]}>
                <UploadCloud color={currentColors.textSecondary} size={32} />
                <Typography variant="caption" color={currentColors.textSecondary} style={{ marginTop: 8 }}>Tải lên các trang nháp</Typography>
              </TouchableOpacity>
            </View>
          )}

          {step === 4 && (
            <View>
              <Typography variant="h3" style={styles.stepTitle}>4. Xem lại & Nộp</Typography>
              <Typography variant="bodyBold">Tên truyện:</Typography>
              <Typography variant="body" style={styles.previewText}>{formData.title || '(Chưa nhập)'}</Typography>
              
              <Typography variant="bodyBold">Tóm tắt:</Typography>
              <Typography variant="body" style={styles.previewText}>{formData.synopsis || '(Chưa nhập)'}</Typography>
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: currentColors.border }]}>
          {step > 1 ? (
            <Button title="Quay lại" variant="outlined" onPress={handlePrev} style={styles.footerBtn} />
          ) : <View style={styles.footerBtn} />}
          
          {step < 4 ? (
            <Button title="Tiếp tục" onPress={handleNext} style={styles.footerBtn} />
          ) : (
            <Button title="Lưu Nháp" onPress={handleSubmit} loading={loading} style={styles.footerBtn} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  content: { flex: 1, padding: 16 },
  stepTitle: { marginBottom: 16 },
  previewText: { marginBottom: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  uploadBox: {
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center'
  },
  footer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, justifyContent: 'space-between', gap: 16 },
  footerBtn: { flex: 1 }
});
