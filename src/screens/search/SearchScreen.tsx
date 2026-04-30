import React, { useState, useCallback } from 'react';
import {
  View, ScrollView, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Text } from '../../components/common/Text';
import { FoodImage } from '../../components/common/FoodImage';
import { Badge } from '../../components/common/Badge';
import { getActiveRestaurants, getPublicMenu, Product } from '../../api/menu';
import { colors, spacing, radius, shadow, typography } from '../../theme';

const fmt = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

const RECENT = ['Ribeye steak', 'Coffee', 'Burger', 'Dessert'];

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const { data: restaurants } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => getActiveRestaurants().then((r) => r.data),
  });

  const firstRestaurant = restaurants?.[0];

  const { data: menu, isLoading } = useQuery({
    queryKey: ['menu', firstRestaurant?.id],
    queryFn: () => getPublicMenu(firstRestaurant!.id).then((r) => r.data),
    enabled: !!firstRestaurant,
  });

  const allProducts: Product[] = menu?.categories?.flatMap((c) => c.products ?? []) ?? [];

  const results = query.length >= 2
    ? allProducts.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description?.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search dishes, ingredients..."
          placeholderTextColor={colors.inkPlaceholder}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text color={colors.inkSub} style={{ fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {query.length === 0 ? (
        <ScrollView contentContainerStyle={styles.suggestions}>
          {/* Recent searches */}
          <Text variant="h4" style={{ marginBottom: spacing.md }}>Recent searches</Text>
          <View style={styles.chipRow}>
            {RECENT.map((r) => (
              <TouchableOpacity key={r} style={styles.chip} onPress={() => setQuery(r)}>
                <Text variant="label" color={colors.inkMid}>🕐 {r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Categories */}
          <Text variant="h4" style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>Browse by category</Text>
          {menu?.categories?.map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.catRow} activeOpacity={0.8}>
              <View style={styles.catIcon}><Text style={{ fontSize: 24 }}>🍽️</Text></View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMed">{cat.name}</Text>
                <Text variant="caption" color={colors.inkSub}>{cat.products?.length ?? 0} items</Text>
              </View>
              <Text color={colors.inkSub}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : results.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>🔍</Text>
          <Text variant="h4" align="center" style={{ marginTop: spacing.lg }}>No results for "{query}"</Text>
          <Text variant="body" color={colors.inkSub} align="center">Try different keywords or browse the menu.</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={styles.results}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultCard}
              onPress={() => navigation.navigate('HomeTab', {
                screen: 'ItemDetail',
                params: { productId: item.id, restaurantId: firstRestaurant!.id },
              })}
              activeOpacity={0.85}
            >
              <FoodImage imageUrl={item.images?.[0]} name={item.name} style={styles.resultImage} />
              <View style={styles.resultInfo}>
                <Text variant="bodyMed" numberOfLines={1}>{item.name}</Text>
                {item.description && (
                  <Text variant="bodySm" color={colors.inkSub} numberOfLines={2}>{item.description}</Text>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs }}>
                  <Text variant="price" color={colors.primary}>{fmt(item.price)}</Text>
                  {!item.available && <Badge label="Sold out" variant="error" />}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.lg,
    paddingHorizontal: spacing.lg,
    height: 48,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow.sm,
  },
  searchIcon: { fontSize: 18 },
  searchInput: {
    flex: 1,
    fontFamily: typography.sans,
    fontSize: 15,
    color: colors.ink,
  },

  suggestions: { padding: spacing.lg, paddingTop: 0 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.canvasAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  results: { padding: spacing.lg, gap: spacing.md },
  resultCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.sm,
  },
  resultImage: { width: 90, height: 90 },
  resultInfo: { flex: 1, padding: spacing.md, justifyContent: 'center' },
});
