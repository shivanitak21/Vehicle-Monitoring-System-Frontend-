import { config } from '@/constants/config';
import { toApiError } from '@/lib/errors';
import { api, ensureApiConfigured } from '@/services/api/client';
import type { AuthResponse, Role, User } from '@/types/models';

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  ensureApiConfigured();
  try {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function registerRequest(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
}): Promise<AuthResponse> {
  ensureApiConfigured();
  try {
    const response = await api.post<AuthResponse>('/auth/register', input);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function fetchMe(): Promise<User> {
  ensureApiConfigured();
  try {
    const response = await api.get<User>('/auth/me');
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function logoutRequest(): Promise<void> {
  if (!config.apiUrl) return;
  try {
    await api.post('/auth/logout');
  } catch {
    // Local sign-out still proceeds when the server is unreachable.
  }
}
