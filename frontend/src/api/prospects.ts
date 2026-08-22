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

const buildMultipartForm = (payload: CreateProspectDTO | ConvertProspectPayload) => {
  const formData = new FormData();

  const appendValue = (key: string, value: unknown) => {
    if (value === undefined || value === null || value === '') return;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      formData.append(key, String(value));
      return;
    }
    if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
      return;
    }
    formData.append(key, JSON.stringify(value));
  };

  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'documents') {
      const files = Array.isArray(value) ? value.filter((item) => item instanceof File) : [];
      files.forEach((file) => formData.append('documents', file));
      return;
    }
    appendValue(key, value);
  });

  return formData;
};

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
    const hasFiles = Array.isArray(payload.documents) && payload.documents.some((doc) => doc instanceof File);
    const request = hasFiles ? buildMultipartForm(payload) : payload;
    const response = await apiClient.post('/prospects', request, hasFiles ? { headers: { 'Content-Type': 'multipart/form-data' } } : {});
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
    const hasFiles = Array.isArray(payload.documents) && payload.documents.some((doc) => doc instanceof File);
    const request = hasFiles ? buildMultipartForm(payload) : payload;
    const response = await apiClient.post<ConvertProspectResponse>(
      `/prospects/${prospectId}/convert`,
      request,
      hasFiles ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}
    );
    return response.data;
  }
};