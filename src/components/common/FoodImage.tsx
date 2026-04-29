import React from 'react';
import { View, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Text';
import { colors, radius } from '../../theme';

interface Props {
  imageUrl?: string | null;
  name: string;
  style?: ViewStyle;
  borderRadius?: number;
}

// Warm gradient placeholders when no real image is available
const gradients: [string, string][] = [
  ['#8B4513', '#D2691E'],
  ['#8B1A1A', '#C9963C'],
  ['#556B2F', '#8B7355'],
  ['#4A3728', '#8B6914'],
  ['#6B2D1A', '#C47F3C'],
];

export const FoodImage: React.FC<Props> = ({ imageUrl, name, style, borderRadius = radius.md }) => {
  const gradientIndex = name.length % gradients.length;
  const [from, to] = gradients[gradientIndex];

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, { borderRadius }, style as ImageStyle]}
        resizeMode="cover"
      />
    );
  }

  return (
    <LinearGradient
      colors={[from, to]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.image, { borderRadius }, style]}
    >
      <View style={styles.grain} />
      <Text variant="caption" color="rgba(255,255,255,0.7)" align="center" style={styles.label}>
        {name.toUpperCase()}
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  image: { overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' },
  grain: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
    backgroundColor: 'transparent',
  },
  label: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    letterSpacing: 0.5,
  },
});
