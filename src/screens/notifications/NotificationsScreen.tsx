import React, { useCallback, useState } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Text } from '../../components/common/Text';
import { Badge } from '../../components/common/Badge';
import { listNotifications, Notification, NotificationType } from '../../api/notifications';
import { HomeStackParamList } from '../../navigation/types';
import { colors, spacing, radius, shadow } from '../../theme';

type Nav = StackNavigationProp<HomeStackParamList, 'Notifications'>;

const ICONS: Record<string, string> = {
  ORDER_CONFIRMED: '✅',
  ORDER_PREPARING: '🍳',
  ORDER_READY: '📦',
  ORDER_OUT_FOR_DELIVERY: '🛵',
  ORDER_DELIVERED: '🎉',
  ORDER_CANCELLED: '❌',
  PROMOTION: '🎁',
  SYSTEM: '🔔',
};

const iconFor = (type: NotificationType) => ICONS[type] ?? '🔔';

const formatRelative = (iso: string): string => {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return '';
  const diffSec = Math.floor((Date.now() - then) / 1000);
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
};

const isUnread = (n: Notification) => !(n.isRead ?? n.read ?? false);

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => listNotifications().then((r) => r.data),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] }),
    ]);
    setRefreshing(false);
  }, [refetch, queryClient]);

  const handlePress = (n: Notification) => {
    const orderId = n.orderId ?? (n.data?.orderId as number | undefined);
    if (orderId !== undefined) {
      // Order notifications route to live tracking
      navigation.navigate('OrderTracking', { orderNumber: String(orderId) });
    }
  };

  const items = data ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text variant="bodyMed" color={colors.primary}>← Back</Text>
        </TouchableOpacity>
        <Text variant="h3">Notifications</Text>
        <View style={{ width: 60 }} />
      </View>

      {isLoading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text variant="bodyMed" color={colors.error}>Couldn't load notifications.</Text>
          <Text variant="bodySm" color={colors.inkSub} style={{ marginTop: 4 }} align="center">
            {(error as Error).message}
          </Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryBtn}>
            <Text variant="bodyMed" color={colors.primary}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 56 }}>🔔</Text>
          <Text variant="h3" align="center" style={{ marginTop: spacing.lg }}>
            No notifications yet
          </Text>
          <Text variant="body" color={colors.inkSub} align="center" style={{ marginTop: 4 }}>
            We'll let you know when something happens.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => String(n.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => {
            const unread = isUnread(item);
            return (
              <TouchableOpacity
                style={[styles.row, unread && styles.rowUnread]}
                activeOpacity={0.7}
                onPress={() => handlePress(item)}
              >
                <View style={styles.iconCircle}>
                  <Text style={{ fontSize: 22 }}>{iconFor(item.type)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text variant="bodyMed" numberOfLines={1} style={{ flex: 1 }}>
                      {item.title}
                    </Text>
                    {unread && <View style={styles.unreadDot} />}
                  </View>
                  {(item.body || item.message) && (
                    <Text variant="bodySm" color={colors.inkSub} numberOfLines={2} style={{ marginTop: 2 }}>
                      {item.body ?? item.message}
                    </Text>
                  )}
                  <Text variant="caption" color={colors.inkSub} style={{ marginTop: 6 }}>
                    {formatRelative(item.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  backBtn: { width: 60 },
  retryBtn: { marginTop: spacing.lg },

  list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxxl },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadow.sm,
  },
  rowUnread: {
    backgroundColor: '#FFF5F5',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.canvasAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
