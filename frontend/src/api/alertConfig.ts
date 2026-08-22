import { apiClient } from './client';
import { AlertConfiguration, AlertConfigurationResponse } from '../types/alertConfig';

export const getAlertConfiguration = async (): Promise<AlertConfiguration> => {
  const response = await apiClient.get<AlertConfigurationResponse>('/alerts');
  return response.data.data;
};

export const saveAlertConfiguration = async (payload: Partial<AlertConfiguration>): Promise<AlertConfiguration> => {
  const response = await apiClient.put<AlertConfigurationResponse>('/alerts', payload);
  return response.data.data;
};
