import api from './client';
import * as SecureStore from 'expo-secure-store';

export interface OtpRequestPayload {
  phone: string;
  firstName: string;
  lastName: string;
}

export interface OtpVerifyPayload {
  phone: string;
  otp: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface CustomerInfo {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

export const requestOtp = (payload: OtpRequestPayload) =>
  api.post<{ sessionId: string; expiresAt: string }>('/consumer/auth/login', payload);

export const verifyOtp = (payload: OtpVerifyPayload) =>
  api.post<AuthTokens & { customer: CustomerInfo }>('/consumer/auth/verify', payload);

export const saveTokens = async (tokens: AuthTokens) => {
  await SecureStore.setItemAsync('access_token', tokens.accessToken);
  await SecureStore.setItemAsync('refresh_token', tokens.refreshToken);
};

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
};

export const getAccessToken = () => SecureStore.getItemAsync('access_token');
