import React from 'react';
import { Text, TextProps } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface TypographyProps extends TextProps {
  variant?: keyof typeof typography.sizes;
  font?: keyof typeof typography.fonts;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  font = 'body',
  color,
  align = 'left',
  style,
  children,
  ...rest
}) => {
  const { theme } = useThemeStore();
  const currentColors = colors[theme];

  return (
    <Text
      style={[
        {
          fontFamily: typography.fonts[font],
          fontSize: typography.sizes[variant],
          color: color || currentColors.text,
          textAlign: align,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};
