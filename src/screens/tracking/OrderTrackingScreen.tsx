import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { HomeStackParamList } from '../../navigation/types';
import { Text } from '../../components/common/Text';
import { Badge } from '../../components/common/Badge';
import { Divider } from '../../components/common/Divider';
import { useOrderStore } from '../../store/orderStore';
import { trackOrder, OrderResponse, OrderStatus } from '../../api/orders';
import { colors, spacing, radius, shadow } from '../../theme';

type RouteType = RouteProp<HomeStackParamList, 'OrderTracking'>;

const STATUS_STEPS: { status: OrderStatus; label: string; emoji: string }[] = [
  { status: 'PLACED',           label: 'Order placed',        emoji: '📝' },
  { status: 'ACCEPTED',         label: 'Accepted',            emoji: '✅' },
  { status: 'PREPARING',        label: 'Preparing',           emoji: '👨‍🍳' },
  { status: 'READY',            label: 'Ready',               emoji: '🍽️' },
  { status: 'COURIER_ASSIGNED', label: 'Courier assigned',    emoji: '🚴' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for delivery',    emoji: '📍' },
  { status: 'DELIVERED',        label: 'Delivered',           emoji: '🎉' },
];

const STATUS_ORDER: OrderStatus[] = STATUS_STEPS.map((s) => s.status);

const getStatusIndex = (status: OrderStatus) =>
  Math.max(0, STATUS_ORDER.indexOf(status));

const statusBadgeVariant = (status: OrderStatus) => {
  if (['DELIVERED', 'COMPLETED'].includes(status)) return 'success';
  if (['CANCELLED', 'REJECTED'].includes(status)) return 'error';
  return 'primary';
};

export const OrderTrackingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { orderNumber } = route.params;
  const setActiveOrder = useOrderStore((s) => s.setActiveOrder);

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const { data } = await trackOrder(orderNumber);
      setOrder(data);
      setActiveOrder(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();
    // Poll every 15 seconds for live updates
    const interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
  }, [orderNumber]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text variant="body" color={colors.inkSub}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStepIdx = getStatusIndex(order.status);
  const isCompleted = ['DELIVERED', 'COMPLETED'].includes(order.status);
  const isCancelled = ['CANCELLED', 'REJECTED'].includes(order.status);
  const fmt = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home' as any)}>
          <Text variant="bodyMed" color={colors.primary}>← Home</Text>
        </TouchableOpacity>
        <Text variant="h3">Order #{order.orderNumber}</Text>
        <Badge
          label={order.status.replace(/_/g, ' ')}
          variant={statusBadgeVariant(order.status)}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Status hero */}
        {!isCancelled ? (
          <LinearGradient colors={['#8B1A1A', '#C9963C']} style={styles.statusHero}>
            <Text style={{ fontSize: 48 }}>
              {isCompleted ? '🎉' : STATUS_STEPS[currentStepIdx]?.emoji ?? '🍽️'}
            </Text>
            <Text variant="h2" color={colors.white} align="center" style={{ marginTop: spacing.md }}>
              {isCompleted ? 'Delivered!' : STATUS_STEPS[currentStepIdx]?.label ?? 'Processing'}
            </Text>
            {order.estimatedDeliveryTime && !isCompleted && (
              <Text variant="body" color="rgba(255,255,255,0.75)" align="center">
                Est. {order.estimatedDeliveryTime} min
              </Text>
            )}
          </LinearGradient>
        ) : (
          <View style={[styles.statusHero, { backgroundColor: colors.errorBg }]}>
            <Text style={{ fontSize: 48 }}>❌</Text>
            <Text variant="h2" color={colors.error} align="center" style={{ marginTop: spacing.md }}>
              Order {order.status === 'CANCELLED' ? 'Cancelled' : 'Rejected'}
            </Text>
          </View>
        )}

        {/* Timeline */}
        {!isCancelled && (
          <View style={styles.card}>
            <Text variant="h4" style={{ marginBottom: spacing.lg }}>Order progress</Text>
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStepIdx;
              const active = i === currentStepIdx;
              return (
                <View key={step.status} style={styles.timelineStep}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, done && styles.timelineDotDone, active && styles.timelineDotActive]}>
                      {done && <Text color={colors.white} style={{ fontSize: 10 }}>✓</Text>}
                    </View>
                    {i < STATUS_STEPS.length - 1 && (
                      <View style={[styles.timelineLine, done && styles.timelineLineDone]} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text variant={active ? 'bodyMed' : 'body'} color={done ? colors.ink : colors.inkSub}>
                      {step.label}
                    </Text>
                    {active && (
                      <Text variant="caption" color={colors.primary}>In progress...</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Courier info */}
        {order.deliveryInfo?.courierName && (
          <View style={styles.card}>
            <Text variant="h4" style={{ marginBottom: spacing.md }}>Your courier</Text>
            <View style={styles.courierRow}>
              <View style={styles.courierAvatar}>
                <Text style={{ fontSize: 28 }}>🚴</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMed">{order.deliveryInfo.courierName}</Text>
                {order.deliveryInfo.courierPhone && (
                  <Text variant="bodySm" color={colors.inkSub}>{order.deliveryInfo.courierPhone}</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Order summary */}
        <View style={styles.card}>
          <Text variant="h4" style={{ marginBottom: spacing.md }}>Order summary</Text>
          {order.items?.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text variant="bodyMed">{item.quantity}×</Text>
              <Text variant="body" style={{ flex: 1, marginLeft: spacing.sm }}>{item.productName}</Text>
              <Text variant="bodyMed">{fmt(item.totalPrice)}</Text>
            </View>
          ))}
          <Divider style={{ marginVertical: spacing.sm }} />
          <View style={styles.orderItem}>
            <Text variant="h4" style={{ flex: 1 }}>Total</Text>
            <Text variant="price" color={colors.primary}>{fmt(order.total)}</Text>
          </View>
        </View>

        {/* Delivery address */}
        {order.deliveryInfo?.address && (
          <View style={styles.card}>
            <Text variant="h4" style={{ marginBottom: spacing.sm }}>Delivering to</Text>
            <Text variant="body" color={colors.inkMid}>{order.deliveryInfo.address}</Text>
            {order.deliveryInfo.city && (
              <Text variant="bodySm" color={colors.inkSub}>{order.deliveryInfo.city}</Text>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  content: { padding: spacing.lg, gap: spacing.md },

  statusHero: {
    borderRadius: radius.xl,
    padding: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.sm,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.sm,
  },

  timelineStep: { flexDirection: 'row', gap: spacing.md, minHeight: 48 },
  timelineLeft: { alignItems: 'center', width: 24 },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: { backgroundColor: colors.success, borderColor: colors.success },
  timelineDotActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  timelineLine: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
  timelineLineDone: { backgroundColor: colors.success },
  timelineContent: { flex: 1, paddingBottom: spacing.md },

  courierRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  courierAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.canvasAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  orderItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
});
