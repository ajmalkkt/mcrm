import { apiClient } from './client'; // Import your global Axios instance configured with baseURL and JWT headers
import { ClientAccount, ServiceStatus } from '../types/client';

export interface GetClientsParams {
  search?: string;
  status?: ServiceStatus | 'ALL';
}

export interface GetClientsResponse {
  success: boolean;
  count: number;
  data: ClientAccount[];
}

/**
 * Fetch Client Accounts with joined services from Express backend
 * Endpoint: GET /api/v1/clients
 */
export const fetchClientAccounts = async (
  params?: GetClientsParams
): Promise<ClientAccount[]> => {
  const response = await apiClient.get<GetClientsResponse>('/api/v1/clients', {
    params: {
      ...(params?.search ? { search: params.search } : {}),
      ...(params?.status && params.status !== 'ALL' ? { status: params.status } : {}),
    },
  });

  return response.data.data;
};