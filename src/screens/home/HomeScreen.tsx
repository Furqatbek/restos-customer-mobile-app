import React, { useState, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { HomeStackParamList } from '../../navigation/types';
import { Text } from '../../components/common/Text';
import { Badge } from '../../components/common/Badge';
import { FoodImage } from '../../components/common/FoodImage';
import { Divider } from '../../components/common/Divider';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { getActiveRestaurants, getPublicMenu, Product, Category, Restaurant } from '../../api/menu';
import { getUnreadCount } from '../../api/notifications';
import { colors, spacing, radius, shadow } from '../../theme';

type Nav = StackNavigationProp<HomeStackParamList, 'Home'>;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100);

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const customer = useAuthStore((s) => s.customer);
  const itemCount = useCartStore((s) => s.itemCount());

  const {
    data: restaurants,
    isLoading: restsLoading,
    error: restsError,
    refetch,
  } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => getActiveRestaurants().then((r) => r.data),
  });

  const firstRestaurant = restaurants?.[0];

  const {
    data: menu,
    isLoading: menuLoading,
    error: menuError,
    refetch: refetchMenu,
  } = useQuery({
    queryKey: ['menu', firstRestaurant?.id],
    queryFn: () => getPublicMenu(firstRestaurant!.id).then((r) => r.data),
    enabled: !!firstRestaurant,
  });

  const queryError = (restsError ?? menuError) as Error | null;

  // Unread notifications badge — best-effort, no UI on failure.
  const { data: unread } = useQuery({
    queryKey: ['notifications-unread-count', customer?.id],
    queryFn: () =>
      getUnreadCount({ role: 'CUSTOMER', userId: customer?.id }).then((r) => {
        const v = r.data as { count?: number } | number;
        return typeof v === 'number' ? v : (v?.count ?? 0);
      }),
    enabled: !!customer?.id,
    refetchInterval: 60_000,
    retry: false,
  });
  const unreadCount = typeof unread === 'number' ? unread : 0;

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchMenu()]);
    setRefreshing(false);
  }, []);

  const categories = menu?.categories ?? [];
  const activeCategory = selectedCategory ?? categories[0]?.id;
  const activeProducts = categories.find((c) => c.id === activeCategory)?.products ?? [];
  const featuredProducts = categories.flatMap((c) => c.products ?? []).filter((p) => p.featured);

  const isLoading = restsLoading || menuLoading;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text variant="bodySm" color={colors.inkSub}>Good afternoon,</Text>
          <Text variant="h3">{customer?.firstName || 'Guest'} 👋</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Text style={styles.iconEmoji}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.cartBadge}>
                <Text variant="caption" color={colors.white}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {itemCount > 0 && (
            <TouchableOpacity
              style={styles.cartBtn}
              onPress={() => navigation.navigate('Cart')}
            >
              <Text style={styles.iconEmoji}>🛒</Text>
              <View style={styles.cartBadge}>
                <Text variant="caption" color={colors.white}>{itemCount}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {queryError && (
          <View style={styles.errorBox}>
            <Text variant="bodyMed" color={colors.error}>Couldn't load the menu.</Text>
            <Text variant="bodySm" color={colors.inkSub} style={{ marginTop: 4 }}>
              {queryError.message ?? 'Unknown error'}
            </Text>
            <TouchableOpacity onPress={onRefresh} style={styles.retryBtn}>
              <Text variant="bodyMed" color={colors.primary}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!queryError && !firstRestaurant && (
          <View style={styles.emptyBox}>
            <Text variant="h3" align="center">No restaurants yet</Text>
            <Text variant="body" color={colors.inkSub} align="center" style={{ marginTop: 8 }}>
              Pull down to refresh.
            </Text>
          </View>
        )}

        {/* Restaurant hero */}
        {firstRestaurant && <RestaurantHero restaurant={firstRestaurant} />}

        {/* Featured */}
        {featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="h3">Featured</Text>
              <Badge label="Chef's picks" variant="accent" />
            </View>
            <FlatList
              horizontal
              data={featuredProducts}
              keyExtractor={(p) => String(p.id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <FeaturedCard
                  product={item}
                  restaurantId={firstRestaurant!.id}
                  onPress={() => navigation.navigate('ItemDetail', { productId: item.id, restaurantId: firstRestaurant!.id })}
                />
              )}
            />
          </View>
        )}

        <Divider />

        {/* Category tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catTabs}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catTab, activeCategory === cat.id && styles.catTabActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                variant="label"
                color={activeCategory === cat.id ? colors.white : colors.inkMid}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Products grid */}
        <View style={styles.productGrid}>
          {activeProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => navigation.navigate('ItemDetail', { productId: product.id, restaurantId: firstRestaurant!.id })}
            />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const RestaurantHero: React.FC<{ restaurant: Restaurant }> = ({ restaurant }) => (
  <LinearGradient colors={['#8B1A1A', '#C9963C']} style={styles.hero}>
    <View style={styles.heroContent}>
      <Text variant="h1" color={colors.white}>{restaurant.name}</Text>
      <Text variant="body" color="rgba(255,255,255,0.8)" style={{ marginTop: 4 }}>
        {restaurant.description}
      </Text>
      <View style={styles.heroMeta}>
        <Badge label={`${restaurant.estimatedDeliveryTime} min`} variant="neutral" />
        <Badge label={`Min $${restaurant.minimumOrderAmount / 100}`} variant="neutral" />
        {restaurant.acceptingOrders
          ? <Badge label="Open" variant="success" />
          : <Badge label="Closed" variant="error" />}
      </View>
    </View>
  </LinearGradient>
);

const FeaturedCard: React.FC<{ product: Product; restaurantId: number; onPress: () => void }> = ({
  product, onPress,
}) => (
  <TouchableOpacity style={styles.featuredCard} onPress={onPress} activeOpacity={0.85}>
    <FoodImage
      imageUrl={product.images?.[0]}
      name={product.name}
      style={styles.featuredImage}
    />
    <View style={styles.featuredInfo}>
      <Text variant="bodyMed" numberOfLines={1}>{product.name}</Text>
      <Text variant="price" color={colors.primary}>
        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price / 100)}
      </Text>
    </View>
  </TouchableOpacity>
);

