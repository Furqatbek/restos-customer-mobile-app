import React, { useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { HomeStackParamList } from '../../navigation/types';
import { Text } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { FoodImage } from '../../components/common/FoodImage';
import { Divider } from '../../components/common/Divider';
import { useCartStore } from '../../store/cartStore';
import { getPublicMenu, Product, AddOn, AddOnGroup } from '../../api/menu';
import { colors, spacing, radius, shadow, typography } from '../../theme';

type RouteType = RouteProp<HomeStackParamList, 'ItemDetail'>;

export const ItemDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { productId, restaurantId } = route.params;

  const { data: menu } = useQuery({
    queryKey: ['menu', restaurantId],
    queryFn: () => getPublicMenu(restaurantId).then((r) => r.data),
  });

  const product = menu?.categories
    .flatMap((c) => c.products ?? [])
    .find((p) => p.id === productId);

  const addItem = useCartStore((s) => s.addItem);
  const setRestaurantId = useCartStore((s) => s.setRestaurantId);

  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<Record<number, Set<number>>>({});
  const [notes, setNotes] = useState('');

  if (!product) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text variant="body" color={colors.inkSub}>Item not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const addonGroups = product.addonGroups ?? [];

  const toggleAddOn = (group: AddOnGroup, addOn: AddOn) => {
    Haptics.selectionAsync();
    setSelectedAddOns((prev) => {
      const groupSet = new Set(prev[group.id] ?? []);
      if (group.multiSelect) {
        if (groupSet.has(addOn.id)) groupSet.delete(addOn.id);
        else if (groupSet.size < group.maxSelections) groupSet.add(addOn.id);
      } else {
        groupSet.clear();
        groupSet.add(addOn.id);
      }
      return { ...prev, [group.id]: groupSet };
    });
  };

  const isAddOnSelected = (groupId: number, addOnId: number) =>
    selectedAddOns[groupId]?.has(addOnId) ?? false;

  const selectedFlatAddOns = addonGroups.flatMap((g) =>
    g.addOns.filter((a) => isAddOnSelected(g.id, a.id)).map((a) => ({ group: g.name, addOn: a })),
  );

  const addOnTotal = selectedFlatAddOns.reduce((sum, { addOn }) => sum + addOn.price, 0);
  const unitPrice = product.price + addOnTotal;
  const totalPrice = unitPrice * quantity;

  const canAddToCart = () => {
    return addonGroups
      .filter((g) => g.required)
      .every((g) => (selectedAddOns[g.id]?.size ?? 0) >= (g.minSelections || 1));
  };

  const handleAddToCart = () => {
    if (!canAddToCart()) {
      Alert.alert('Required options', 'Please make all required selections before adding to cart.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRestaurantId(restaurantId);
    addItem({ product, quantity, selectedAddOns: selectedFlatAddOns, specialInstructions: notes, unitPrice });
    navigation.goBack();
  };

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <View style={styles.imageContainer}>
          <FoodImage
            imageUrl={product.images?.[0]}
            name={product.name}
            style={styles.heroImage}
            borderRadius={0}
          />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Product info */}
          <View style={styles.productHeader}>
            <View style={styles.productTitleRow}>
              <Text variant="h2" style={{ flex: 1 }}>{product.name}</Text>
              {!product.available && <Badge label="Sold out" variant="error" />}
            </View>
            {product.description && (
              <Text variant="body" color={colors.inkSub} style={{ marginTop: spacing.sm }}>
                {product.description}
              </Text>
            )}
            <View style={styles.metaRow}>
              <Text variant="priceLg" color={colors.primary}>{formatPrice(product.price)}</Text>
              {product.preparationTime && (
                <Badge label={`${product.preparationTime} min`} variant="neutral" />
              )}
            </View>
          </View>

          <Divider />

          {/* Add-on groups */}
          {addonGroups.map((group) => (
            <View key={group.id} style={styles.addonGroup}>
              <View style={styles.addonGroupHeader}>
                <Text variant="h4">{group.name}</Text>
                {group.required && <Badge label="Required" variant="primary" />}
                {!group.required && <Badge label="Optional" variant="neutral" />}
              </View>
              {group.multiSelect && (
                <Text variant="caption" color={colors.inkSub} style={{ marginBottom: spacing.sm }}>
                  Choose up to {group.maxSelections}
                </Text>
              )}
              {group.addOns.filter((a) => a.available).map((addOn) => {
                const selected = isAddOnSelected(group.id, addOn.id);
                return (
                  <TouchableOpacity
                    key={addOn.id}
                    style={[styles.addonRow, selected && styles.addonRowSelected]}
                    onPress={() => toggleAddOn(group, addOn)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.addonCheck, group.multiSelect ? styles.addonCheckSquare : styles.addonCheckCircle, selected && styles.addonCheckActive]}>
                      {selected && <Text color={colors.white} style={{ fontSize: 11 }}>✓</Text>}
                    </View>
                    <Text variant="bodyMed" style={{ flex: 1 }}>{addOn.name}</Text>
                    {addOn.price > 0 && (
                      <Text variant="label" color={colors.inkMid}>+{formatPrice(addOn.price)}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
              <Divider />
            </View>
          ))}

          {/* Special instructions */}
          <View style={styles.notesSection}>
            <Text variant="h4" style={{ marginBottom: spacing.sm }}>Special instructions</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Allergies, preferences, cooking notes..."
              placeholderTextColor={colors.inkPlaceholder}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Footer: quantity + add to cart */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.footerInner}>
          <View style={styles.quantityControl}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => { Haptics.selectionAsync(); setQuantity((q) => Math.max(1, q - 1)); }}
            >
              <Text variant="h3" color={colors.primary}>−</Text>
            </TouchableOpacity>
            <Text variant="h4">{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => { Haptics.selectionAsync(); setQuantity((q) => q + 1); }}
            >
              <Text variant="h3" color={colors.primary}>+</Text>
            </TouchableOpacity>
          </View>
          <Button
            label={`Add to cart · ${formatPrice(totalPrice)}`}
            onPress={handleAddToCart}
            disabled={!product.available}
            style={styles.addBtn}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  imageContainer: { position: 'relative' },
  heroImage: { width: '100%', height: 280 },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: colors.white, fontSize: 20, lineHeight: 24 },

  content: { padding: spacing.xl },

  productHeader: { marginBottom: spacing.lg },
  productTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },

  addonGroup: { marginBottom: spacing.md },
  addonGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  addonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  addonRowSelected: { backgroundColor: '#FFF5F5' },
  addonCheck: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: colors.borderMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addonCheckCircle: { borderRadius: 11 },
  addonCheckSquare: { borderRadius: 5 },
  addonCheckActive: { backgroundColor: colors.primary, borderColor: colors.primary },

  notesSection: { marginTop: spacing.sm },
  notesInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontFamily: typography.sans,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.white,
    minHeight: 80,
  },

  footer: {
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadow.md,
  },
  footerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.canvasAlt,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  qtyBtn: { padding: spacing.xs },
  addBtn: { flex: 1 },
});
