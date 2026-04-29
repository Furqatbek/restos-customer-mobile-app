import React, { useState, useRef } from 'react';
import {
  View, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { Text } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { colors, spacing, radius } from '../../theme';

type Props = { navigation: StackNavigationProp<AuthStackParamList, 'Onboarding'> };

const { width } = Dimensions.get('window');

const LANGUAGES = [
  { id: 'uz-latn', flag: '🇺🇿', native: "O'zbek tili",   script: 'Lotin' },
  { id: 'uz-cyrl', flag: '🇺🇿', native: 'Ўзбек тили',    script: 'Кирилл' },
  { id: 'ru',      flag: '🇷🇺', native: 'Русский язык',   script: '' },
  { id: 'kaa',     flag: '🇺🇿', native: 'Қарақалпақша',  script: '' },
];

const SLIDES = [
  {
    id: 'language',
    type: 'language',
  },
  {
    id: 'order',
    type: 'feature',
    emoji: '🍽️',
    title: 'Fine dining,\nat your door',
    body: 'Restaurant-quality meals crafted with care — delivered hot, right to you.',
    gradient: ['#2D0A0A', '#8B1A1A'] as [string, string],
  },
  {
    id: 'track',
    type: 'feature',
    emoji: '📍',
    title: 'Live tracking,\nreal comfort',
    body: 'Watch your order journey from the kitchen to your hands, step by step.',
    gradient: ['#1A2A0A', '#3D5C1A'] as [string, string],
  },
  {
    id: 'rewards',
    type: 'feature',
    emoji: '✨',
    title: 'Earn with\nevery order',
    body: 'Loyalty points, tier upgrades, and rewards that celebrate you.',
    gradient: ['#2A1A0A', '#8B5C1A'] as [string, string],
  },
];

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState(0);
  const [selectedLang, setSelectedLang] = useState('uz-latn');
  const scrollRef = useRef<ScrollView>(null);

  const selectedLanguage = LANGUAGES.find((l) => l.id === selectedLang)!;

  const goNext = () => {
    if (step < SLIDES.length - 1) {
      const next = step + 1;
      setStep(next);
      scrollRef.current?.scrollTo({ x: width * next, animated: true });
    } else {
      navigation.replace('Login');
    }
  };

  const ctaLabel =
    step === 0
      ? `Continue in ${selectedLanguage.native}`
      : step === SLIDES.length - 1
      ? 'Get Started'
      : 'Continue';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.pager}
      >
        {SLIDES.map((slide, idx) => {
          if (slide.type === 'language') {
            return (
              <View key={slide.id} style={[styles.slide, { backgroundColor: colors.canvas }]}>
                <View style={styles.langHeader}>
                  <Text variant="h2" align="center">Choose your language</Text>
                  <Text variant="bodySm" color={colors.inkSub} align="center" style={{ marginTop: 4 }}>
                    Select the language you'd like to use
                  </Text>
                </View>
                <View style={styles.langGrid}>
                  {LANGUAGES.map((lang) => {
                    const selected = selectedLang === lang.id;
                    return (
                      <TouchableOpacity
                        key={lang.id}
                        style={[styles.langCard, selected && styles.langCardSelected]}
                        onPress={() => setSelectedLang(lang.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.flag}>{lang.flag}</Text>
                        <Text variant="bodyMed" color={selected ? colors.primary : colors.ink} style={{ flex: 1 }}>
                          {lang.native}
                        </Text>
                        {lang.script ? (
                          <Text variant="caption" color={colors.inkSub}>{lang.script}</Text>
                        ) : null}
                        {selected && (
                          <View style={styles.checkmark}><Text color={colors.white}>✓</Text></View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          }

          return (
            <LinearGradient
              key={slide.id}
              colors={slide.gradient!}
              style={styles.slide}
            >
              <View style={styles.featureContent}>
                <Text style={styles.featureEmoji}>{slide.emoji}</Text>
                <Text variant="h1" color={colors.white} align="center" style={{ marginTop: 24 }}>
                  {slide.title}
                </Text>
                <Text variant="body" color="rgba(255,255,255,0.7)" align="center" style={{ marginTop: 12 }}>
                  {slide.body}
                </Text>
              </View>
            </LinearGradient>
          );
        })}
      </ScrollView>

      {/* Dots + CTA */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
        <Button label={ctaLabel} onPress={goNext} fullWidth />
        {step > 0 && (
          <TouchableOpacity onPress={() => navigation.replace('Login')} style={{ marginTop: 12 }}>
            <Text variant="bodySm" color={colors.inkSub} align="center">Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  pager: { flex: 1 },
  slide: { width, flex: 1 },

  // Language slide
  langHeader: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.lg, gap: 4 },
  langGrid: { paddingHorizontal: spacing.lg, paddingBottom: 20, gap: 8, marginTop: spacing.sm },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  langCardSelected: { borderColor: colors.primary, backgroundColor: '#FFF5F5' },
  flag: { fontSize: 28 },
  checkmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Feature slides
  featureContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl },
  featureEmoji: { fontSize: 80 },

  // Footer
  footer: { padding: spacing.xl, paddingBottom: spacing.xxl, gap: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.borderMid },
  dotActive: { width: 20, backgroundColor: colors.primary },
});
