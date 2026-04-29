import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Text } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useAuthStore } from '../../store/authStore';
import { getAddresses, setDefaultAddress, Address } from '../../api/customer';
import { colors, spacing, radius, shadow } from '../../theme';

export const AddressBookScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const customer = useAuthStore((s) => s.customer);
  const qc = useQueryClient();

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses', customer?.id],
    queryFn: () => getAddresses(customer!.id).then((r) => r.data),
    enabled: !!customer,
  });

  const handleSetDefault = async (address: Address) => {
    if (!customer || address.isDefault) return;
    try {
      await setDefaultAddress(customer.id, address.id);
      qc.invalidateQueries({ queryKey: ['addresses', customer.id] });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text variant="bodyMed" color={colors.primary}>← Back</Text>
        </TouchableOpacity>
        <Text variant="h3">Saved addresses</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddAddress')}>
          <Text variant="bodyMed" color={colors.primary}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {(!addresses || addresses.length === 0) ? (
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>📍</Text>
              <Text variant="h4" align="center" style={{ marginTop: spacing.lg }}>No saved addresses</Text>
              <Text variant="body" color={colors.inkSub} align="center">Add your home, work, or favourite spots for faster checkout.</Text>
              <Button label="Add address" onPress={() => navigation.navigate('AddAddress')} style={{ marginTop: spacing.xl }} />
            </View>
          ) : (
            addresses.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                style={[styles.addrCard, addr.isDefault && styles.addrCardDefault]}
                onPress={() => handleSetDefault(addr)}
                activeOpacity={0.8}
              >
                <View style={styles.addrIcon}>
                  <Text style={{ fontSize: 22 }}>
                    {addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '💼' : '📍'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Text variant="bodyMed">{addr.label}</Text>
                    {addr.isDefault && <Badge label="Default" variant="primary" />}
                  </View>
                  <Text variant="body" color={colors.inkMid} style={{ marginTop: 2 }}>{addr.address}</Text>
                  <Text variant="bodySm" color={colors.inkSub}>{addr.city}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  list: { padding: spacing.lg, gap: spacing.md },
  empty: { alignItems: 'center', paddingTop: spacing.massive, gap: spacing.sm, paddingHorizontal: spacing.xxxl },

  addrCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow.sm,
  },
  addrCardDefault: { borderColor: colors.primary },
  addrIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.canvasAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
