import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, TouchableOpacityProps, View } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { colors } from '../theme/colors';
import { Typography } from './Typography';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'inverted' | 'outlined';
  title: string;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  title,
  loading = false,
  icon,
  style,
  disabled,
  ...rest
}) => {
  const { theme } = useThemeStore();
  const currentColors = colors[theme];

  const getBackgroundColor = () => {
    if (disabled) return currentColors.border;
    switch (variant) {
      case 'primary': return currentColors.primary;
      case 'secondary': return currentColors.secondary;
      case 'inverted': return currentColors.text;
      case 'outlined': return 'transparent';
      default: return currentColors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return currentColors.textSecondary;
    switch (variant) {
      case 'primary': return '#FFFFFF';
      case 'secondary': return '#FFFFFF';
      case 'inverted': return currentColors.background;
      case 'outlined': return currentColors.text;
      default: return '#FFFFFF';
    }
  };

  const getBorderColor = () => {
    if (variant === 'outlined') return currentColors.border;
    return 'transparent';
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outlined' ? 1 : 0,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Typography variant="bodyMedium" font="bodyMedium" style={{ color: getTextColor() }}>
            {title}
          </Typography>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
});
