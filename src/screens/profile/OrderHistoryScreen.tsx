import React from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Text } from '../../components/common/Text';
import { Badge } from '../../components/common/Badge';
import { Divider } from '../../components/common/Divider';
import { useOrderStore } from '../../store/orderStore';
import { OrderResponse, OrderStatus } from '../../api/orders';
import { colors, spacing, radius, shadow } from '../../theme';

const statusBadge = (status: OrderStatus): 'success' | 'error' | 'primary' | 'neutral' => {
  if (['DELIVERED', 'COMPLETED'].includes(status)) return 'success';
  if (['CANCELLED', 'REJECTED'].includes(status)) return 'error';
  if (['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(status)) return 'primary';
  return 'neutral';
};

const fmt = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export const OrderHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { orderHistory, activeOrder } = useOrderStore();

  const allOrders = [
    ...(activeOrder ? [activeOrder] : []),
    ...orderHistory.filter((o) => o.orderNumber !== activeOrder?.orderNumber),
  ];

  const renderOrder = ({ item }: { item: OrderResponse }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('HomeTab', { screen: 'OrderTracking', params: { orderNumber: item.orderNumber } })}
      activeOpacity={0.8}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text variant="bodyMed">Order #{item.orderNumber}</Text>
          <Text variant="caption" color={colors.inkSub}>{formatDate(item.createdAt)}</Text>
        </View>
        <Badge label={item.status.replace(/_/g, ' ')} variant={statusBadge(item.status)} />
      </View>
      <Divider style={{ marginVertical: spacing.sm }} />
      <View style={styles.orderFooter}>
        <Text variant="bodySm" color={colors.inkSub}>
          {item.orderType} · {item.paymentMethod}
        </Text>
        <Text variant="price" color={colors.primary}>{fmt(item.total)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text variant="h3">My orders</Text>
      </View>

      {allOrders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>📋</Text>
          <Text variant="h4" align="center" style={{ marginTop: spacing.lg }}>No orders yet</Text>
          <Text variant="body" color={colors.inkSub} align="center">
            Your order history will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={allOrders}
          keyExtractor={(o) => o.orderNumber}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl },
  list: { padding: spacing.lg, gap: spacing.md },

  orderCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.sm,
  },
  orderHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  orderFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
