import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  OtpVerify: { phoneNumber: string; firstName: string; lastName: string };
};

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  OrdersTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  ItemDetail: { productId: number; restaurantId: number };
  Cart: undefined;
  Checkout: undefined;
  OrderTracking: { orderNumber: string };
  AddressBook: undefined;
  AddAddress: undefined;
  Notifications: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  Loyalty: undefined;
  AddressBook: undefined;
  AddAddress: undefined;
  OrderHistory: undefined;
  OrderDetail: { orderNumber: string };
  Settings: undefined;
};

export type SearchStackParamList = {
  Search: undefined;
  ItemDetail: { productId: number; restaurantId: number };
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
