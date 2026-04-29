import React, { useState } from 'react';
import { View, TextInput, TextInputProps, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Text } from './Text';
import { colors, radius, spacing, typography } from '../../theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<Props> = ({
  label,
  error,
  hint,
  prefix,
  suffix,
  containerStyle,
  style,
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text variant="label" color={colors.inkMid} style={styles.label}>{label}</Text>}
      <View style={[styles.inputRow, focused && styles.focused, error ? styles.errored : null]}>
        {prefix && <View style={styles.adornment}>{prefix}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.inkPlaceholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {suffix && <View style={styles.adornment}>{suffix}</View>}
      </View>
      {error
        ? <Text variant="caption" color={colors.error} style={styles.hint}>{error}</Text>
        : hint
        ? <Text variant="caption" color={colors.inkSub} style={styles.hint}>{hint}</Text>
        : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { marginBottom: spacing.xxs },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    height: 52,
  },
  focused: { borderColor: colors.primary, backgroundColor: colors.white },
  errored: { borderColor: colors.error },
  input: {
    flex: 1,
    fontFamily: typography.sans,
    fontSize: typography.base,
    color: colors.ink,
  },
  adornment: { marginHorizontal: spacing.xs },
  hint: { marginTop: spacing.xxs },
});
