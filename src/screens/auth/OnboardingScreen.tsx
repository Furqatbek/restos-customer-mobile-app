import React, { useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { Text } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { colors, spacing, radius } from '../../theme';

type Props = { navigation: StackNavigationProp<AuthStackParamList, 'Onboarding'> };

const LANGUAGES = [
  { id: 'uz-latn', flag: '🇺🇿', native: "O'zbek tili",  script: 'Lotin' },
  { id: 'uz-cyrl', flag: '🇺🇿', native: 'Ўзбек тили',   script: 'Кирилл' },
  { id: 'ru',      flag: '🇷🇺', native: 'Русский язык',  script: '' },
  { id: 'kaa',     flag: '🇺🇿', native: 'Қарақалпақша', script: '' },
];

const FEATURE_SLIDES = [
  {
    id: 'order',
    emoji: '🍽️',
    title: 'Fine dining,\nat your door',
    body: 'Restaurant-quality meals crafted with care — delivered hot, right to you.',
    gradient: ['#2D0A0A', '#8B1A1A'] as [string, string],
  },
  {
    id: 'track',
    emoji: '📍',
    title: 'Live tracking,\nreal comfort',
    body: 'Watch your order journey from the kitchen to your hands, step by step.',
    gradient: ['#1A2A0A', '#3D5C1A'] as [string, string],
  },
  {
    id: 'rewards',
    emoji: '✨',
    title: 'Earn with\nevery order',
    body: 'Loyalty points, tier upgrades, and rewards that celebrate you.',
    gradient: ['#2A1A0A', '#8B5C1A'] as [string, string],
  },
];

const TOTAL_STEPS = 1 + FEATURE_SLIDES.length;
const FOOTER_HEIGHT = 180;

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState(0);
  const [selectedLang, setSelectedLang] = useState('uz-latn');
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  // On web, force the screen to fill the viewport — flex:1 on a navigator
  // screen doesn't work without an explicit pixel height.
  const rootSizing = Platform.OS === 'web'
    ? { height: windowHeight || 800 }
    : null;

  const selectedLanguage = LANGUAGES.find((l) => l.id === selectedLang)!;

  const goNext = () => {
    if (step >= TOTAL_STEPS - 1) {
      navigation.replace('Login');
      return;
    }
    setStep((s) => s + 1);
  };

  const ctaLabel =
    step === 0
      ? `Continue in ${selectedLanguage.native}`
      : step === TOTAL_STEPS - 1
      ? 'Get Started'
      : 'Continue';

  const isLanguageStep = step === 0;
  const featureSlide = isLanguageStep ? null : FEATURE_SLIDES[step - 1];

  return (
    <View style={[styles.root, rootSizing]}>
      {/* Slide content area — leaves room for the footer */}
      <View style={[styles.slideArea, { paddingBottom: FOOTER_HEIGHT + insets.bottom }]}>
        {isLanguageStep ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.langScroll, { paddingTop: insets.top + spacing.xl }]}
          >
            <View style={styles.langHeader}>
              <Text variant="h2" align="center">Tilni tanlang</Text>
              <Text variant="bodySm" color={colors.inkSub} align="center" style={{ marginTop: 4 }}>
                Choose your language
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
                      <Text variant="caption" color={colors.inkSub} style={styles.scriptBadge}>{lang.script}</Text>
                    ) : null}
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <LinearGradient colors={featureSlide!.gradient} style={styles.featureSlide}>
            <View style={[styles.featureContent, { paddingTop: insets.top + spacing.xxxl }]}>
              <Text style={styles.featureEmoji}>{featureSlide!.emoji}</Text>
              <Text variant="h1" color={colors.white} align="center" style={{ marginTop: 24 }}>
                {featureSlide!.title}
              </Text>
              <Text variant="body" color="rgba(255,255,255,0.7)" align="center" style={{ marginTop: 12 }}>
                {featureSlide!.body}
              </Text>
            </View>
          </LinearGradient>
        )}
      </View>

      {/* Footer absolutely pinned to bottom — always visible */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.dots}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
        <Button label={ctaLabel} onPress={goNext} fullWidth size="lg" />
        {step > 0 && (
          <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.skipBtn}>
            <Text variant="bodySm" color={colors.inkSub} align="center">Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  slideArea: { flex: 1 },

  langScroll: {
    paddingBottom: spacing.lg,
  },
  langHeader: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: 4,
  },
  langGrid: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  langCardSelected: { borderColor: colors.primary, backgroundColor: '#FFF5F5' },
  flag: { fontSize: 32 },
  scriptBadge: {
    backgroundColor: colors.canvasAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
    overflow: 'hidden',
    marginRight: spacing.xs,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

  featureSlide: { flex: 1 },
  featureContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl },
  featureEmoji: { fontSize: 80 },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.borderMid },
  dotActive: { width: 20, backgroundColor: colors.primary },
  skipBtn: { alignItems: 'center', paddingVertical: spacing.xs },
});
