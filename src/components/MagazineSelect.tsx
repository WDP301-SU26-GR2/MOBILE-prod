import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, ChevronDown, Search, X } from 'lucide-react-native';
import { PublicationType } from '../api/public';
import { colors } from '../theme/colors';
import { useThemeStore } from '../store/useThemeStore';
import { TextInput } from './TextInput';
import { Typography } from './Typography';

export interface MagazineOption {
  magazine: string;
  publicationType: PublicationType;
}

interface MagazineSelectProps {
  options: MagazineOption[];
  value: string;
  publicationType: PublicationType;
  loading?: boolean;
  onSelect: (option: MagazineOption) => void;
}

const TYPE_LABELS: Record<PublicationType, string> = {
  WEEKLY: 'Hàng tuần',
  MONTHLY: 'Hàng tháng',
  IRREGULAR: 'Không định kỳ',
};

export function MagazineSelect({
  options,
  value,
  publicationType,
  loading = false,
  onSelect,
}: MagazineSelectProps) {
  const theme = useThemeStore((state) => state.theme);
  const currentColors = colors[theme];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi');
    if (!normalized) return options;
    return options.filter((option) => (
      option.magazine.toLocaleLowerCase('vi').includes(normalized)
      || TYPE_LABELS[option.publicationType].toLocaleLowerCase('vi').includes(normalized)
    ));
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <View>
        <Typography variant="label" color={currentColors.textSecondary} style={styles.label}>
          TẠP CHÍ
        </Typography>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Tạp chí, ${value || 'chưa chọn'}`}
          accessibilityHint="Mở danh sách tạp chí"
          activeOpacity={0.75}
          disabled={loading}
          onPress={() => setOpen(true)}
          style={[
            styles.trigger,
            {
              backgroundColor: currentColors.background,
              borderColor: currentColors.border,
            },
          ]}
        >
          <View style={styles.triggerCopy}>
            <Typography
              variant="bodyMedium"
              color={value ? currentColors.text : currentColors.textSecondary}
              numberOfLines={1}
            >
              {loading ? 'Đang tải tạp chí…' : value || 'Chọn tạp chí'}
            </Typography>
            {!!value && (
              <Typography variant="caption" color={currentColors.textSecondary}>
                {TYPE_LABELS[publicationType]}
              </Typography>
            )}
          </View>
          <ChevronDown size={20} color={currentColors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={close}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng danh sách tạp chí"
            onPress={close}
            style={styles.backdrop}
          />
          <SafeAreaView style={[styles.sheet, { backgroundColor: currentColors.surface }]}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitle}>
                <Typography variant="h3">Chọn tạp chí</Typography>
                <Typography variant="caption" color={currentColors.textSecondary}>
                  Danh sách được đồng bộ từ hệ thống
                </Typography>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                onPress={close}
                style={[styles.closeButton, { backgroundColor: currentColors.background }]}
              >
                <X size={20} color={currentColors.text} />
              </TouchableOpacity>
            </View>

            {options.length > 6 && (
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Tìm tạp chí"
                leftIcon={<Search size={18} color={currentColors.textSecondary} />}
                autoCapitalize="none"
                returnKeyType="search"
              />
            )}

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => `${item.magazine}-${item.publicationType}`}
              contentContainerStyle={styles.optionList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const selected = item.magazine === value && item.publicationType === publicationType;
                return (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      onSelect(item);
                      close();
                    }}
                    style={[
                      styles.option,
                      { borderColor: currentColors.border, backgroundColor: currentColors.background },
                      selected && { borderColor: currentColors.primary, backgroundColor: `${currentColors.primary}12` },
                    ]}
                  >
                    <View style={styles.optionCopy}>
                      <Typography variant="bodyBold" numberOfLines={1}>{item.magazine}</Typography>
                      <Typography variant="caption" color={currentColors.textSecondary}>
                        {TYPE_LABELS[item.publicationType]}
                      </Typography>
                    </View>
                    <View
                      style={[
                        styles.check,
                        { borderColor: selected ? currentColors.primary : currentColors.border },
                        selected && { backgroundColor: currentColors.primary },
                      ]}
                    >
                      {selected && <Check size={15} color={currentColors.primaryForeground} strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={(
                <View style={styles.empty}>
                  <Typography variant="bodyBold">Không tìm thấy tạp chí</Typography>
                  <Typography variant="caption" color={currentColors.textSecondary} align="center">
                    Thử từ khóa khác hoặc tải lại dữ liệu.
                  </Typography>
                </View>
              )}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 6 },
  trigger: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  triggerCopy: { flex: 1, gap: 2 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(16, 24, 40, 0.62)',
  },
  sheet: {
    maxHeight: '78%',
    minHeight: 320,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#98A2B3',
    opacity: 0.65,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  sheetTitle: { flex: 1, gap: 2 },
  closeButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  optionList: { gap: 8, paddingBottom: 20 },
  option: {
    minHeight: 66,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionCopy: { flex: 1, gap: 3 },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { paddingVertical: 48, paddingHorizontal: 24, alignItems: 'center', gap: 6 },
});
