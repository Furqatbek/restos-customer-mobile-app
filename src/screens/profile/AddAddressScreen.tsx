import React, { useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { Text } from '../../components/common/Text';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuthStore } from '../../store/authStore';
import { createAddress } from '../../api/customer';
import { colors, spacing, radius } from '../../theme';

const LABEL_OPTIONS = ['Home', 'Work', 'Partner', 'Other'];

export const AddAddressScreen: React.FC = () => {
  const navigation = useNavigation();
  const customer = useAuthStore((s) => s.customer);
  const qc = useQueryClient();

  const [label, setLabel] = useState('Home');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!address || !city) {
      Alert.alert('Required', 'Please fill in the address and city.');
      return;
    }
    if (!customer) return;
    setLoading(true);
    try {
      await createAddress(customer.id, { label, address, city, zipCode, isDefault });
      qc.invalidateQueries({ queryKey: ['addresses', customer.id] });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to save address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text variant="bodyMed" color={colors.primary}>← Cancel</Text>
        </TouchableOpacity>
        <Text variant="h3">Add address</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Label picker */}
          <View style={styles.labelSection}>
            <Text variant="label" color={colors.inkMid} style={{ marginBottom: spacing.sm }}>Label</Text>
            <View style={styles.labelRow}>
              {LABEL_OPTIONS.map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[styles.labelChip, label === l && styles.labelChipActive]}
                  onPress={() => setLabel(l)}
                >
                  <Text variant="label" color={label === l ? colors.white : colors.inkMid}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input label="Street address" placeholder="123 Main St, Apt 4" value={address} onChangeText={setAddress} />
          <Input label="City" placeholder="New York" value={city} onChangeText={setCity} containerStyle={{ marginTop: spacing.md }} />
          <Input label="ZIP / Postal code" placeholder="10001" value={zipCode} onChangeText={setZipCode} keyboardType="numeric" containerStyle={{ marginTop: spacing.md }} />

          {/* Default toggle */}
          <TouchableOpacity style={styles.defaultRow} onPress={() => setIsDefault(!isDefault)}>
            <View style={[styles.toggle, isDefault && styles.toggleActive]}>
              <View style={[styles.toggleThumb, isDefault && styles.toggleThumbActive]} />
            </View>
            <Text variant="bodyMed">Set as default address</Text>
          </TouchableOpacity>

          <Button label="Save address" onPress={handleSave} loading={loading} fullWidth style={{ marginTop: spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  content: { padding: spacing.xl, gap: spacing.sm },
  labelSection: {},
  labelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  labelChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  labelChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },

  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.md,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.border,
    padding: 3,
    justifyContent: 'center',
  },
  toggleActive: { backgroundColor: colors.primary },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  toggleThumbActive: { alignSelf: 'flex-end' },
});
