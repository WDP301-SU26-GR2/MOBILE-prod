import { Moon, Sun } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { colors } from '../theme/colors';

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const currentColors = colors[theme];
  const nextThemeLabel = theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối';
  const Icon = theme === 'dark' ? Sun : Moon;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={nextThemeLabel}
      accessibilityHint="Thay đổi màu giao diện của ứng dụng"
      activeOpacity={0.75}
      onPress={toggleTheme}
      style={[
        styles.button,
        compact && styles.compact,
        {
          backgroundColor: currentColors.background,
          borderColor: currentColors.border,
        },
      ]}
    >
      <Icon size={compact ? 19 : 20} color={currentColors.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});
