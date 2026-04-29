import api from './client';

export interface Address {
  id: number;
  label: string;
  address: string;
  city: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

export interface CreateAddressPayload {
  label: string;
  address: string;
  city: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface LoyaltyInfo {
  balance: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  totalEarned: number;
  totalSpent: number;
  nextTierName?: string;
  pointsToNextTier?: number;
}

export interface LoyaltyTransaction {
  id: number;
  type: 'EARNED' | 'SPENT' | 'BONUS';
  amount: number;
  orderReference?: string;
  description: string;
  createdAt: string;
}

export const getAddresses = (customerId: number) =>
  api.get<Address[]>(`/customers/${customerId}/addresses`);

export const createAddress = (customerId: number, payload: CreateAddressPayload) =>
  api.post<Address>(`/customers/${customerId}/addresses`, payload);

export const setDefaultAddress = (customerId: number, addressId: number) =>
  api.put(`/customers/${customerId}/addresses/${addressId}/default`);

export const getLoyaltyInfo = (customerId: number) =>
  api.get<LoyaltyInfo>(`/loyalty/customers/${customerId}`);

export const getLoyaltyTransactions = (customerId: number, page = 0) =>
  api.get<{ content: LoyaltyTransaction[]; totalElements: number }>(
    `/loyalty/customers/${customerId}/transactions?page=${page}&size=20`,
  );
