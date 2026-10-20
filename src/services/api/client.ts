import axios from 'axios';
import { config } from '@/constants/config';
import { ApiError } from '@/lib/errors';

let readToken: () => string | null = () => null;

export function setAuthTokenGetter(getToken: () => string | null) {
  readToken = getToken;
}

export const api = axios.create({
  timeout: 12_000,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((request) => {
  request.baseURL = config.apiUrl;
  const token = readToken();
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  return request;
});

export function ensureApiConfigured(): void {
  if (!config.apiUrl) {
    throw new ApiError('Set EXPO_PUBLIC_API_URL before signing in, or continue in demo mode.');
  }
}
