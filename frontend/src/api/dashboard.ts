import { apiClient } from './client';
import { DashboardOverviewResponse } from '../types/dashboard';

export const getDashboardOverview = async (expiryDays: number = 30): Promise<DashboardOverviewResponse> => {
  const response = await apiClient.get<DashboardOverviewResponse>('/dashboard/overview', {
    params: { expiryDays },
  });
  return response.data;
};