const ProductCard: React.FC<{ product: Product; onPress: () => void }> = ({ product, onPress }) => (
  <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.85}>
    <FoodImage
      imageUrl={product.images?.[0]}
      name={product.name}
      style={styles.productImage}
    />
    <View style={styles.productInfo}>
      <Text variant="bodyMed" numberOfLines={2}>{product.name}</Text>
      {product.description && (
        <Text variant="bodySm" color={colors.inkSub} numberOfLines={2} style={{ marginTop: 2 }}>
          {product.description}
        </Text>
      )}
      <View style={styles.productFooter}>
        <Text variant="price" color={colors.primary}>
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price / 100)}
        </Text>
        {!product.available && <Badge label="Sold out" variant="error" />}
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  headerRight: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: { padding: spacing.sm, position: 'relative' },
  iconEmoji: { fontSize: 22 },
  cartBtn: {
    padding: spacing.sm,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },

  scrollContent: { paddingBottom: spacing.xl },

  errorBox: {
    margin: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryBtn: { marginTop: spacing.md, alignSelf: 'flex-start' },

  emptyBox: {
    margin: spacing.xl,
    padding: spacing.xxl,
    borderRadius: radius.lg,
    backgroundColor: colors.canvasAlt,
    alignItems: 'center',
  },

  hero: {
    marginHorizontal: spacing.xl,
    borderRadius: radius.xl,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  heroContent: { padding: spacing.xl },
  heroMeta: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },

  section: { marginBottom: spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  horizontalList: { paddingHorizontal: spacing.xl, gap: spacing.md },

  featuredCard: {
    width: 160,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.sm,
  },
  featuredImage: { width: '100%', height: 110 },
  featuredInfo: { padding: spacing.md, gap: spacing.xxs },

  catTabs: { paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.lg, paddingVertical: spacing.xs },
  catTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.canvasAlt,
  },
  catTabActive: { backgroundColor: colors.primary },

  productGrid: { paddingHorizontal: spacing.xl, gap: spacing.md },
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.sm,
  },
  productImage: { width: 100, height: 100 },
  productInfo: { flex: 1, padding: spacing.md, justifyContent: 'space-between' },
  productFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
});
