import { apiClient } from './client';
import { 
  Prospect, 
  MasterProduct,
  CreateProspectDTO, 
  UpdateProspectDTO, 
  ConvertProspectPayload, 
  ConvertProspectResponse,
  ProspectListResponse
} from '../types/prospect';

export const prospectsApi = {
  getProspects: async (status?: string): Promise<ProspectListResponse> => {
    const response = await apiClient.get('/prospects', { params: { status } });
    return response.data;
  },

  getProspectById: async (id: string): Promise<{ success: boolean; data: Prospect }> => {
    const response = await apiClient.get(`/prospects/${id}`);
    return response.data;
  },

  createProspect: async (payload: CreateProspectDTO): Promise<{ success: boolean; data: Prospect }> => {
    const response = await apiClient.post('/prospects', payload);
    return response.data;
  },

  // Master product list for dropdown
  getMasterProducts: async (): Promise<{ success: boolean; data: MasterProduct[] }> => {
    const response = await apiClient.get('/master-products');
    return response.data;
  },

  updateProspect: async (id: string, payload: UpdateProspectDTO): Promise<{ success: boolean; data: Prospect }> => {
    const response = await apiClient.patch(`/prospects/${id}`, payload);
    return response.data;
  },

  deleteProspect: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/prospects/${id}`);
    return response.data;
  },

  convertProspect: async (prospectId: string, payload: ConvertProspectPayload): Promise<ConvertProspectResponse> => {
    const response = await apiClient.post<ConvertProspectResponse>(
    `/prospects/${prospectId}/convert`, payload
    );
    return response.data;
  }
};