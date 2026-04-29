import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './Text';
import { colors, radius, spacing } from '../../theme';

type Variant = 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'accent';

interface Props {
  label: string;
  variant?: Variant;
  style?: ViewStyle;
}

const variantColors: Record<Variant, { bg: string; text: string }> = {
  primary: { bg: colors.primary, text: colors.white },
  success: { bg: colors.successBg, text: colors.success },
  warning: { bg: colors.warningBg, text: colors.warning },
  error:   { bg: colors.errorBg, text: colors.error },
  neutral: { bg: colors.canvasAlt, text: colors.inkMid },
  accent:  { bg: colors.accent, text: colors.white },
};

export const Badge: React.FC<Props> = ({ label, variant = 'neutral', style }) => {
  const { bg, text } = variantColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text variant="tag" color={text}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 1,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
});
