import React from 'react';
import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { colors, typography } from '../../theme';

type Variant =
  | 'display'   // 38px serif
  | 'h1'        // 30px serif
  | 'h2'        // 24px sans semibold
  | 'h3'        // 20px sans semibold
  | 'h4'        // 17px sans semibold
  | 'body'      // 15px sans regular
  | 'bodyMed'   // 15px sans medium
  | 'bodySm'    // 13px sans regular
  | 'caption'   // 11px sans regular
  | 'label'     // 13px sans medium
  | 'price'     // 17px sans bold
  | 'priceLg'   // 24px sans bold
  | 'tag';      // 11px sans semibold uppercase

const variantStyles: Record<Variant, TextStyle> = {
  display:  { fontFamily: typography.serif,  fontSize: typography.xxxl, fontWeight: typography.bold,     lineHeight: typography.xxxl * typography.tight },
  h1:       { fontFamily: typography.serif,  fontSize: typography.xxl,  fontWeight: typography.bold,     lineHeight: typography.xxl  * typography.tight },
  h2:       { fontFamily: typography.sans,   fontSize: typography.xl,   fontWeight: typography.semibold, lineHeight: typography.xl   * typography.normal },
  h3:       { fontFamily: typography.sans,   fontSize: typography.lg,   fontWeight: typography.semibold, lineHeight: typography.lg   * typography.normal },
  h4:       { fontFamily: typography.sans,   fontSize: typography.md,   fontWeight: typography.semibold, lineHeight: typography.md   * typography.normal },
  body:     { fontFamily: typography.sans,   fontSize: typography.base, fontWeight: typography.regular,  lineHeight: typography.base * typography.relaxed },
  bodyMed:  { fontFamily: typography.sans,   fontSize: typography.base, fontWeight: typography.medium,   lineHeight: typography.base * typography.relaxed },
  bodySm:   { fontFamily: typography.sans,   fontSize: typography.sm,   fontWeight: typography.regular,  lineHeight: typography.sm   * typography.relaxed },
  caption:  { fontFamily: typography.sans,   fontSize: typography.xs,   fontWeight: typography.regular,  lineHeight: typography.xs   * typography.relaxed },
  label:    { fontFamily: typography.sans,   fontSize: typography.sm,   fontWeight: typography.medium,   lineHeight: typography.sm   * typography.normal },
  price:    { fontFamily: typography.sans,   fontSize: typography.md,   fontWeight: typography.bold,     lineHeight: typography.md   * typography.normal },
  priceLg:  { fontFamily: typography.sans,   fontSize: typography.xl,   fontWeight: typography.bold,     lineHeight: typography.xl   * typography.tight },
  tag:      { fontFamily: typography.sans,   fontSize: typography.xs,   fontWeight: typography.semibold, lineHeight: typography.xs   * typography.normal, letterSpacing: 0.6, textTransform: 'uppercase' },
};

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  align?: TextStyle['textAlign'];
}

export const Text: React.FC<Props> = ({
  variant = 'body',
  color = colors.ink,
  align,
  style,
  ...props
}) => (
  <RNText
    style={[variantStyles[variant], { color }, align ? { textAlign: align } : null, style]}
    {...props}
  />
);
