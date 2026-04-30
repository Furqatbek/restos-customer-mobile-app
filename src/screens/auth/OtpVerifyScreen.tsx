import React, { useState, useRef, useEffect } from 'react';
import {
  View, StyleSheet, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/types';
import { Text } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { verifyOtp, saveTokens, requestOtp } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, typography } from '../../theme';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'OtpVerify'>;
  route: RouteProp<AuthStackParamList, 'OtpVerify'>;
};

const OTP_LENGTH = 6;

export const OtpVerifyScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phoneNumber, firstName, lastName } = route.params;
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const inputRef = useRef<TextInput>(null);
  const setCustomer = useAuthStore((s) => s.setCustomer);

  useEffect(() => {
    inputRef.current?.focus();
    const timer = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const otp = digits.join('');

  const handleInput = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setDigits(cleaned.split('').concat(Array(OTP_LENGTH - cleaned.length).fill('')));
    setError('');
    if (cleaned.length === OTP_LENGTH) handleVerify(cleaned);
  };

  const handleVerify = async (code = otp) => {
    if (code.length < OTP_LENGTH) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await verifyOtp({ phoneNumber, otp: code });
      await saveTokens(data);
      setCustomer(data.customer);
      navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Invalid code. Please try again.');
      setDigits(Array(OTP_LENGTH).fill(''));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await requestOtp({ phoneNumber, firstName, lastName });
      setCountdown(60);
      setError('');
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.content}>
          {/* Back */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text variant="bodyMed" color={colors.primary}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text variant="h2">Check your phone</Text>
            <Text variant="body" color={colors.inkSub} style={{ marginTop: 8 }}>
              We sent a 6-digit code to{'\n'}
              <Text variant="bodyMed" color={colors.ink}>{phoneNumber}</Text>
            </Text>
          </View>

          {/* Hidden input collects all digits */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={otp}
            onChangeText={handleInput}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
          />

          {/* Visual digit boxes */}
          <TouchableOpacity onPress={() => inputRef.current?.focus()} activeOpacity={1}>
            <View style={styles.boxes}>
              {digits.map((d, i) => (
                <View key={i} style={[styles.box, d ? styles.boxFilled : null, i === otp.length && styles.boxActive]}>
                  <Text variant="h2" color={d ? colors.ink : colors.inkPlaceholder}>{d || '·'}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>

          {error ? <Text variant="bodySm" color={colors.error} align="center">{error}</Text> : null}

          <Button
            label="Verify"
            onPress={() => handleVerify()}
            loading={loading}
            disabled={otp.length < OTP_LENGTH}
            fullWidth
          />

          <View style={styles.resend}>
            <Text variant="body" color={colors.inkSub}>Didn't get a code? </Text>
            <TouchableOpacity onPress={handleResend} disabled={countdown > 0}>
              <Text variant="bodyMed" color={countdown > 0 ? colors.inkSub : colors.primary}>
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  content: { flex: 1, padding: spacing.xl, gap: spacing.xl },
  back: { paddingVertical: spacing.sm },
  header: { gap: 4 },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  boxes: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  box: {
    width: 48,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: { borderColor: colors.primary, backgroundColor: '#FFF5F5' },
  boxActive: { borderColor: colors.primary, borderWidth: 2 },
  resend: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.sm },
});
