import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme';

interface Props {
  style?: ViewStyle;
  inset?: number;
}

export const Divider: React.FC<Props> = ({ style, inset = 0 }) => (
  <View style={[styles.divider, { marginHorizontal: inset }, style]} />
);

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
});
