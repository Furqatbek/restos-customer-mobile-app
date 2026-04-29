import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from './types';
import { HomeStackNavigator } from './HomeStackNavigator';
import { SearchScreen } from '../screens/search/SearchScreen';
import { OrderHistoryScreen } from '../screens/profile/OrderHistoryScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { Text } from '../components/common/Text';
import { useCartStore } from '../store/cartStore';
import { colors, radius, spacing } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabIcon = ({
  name,
  focused,
  badge,
}: {
  name: string;
  focused: boolean;
  badge?: number;
}) => {
  const icons: Record<string, string> = {
    HomeTab: '🏠',
    SearchTab: '🔍',
    OrdersTab: '📋',
    ProfileTab: '👤',
  };
  return (
    <View style={tabStyles.iconWrap}>
      <Text style={tabStyles.emoji}>{icons[name]}</Text>
      {badge ? (
        <View style={tabStyles.badge}>
          <Text variant="caption" color={colors.white}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </View>
  );
};

export const MainNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const itemCount = useCartStore((s) => s.itemCount());

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkSub,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: { fontFamily: 'Inter', fontSize: 10, fontWeight: '500' },
        tabBarIcon: ({ focused }) => (
          <TabIcon
            name={route.name}
            focused={focused}
            badge={route.name === 'HomeTab' ? itemCount || undefined : undefined}
          />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ tabBarLabel: 'Search' }} />
      <Tab.Screen name="OrdersTab" component={OrderHistoryScreen} options={{ tabBarLabel: 'Orders' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
};

const tabStyles = StyleSheet.create({
  iconWrap: { position: 'relative', width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 20 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
});
