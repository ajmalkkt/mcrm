import { apiClient } from './client';
import { AuthResponse, User } from '../types/auth';

export const loginApi = async (credentials: { username: string; password: string }): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
  return response.data;
};

export const getProfileApi = async (): Promise<{ user: User }> => {
  const response = await apiClient.get<{ user: User }>('/auth/me');
  return response.data;
};