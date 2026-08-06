import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { colors } from '../theme/colors';
import { useThemeStore } from '../store/useThemeStore';

export const WebOnlyBanner = ({ message }: { message: string }) => {
  const theme = useThemeStore((state: any) => state.theme) as 'light' | 'dark';
  const currentColors = colors[theme];
  return (
    <View style={[styles.container, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
      <Typography variant="caption" style={{ color: currentColors.textSecondary, textAlign: 'center' }}>
        {message}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
