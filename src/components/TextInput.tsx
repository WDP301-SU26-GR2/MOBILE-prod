import React, { useState } from 'react';
import { View, TextInput as RNTextInput, TextInputProps as RNTextInputProps, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Typography } from './Typography';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const { theme } = useThemeStore();
  const currentColors = colors[theme];
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <Typography variant="label" font="label" color={currentColors.textSecondary} style={styles.label}>
          {label}
        </Typography>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: currentColors.surface,
            borderColor: error ? currentColors.error : isFocused ? currentColors.primary : currentColors.border,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <RNTextInput
          style={[
            styles.input,
            {
              color: currentColors.text,
              fontFamily: typography.fonts.body,
              fontSize: typography.sizes.body,
            },
            style,
          ]}
          placeholderTextColor={currentColors.textSecondary}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus && onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur && onBlur(e);
          }}
          {...rest}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && (
        <Typography variant="label" font="label" color={currentColors.error} style={styles.error}>
          {error}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: '100%',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  error: {
    marginTop: 4,
  },
});
