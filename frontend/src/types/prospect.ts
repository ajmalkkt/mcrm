import { User } from './auth';

export type ProspectStatus = 'NEW' | 'IN_PROGRESS' | 'CONVERTED' | 'REJECTED';

export interface MasterProduct {
  product_id: string;
  product_name: string;
  description?: string;
  price?: number;
}

export interface Prospect {
  prospect_id: string;
  prospect_name: string;
  contact_number: string;
  email: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null; 
  geo_location?: string | null;
  preferred_product_id?: string | null;
  product_name?: string | null; // Joined field from Master_Product
  preferred_plan_id?: string | null;
  status: ProspectStatus;
  created_at: string;
}

export interface CreateProspectDTO {
  prospect_name: string;
  contact_number: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  geo_location?: string;
  preferred_product_id?: string;
  preferred_plan_id?: string;
  status?: ProspectStatus;
}

export interface UpdateProspectDTO extends Partial<CreateProspectDTO> {
  status?: ProspectStatus;
}

export interface ConvertProspectPayload {
  account_id: string; // Business Account Number
  client_name: string;
  contact_number: string;
  secondary_contact_number?: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ConvertProspectResponse {
  success: boolean;
  message: string;
  data: {
    account_id: string;
    client_name: string;
    email: string;
    created_at: string;
  };
}

export interface ProspectListResponse {
  success: boolean;
  data: Prospect[];
  total: number;
}