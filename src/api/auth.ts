import axios from 'axios';
import api, { BASE_URL } from './client';
import { storage } from '../utils/storage';

export type RegistrationSource = 'MOBILE_APP' | 'WEB' | 'SELF_SERVICE' | 'POS';

export interface OtpRequestPayload {
  phoneNumber: string;
  firstName: string;
  lastName: string;
}

export interface OtpVerifyPayload {
  phoneNumber: string;
  otpCode: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface VerifyResult extends AuthTokens {
  customerId: number;
  phoneNumber: string;
  isNewUser: boolean;
}

export interface CustomerInfo {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
}

// Backend envelope: { success, message, data, timestamp }
interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

interface OtpRequestResponseData {
  session_id?: string;
  expires_at?: string;
}

interface OtpVerifyResponseData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in_seconds: number;
  phone_number: string;
  customer_id: number;
  is_new_user: boolean;
}

export const requestOtp = async (payload: OtpRequestPayload) => {
  const { data } = await api.post<ApiEnvelope<OtpRequestResponseData>>(
    '/consumer/auth/login',
    { ...payload, registrationSource: 'MOBILE_APP' as RegistrationSource },
  );
  return data.data;
};

export const verifyOtp = async (payload: OtpVerifyPayload): Promise<VerifyResult> => {
  const { data } = await api.post<ApiEnvelope<OtpVerifyResponseData>>(
    '/consumer/auth/verify',
    payload,
  );
  const d = data.data;
  return {
    accessToken: d.access_token,
    refreshToken: d.refresh_token,
    customerId: d.customer_id,
    phoneNumber: d.phone_number,
    isNewUser: d.is_new_user,
  };
};

// Best-effort: tell the server to invalidate the session. Pass the token
// explicitly because by the time this is dispatched the local storage may
// already be cleared (we want the UI to respond instantly, then notify the
// server in the background). Fire-and-forget — failures are ignored.
export const logoutRemote = (accessToken: string): void => {
  if (!accessToken) return;
  // Use a bare axios so we don't go through the request interceptor (which
  // would try to read from now-empty storage) or the response interceptor
  // (we don't care about retry/refresh on logout).
  void axios
    .post(
      `${BASE_URL}/consumer/auth/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      },
    )
    .catch(() => {
      // ignore — local state is already cleared
    });
};

export const saveTokens = async (tokens: AuthTokens) => {
  await storage.setItem('access_token', tokens.accessToken);
  await storage.setItem('refresh_token', tokens.refreshToken);
};

export const clearTokens = async () => {
  await storage.deleteItem('access_token');
  await storage.deleteItem('refresh_token');
};

export const getAccessToken = () => storage.getItem('access_token');
