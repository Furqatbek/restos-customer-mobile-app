import React, { useCallback, useState } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Text } from '../../components/common/Text';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  Notification,
  NotificationType,
  Page,
} from '../../api/notifications';
import { useAuthStore } from '../../store/authStore';
import { HomeStackParamList } from '../../navigation/types';
import { colors, spacing, radius, shadow } from '../../theme';

type Nav = StackNavigationProp<HomeStackParamList, 'Notifications'>;

const ICONS: Record<string, string> = {
  ORDER_STATUS: '📦',
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

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const customer = useAuthStore((s) => s.customer);
  const [refreshing, setRefreshing] = useState(false);

  const listKey = ['notifications', { role: 'CUSTOMER', userId: customer?.id }];
  const countKey = ['notifications-unread-count', customer?.id];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: listKey,
    queryFn: () =>
      listNotifications({
        role: 'CUSTOMER',
        userId: customer?.id,
        page: 0,
        size: 50,
      }).then((r) => r.data),
    enabled: !!customer?.id,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Page<Notification>>(listKey);
      if (previous) {
        queryClient.setQueryData<Page<Notification>>(listKey, {
          ...previous,
          content: previous.content.map((n) => (n.id === id ? { ...n, read: true } : n)),
        });
      }
      // Optimistically decrement unread count
      const prevCount = queryClient.getQueryData<number>(countKey);
      if (typeof prevCount === 'number' && prevCount > 0) {
        queryClient.setQueryData(countKey, prevCount - 1);
      }
      return { previous, prevCount };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(listKey, ctx.previous);
      if (ctx?.prevCount !== undefined) queryClient.setQueryData(countKey, ctx.prevCount);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: countKey });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () =>
      markAllNotificationsRead({ role: 'CUSTOMER', userId: customer?.id }),
    onSuccess: () => {
      const previous = queryClient.getQueryData<Page<Notification>>(listKey);
      if (previous) {
        queryClient.setQueryData<Page<Notification>>(listKey, {
          ...previous,
          content: previous.content.map((n) => ({ ...n, read: true })),
        });
      }
      queryClient.setQueryData(countKey, 0);
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: countKey }),
    ]);
    setRefreshing(false);
  }, [refetch, queryClient, countKey]);

  const handlePress = (n: Notification) => {
    if (!n.read) markReadMutation.mutate(n.id);
    if (n.orderId !== undefined && n.orderId !== null) {
      navigation.navigate('OrderTracking', { orderNumber: String(n.orderId) });
    }
  };

  const items = data?.content ?? [];
  const hasUnread = items.some((n) => !n.read);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text variant="bodyMed" color={colors.primary}>← Back</Text>
        </TouchableOpacity>
        <Text variant="h3">Notifications</Text>
        {hasUnread ? (
          <TouchableOpacity
            onPress={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            style={styles.markAllBtn}
          >
            <Text variant="bodySm" color={colors.primary}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.markAllBtn} />
        )}
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
            const unread = !item.read;
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
                  {item.message ? (
                    <Text variant="bodySm" color={colors.inkSub} numberOfLines={2} style={{ marginTop: 2 }}>
                      {item.message}
                    </Text>
                  ) : null}
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
    gap: spacing.sm,
  },
  backBtn: { minWidth: 60 },
  markAllBtn: { minWidth: 100, alignItems: 'flex-end' },
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
