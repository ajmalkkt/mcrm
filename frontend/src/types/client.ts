/**
 * Create or update your type definitions
 * This file contains TypeScript types related to client services
 * and accounts.
 */
export type ServiceStatus = 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'PENDING_PROVISION' | 'SUSPENDED';

export interface ClientService {
  client_service_id: string;
  account_id: string;
  plan_name: string;
  product_name: string;
  billing_cycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  start_date: string;
  end_date: string;
  status: ServiceStatus;
}

export interface ClientServiceInput {
  plan_id: string;
  plan_name?: string;
  product_name?: string;
  start_date?: string;
  end_date?: string;
  status?: ServiceStatus;
}

export interface ClientAccount {
  account_id: string;
  client_code?: string;
  client_name: string;
  contact_number: string;
  secondary_contact_number?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  services: ClientService[];
}