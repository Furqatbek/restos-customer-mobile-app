import React, { useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import { HomeStackParamList } from '../../navigation/types';
import { Text } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Divider } from '../../components/common/Divider';
import { useCartStore, CartItem } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { placeOrder, OrderType, PaymentMethod } from '../../api/orders';
import { colors, spacing, radius, shadow } from '../../theme';

type Nav = StackNavigationProp<HomeStackParamList, 'Checkout'>;

const DELIVERY_FEE = 299;
const TIP_OPTIONS = [0, 10, 15, 20];

const fmt = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

export const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const customer = useAuthStore((s) => s.customer);
  const cart = useCartStore();
  const setActiveOrder = useOrderStore((s) => s.setActiveOrder);
  const addToHistory = useOrderStore((s) => s.addToHistory);

  const [orderType, setOrderType] = useState<OrderType>('DELIVERY');
  const [payment, setPayment] = useState<PaymentMethod>('CASH');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [tipPct, setTipPct] = useState(0);
  const [loading, setLoading] = useState(false);

  const sub = cart.subtotal();
  const tipAmount = Math.round(sub * tipPct / 100);
  const deliveryFee = orderType === 'DELIVERY' ? DELIVERY_FEE : 0;
  const total = sub + deliveryFee + tipAmount;

  const handlePlaceOrder = async () => {
    if (orderType === 'DELIVERY' && !address) {
      Alert.alert('Delivery address required', 'Please enter your delivery address.');
      return;
    }
    if (!customer) return;

    setLoading(true);
    try {
      const { data } = await placeOrder({
        restaurantId: cart.restaurantId!,
        orderSource: 'MOBILE',
        orderType,
        customerInfo: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
        },
        items: cart.items.map((item: CartItem) => ({
          productId: item.product.id,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions,
          addOns: item.selectedAddOns.map((a) => ({ addOnId: a.addOn.id, quantity: 1 })),
        })),
        deliveryInfo: orderType === 'DELIVERY'
          ? { address, city: city || 'N/A', deliveryInstructions: notes }
          : undefined,
        paymentMethod: payment,
        customerNotes: notes,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setActiveOrder(data);
      addToHistory(data);
      cart.clearCart();
      navigation.reset({ index: 0, routes: [{ name: 'OrderTracking', params: { orderNumber: data.orderNumber } }] });
    } catch (e: any) {
      Alert.alert('Order failed', e?.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text variant="bodyMed" color={colors.primary}>← Cart</Text>
        </TouchableOpacity>
        <Text variant="h3">Checkout</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Order type */}
          <Section title="Order type">
            <View style={styles.segmented}>
              {(['DELIVERY', 'PICKUP'] as OrderType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.segment, orderType === type && styles.segmentActive]}
                  onPress={() => setOrderType(type)}
                >
                  <Text
                    variant="bodyMed"
                    color={orderType === type ? colors.white : colors.inkMid}
                  >
                    {type === 'DELIVERY' ? '🚴 Delivery' : '🏪 Pickup'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Section>

          {/* Delivery address (only if delivery) */}
          {orderType === 'DELIVERY' && (
            <Section title="Delivery address">
              <Input
                placeholder="Street address"
                value={address}
                onChangeText={setAddress}
              />
              <Input
                placeholder="City"
                value={city}
                onChangeText={setCity}
                containerStyle={{ marginTop: spacing.sm }}
              />
            </Section>
          )}

          {/* Payment */}
          <Section title="Payment method">
            {(['CASH', 'CARD', 'WALLET'] as PaymentMethod[]).map((method) => (
              <TouchableOpacity
                key={method}
                style={[styles.payOption, payment === method && styles.payOptionActive]}
                onPress={() => setPayment(method)}
              >
                <Text style={{ fontSize: 20 }}>
                  {method === 'CASH' ? '💵' : method === 'CARD' ? '💳' : '📱'}
                </Text>
                <Text variant="bodyMed" style={{ flex: 1 }}>
                  {method === 'CASH' ? 'Cash on delivery' : method === 'CARD' ? 'Credit / debit card' : 'Wallet'}
                </Text>
                <View style={[styles.radio, payment === method && styles.radioActive]}>
                  {payment === method && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </Section>

          {/* Tip */}
          <Section title="Tip for courier">
            <View style={styles.tipRow}>
              {TIP_OPTIONS.map((pct) => (
                <TouchableOpacity
                  key={pct}
                  style={[styles.tipBtn, tipPct === pct && styles.tipBtnActive]}
                  onPress={() => setTipPct(pct)}
                >
                  <Text variant="bodyMed" color={tipPct === pct ? colors.white : colors.inkMid}>
                    {pct === 0 ? 'None' : `${pct}%`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Section>

          {/* Notes */}
          <Section title="Order notes">
            <Input
              placeholder="Allergies, dietary needs, special requests..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              style={{ minHeight: 72 }}
            />
          </Section>

          {/* Summary */}
          <Section title="Summary">
            <View style={styles.summaryCard}>
              <SummaryRow label="Subtotal" value={fmt(sub)} />
              {orderType === 'DELIVERY' && <SummaryRow label="Delivery fee" value={fmt(DELIVERY_FEE)} />}
              <SummaryRow label={`Tip (${tipPct}%)`} value={fmt(tipAmount)} />
              <Divider style={{ marginVertical: spacing.sm }} />
              <SummaryRow label="Total" value={fmt(total)} bold />
            </View>
          </Section>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Button
          label={`Place order · ${fmt(total)}`}
          onPress={handlePlaceOrder}
          loading={loading}
          fullWidth
          size="lg"
        />
      </SafeAreaView>
    </SafeAreaView>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={sectionStyles.section}>
    <Text variant="h4" style={{ marginBottom: spacing.md }}>{title}</Text>
    {children}
  </View>
);
const sectionStyles = StyleSheet.create({
  section: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
});

const SummaryRow: React.FC<{ label: string; value: string; bold?: boolean }> = ({ label, value, bold }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
    <Text variant={bold ? 'h4' : 'body'} color={bold ? colors.ink : colors.inkMid}>{label}</Text>
    <Text variant={bold ? 'price' : 'bodyMed'} color={bold ? colors.primary : colors.ink}>{value}</Text>
  </View>
);

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
  content: { padding: spacing.lg },

  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.canvasAlt,
    borderRadius: radius.lg,
    padding: 4,
  },
  segment: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.primary },

  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  payOptionActive: { borderColor: colors.primary, backgroundColor: '#FFF5F5' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.borderMid, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

  tipRow: { flexDirection: 'row', gap: spacing.sm },
  tipBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tipBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },

  summaryCard: {},

  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadow.md,
  },
});
