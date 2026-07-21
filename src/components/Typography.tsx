import React from 'react';
import { Text, TextProps } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type TypographyVariant = keyof typeof typography.sizes | 'caption' | 'bodyMedium' | 'bodyBold';

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
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

  const fontSize = typography.sizes[
    variant === 'caption' ? 'label' : variant === 'bodyMedium' || variant === 'bodyBold' ? 'body' : variant
  ];

  return (
    <Text
      style={[
        {
          fontFamily: typography.fonts[font],
          fontSize,
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
