import { apiClient } from './client';
import { HealthResponse } from '../types/health';

export const getHealthStatus = async (): Promise<HealthResponse> => {
  const response = await apiClient.get<HealthResponse>('/health');
  return response.data;
};