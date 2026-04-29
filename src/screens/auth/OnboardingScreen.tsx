import React, { useState, useRef, useEffect } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
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

const TOTAL_STEPS = 1 + FEATURE_SLIDES.length; // language + 3 features

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState(0);
  const [selectedLang, setSelectedLang] = useState('uz-latn');
  const opacity = useRef(new Animated.Value(1)).current;
  const isFirst = useRef(true);

  const selectedLanguage = LANGUAGES.find((l) => l.id === selectedLang)!;

  // Fade in whenever step changes (skip the very first mount)
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [step]);

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
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.slideContainer, { opacity }]}>
        {isLanguageStep ? (
          <View style={styles.langSlide}>
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
          </View>
        ) : (
          <LinearGradient colors={featureSlide!.gradient} style={styles.featureSlide}>
            <View style={styles.featureContent}>
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
      </Animated.View>

      {/* Footer: always visible */}
      <View style={styles.footer}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },

  slideContainer: { flex: 1 },

  // Language slide
  langSlide: { flex: 1, backgroundColor: colors.canvas },
  langHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
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

  // Feature slides
  featureSlide: { flex: 1 },
  featureContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl },
  featureEmoji: { fontSize: 80 },

  // Footer
  footer: {
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.borderMid },
  dotActive: { width: 20, backgroundColor: colors.primary },
  skipBtn: { alignItems: 'center', paddingVertical: spacing.xs },
});
