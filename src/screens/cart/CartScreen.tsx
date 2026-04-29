import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import { HomeStackParamList } from '../../navigation/types';
import { Text } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { Divider } from '../../components/common/Divider';
import { FoodImage } from '../../components/common/FoodImage';
import { useCartStore } from '../../store/cartStore';
import { colors, spacing, radius, shadow } from '../../theme';

type Nav = StackNavigationProp<HomeStackParamList, 'Cart'>;

const DELIVERY_FEE = 299; // cents

const fmt = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

export const CartScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { items, updateQuantity, removeItem, subtotal, total } = useCartStore();

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text variant="bodyMed" color={colors.primary}>← Back</Text>
          </TouchableOpacity>
          <Text variant="h3">Your cart</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.empty}>
          <Text style={{ fontSize: 64 }}>🛒</Text>
          <Text variant="h3" align="center" style={{ marginTop: spacing.xl }}>Your cart is empty</Text>
          <Text variant="body" color={colors.inkSub} align="center" style={{ marginTop: spacing.sm }}>
            Browse the menu and add something delicious
          </Text>
          <Button label="Browse menu" onPress={() => navigation.goBack()} style={{ marginTop: spacing.xl }} />
        </View>
      </SafeAreaView>
    );
  }

  const sub = subtotal();
  const tot = total(DELIVERY_FEE);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text variant="bodyMed" color={colors.primary}>← Back</Text>
        </TouchableOpacity>
        <Text variant="h3">Your cart</Text>
        <TouchableOpacity onPress={() => useCartStore.getState().clearCart()}>
          <Text variant="bodySm" color={colors.inkSub}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {items.map((item) => (
          <View key={item.id} style={styles.cartItem}>
            <FoodImage
              imageUrl={item.product.images?.[0]}
              name={item.product.name}
              style={styles.itemImage}
              borderRadius={radius.md}
            />
            <View style={styles.itemInfo}>
              <Text variant="bodyMed" numberOfLines={2}>{item.product.name}</Text>
              {item.selectedAddOns.length > 0 && (
                <Text variant="caption" color={colors.inkSub} numberOfLines={1}>
                  {item.selectedAddOns.map((a) => a.addOn.name).join(', ')}
                </Text>
              )}
              {item.specialInstructions ? (
                <Text variant="caption" color={colors.inkSub} style={{ fontStyle: 'italic' }}>
                  "{item.specialInstructions}"
                </Text>
              ) : null}
              <Text variant="price" color={colors.primary}>{fmt(item.unitPrice * item.quantity)}</Text>
            </View>
            <View style={styles.qtyControl}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => {
                  Haptics.selectionAsync();
                  updateQuantity(item.id, item.quantity - 1);
                }}
              >
                <Text variant="h4" color={colors.primary}>−</Text>
              </TouchableOpacity>
              <Text variant="bodyMed">{item.quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => {
                  Haptics.selectionAsync();
                  updateQuantity(item.id, item.quantity + 1);
                }}
              >
                <Text variant="h4" color={colors.primary}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Divider style={{ marginVertical: spacing.lg }} />

        {/* Summary */}
        <View style={styles.summary}>
          <Row label="Subtotal" value={fmt(sub)} />
          <Row label="Delivery fee" value={fmt(DELIVERY_FEE)} />
          <Divider style={{ marginVertical: spacing.sm }} />
          <Row label="Total" value={fmt(tot)} bold />
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Button
          label={`Proceed to checkout · ${fmt(tot)}`}
          onPress={() => navigation.navigate('Checkout')}
          fullWidth
          size="lg"
        />
      </SafeAreaView>
    </SafeAreaView>
  );
};

const Row: React.FC<{ label: string; value: string; bold?: boolean }> = ({ label, value, bold }) => (
  <View style={rowStyles.row}>
    <Text variant={bold ? 'h4' : 'body'} color={bold ? colors.ink : colors.inkMid}>{label}</Text>
    <Text variant={bold ? 'price' : 'bodyMed'} color={bold ? colors.primary : colors.inkMid}>{value}</Text>
  </View>
);
const rowStyles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm } });

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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl },
  list: { padding: spacing.xl, gap: spacing.lg },

  cartItem: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.sm,
  },
  itemImage: { width: 72, height: 72 },
  itemInfo: { flex: 1, gap: spacing.xxs },
  qtyControl: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  qtyBtn: { padding: spacing.xs },

  summary: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, ...shadow.sm },

  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadow.md,
  },
});
