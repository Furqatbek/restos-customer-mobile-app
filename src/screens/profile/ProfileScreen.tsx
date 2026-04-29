import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../../components/common/Text';
import { Divider } from '../../components/common/Divider';
import { Badge } from '../../components/common/Badge';
import { useAuthStore } from '../../store/authStore';
import { clearTokens } from '../../api/auth';
import { getLoyaltyInfo } from '../../api/customer';
import { colors, spacing, radius, shadow } from '../../theme';

const TIER_COLORS: Record<string, string> = {
  BRONZE: colors.bronze,
  SILVER: colors.silver,
  GOLD: colors.gold,
};

const MenuItem: React.FC<{ emoji: string; label: string; sublabel?: string; onPress: () => void; badge?: string }> = ({
  emoji, label, sublabel, onPress, badge,
}) => (
  <TouchableOpacity style={menuStyles.item} onPress={onPress} activeOpacity={0.7}>
    <Text style={{ fontSize: 22 }}>{emoji}</Text>
    <View style={{ flex: 1 }}>
      <Text variant="bodyMed">{label}</Text>
      {sublabel && <Text variant="caption" color={colors.inkSub}>{sublabel}</Text>}
    </View>
    {badge && <Badge label={badge} variant="primary" />}
    <Text variant="body" color={colors.inkSub}>›</Text>
  </TouchableOpacity>
);
const menuStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { customer, clearAuth } = useAuthStore();

  const { data: loyalty } = useQuery({
    queryKey: ['loyalty', customer?.id],
    queryFn: () => getLoyaltyInfo(customer!.id).then((r) => r.data),
    enabled: !!customer,
  });

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await clearTokens();
          clearAuth();
          navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
        },
      },
    ]);
  };

  const tierColor = loyalty ? TIER_COLORS[loyalty.tier] ?? colors.bronze : colors.bronze;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView>
        {/* Profile hero */}
        <LinearGradient colors={['#2D0A0A', '#8B1A1A']} style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 36 }}>
              {customer?.firstName?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text variant="h2" color={colors.white}>
            {customer?.firstName} {customer?.lastName}
          </Text>
          <Text variant="body" color="rgba(255,255,255,0.7)">{customer?.phone}</Text>

          {loyalty && (
            <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
              <Text variant="label" color={colors.white}>
                {loyalty.tier} · {loyalty.balance} pts
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* Loyalty card */}
        {loyalty && (
          <TouchableOpacity
            style={styles.loyaltyCard}
            onPress={() => navigation.navigate('ProfileTab', { screen: 'Loyalty' })}
            activeOpacity={0.8}
          >
            <View>
              <Text variant="h4">Loyalty points</Text>
              <Text variant="bodySm" color={colors.inkSub}>
                {loyalty.pointsToNextTier
                  ? `${loyalty.pointsToNextTier} pts to ${loyalty.nextTierName}`
                  : 'You\'re at the top tier!'}
              </Text>
            </View>
            <View style={styles.pointsBubble}>
              <Text variant="priceLg" color={colors.primary}>{loyalty.balance}</Text>
              <Text variant="caption" color={colors.inkSub}>points</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Menu sections */}
        <View style={styles.card}>
          <Text variant="label" color={colors.inkSub} style={styles.groupLabel}>Account</Text>
          <MenuItem emoji="📋" label="Order history" onPress={() => navigation.navigate('OrdersTab')} />
          <Divider inset={spacing.xl} />
          <MenuItem emoji="📍" label="Saved addresses" onPress={() => navigation.navigate('HomeTab', { screen: 'AddressBook' })} />
          <Divider inset={spacing.xl} />
          <MenuItem emoji="⭐" label="Loyalty & rewards" onPress={() => {}} />
        </View>

        <View style={styles.card}>
          <Text variant="label" color={colors.inkSub} style={styles.groupLabel}>Preferences</Text>
          <MenuItem emoji="🌐" label="Language" sublabel="English" onPress={() => {}} />
          <Divider inset={spacing.xl} />
          <MenuItem emoji="🔔" label="Notifications" onPress={() => {}} />
          <Divider inset={spacing.xl} />
          <MenuItem emoji="🛡️" label="Privacy & security" onPress={() => {}} />
        </View>

        <View style={styles.card}>
          <Text variant="label" color={colors.inkSub} style={styles.groupLabel}>Support</Text>
          <MenuItem emoji="💬" label="Help & support" onPress={() => {}} />
          <Divider inset={spacing.xl} />
          <MenuItem emoji="⭐" label="Rate the app" onPress={() => {}} />
          <Divider inset={spacing.xl} />
          <MenuItem emoji="📄" label="Terms & Privacy" onPress={() => {}} />
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text variant="bodyMed" color={colors.error} align="center">Sign out</Text>
        </TouchableOpacity>

        <Text variant="caption" color={colors.inkPlaceholder} align="center" style={{ marginBottom: spacing.xxxl }}>
          RestOS · Customer App v1.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  hero: {
    alignItems: 'center',
    padding: spacing.xxxl,
    gap: spacing.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  tierBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },

  loyaltyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    margin: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.sm,
  },
  pointsBubble: { alignItems: 'center' },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow.sm,
  },
  groupLabel: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xs },

  signOutBtn: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
});
