import React, { useState } from 'react';
import {
  View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { Text } from '../../components/common/Text';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { requestOtp } from '../../api/auth';
import { colors, spacing, radius } from '../../theme';

type Props = { navigation: StackNavigationProp<AuthStackParamList, 'Login'> };

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = phone.length >= 9 && firstName.length >= 1;

  const handleSendCode = async () => {
    if (!isValid) return;
    setError('');
    setLoading(true);
    try {
      await requestOtp({ phoneNumber: phone, firstName, lastName });
      navigation.navigate('OtpVerify', { phoneNumber: phone, firstName, lastName });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to send code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header gradient */}
      <LinearGradient colors={['#8B1A1A', '#C9963C']} style={styles.header}>
        <View style={styles.logoMark}>
          <Text style={{ fontSize: 28 }}>🔥</Text>
        </View>
        <Text variant="h2" color={colors.white} align="center">Welcome back</Text>
        <Text variant="body" color="rgba(255,255,255,0.7)" align="center">
          Enter your phone to get started
        </Text>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Input
            label="Phone number"
            placeholder="+1 555 000 0000"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoFocus
          />
          <View style={styles.row}>
            <Input
              label="First name"
              placeholder="Jamie"
              value={firstName}
              onChangeText={setFirstName}
              containerStyle={styles.halfInput}
              autoCapitalize="words"
            />
            <Input
              label="Last name"
              placeholder="Smith"
              value={lastName}
              onChangeText={setLastName}
              containerStyle={styles.halfInput}
              autoCapitalize="words"
            />
          </View>

          {error ? <Text variant="bodySm" color={colors.error}>{error}</Text> : null}

          <Button
            label="Send code"
            onPress={handleSendCode}
            loading={loading}
            disabled={!isValid}
            fullWidth
          />

          <Text variant="caption" color={colors.inkSub} align="center" style={styles.terms}>
            By continuing you agree to our Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  form: { padding: spacing.xl, gap: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  halfInput: { flex: 1 },
  terms: { marginTop: spacing.sm, paddingHorizontal: spacing.xl },
});
