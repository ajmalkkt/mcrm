export interface DashboardSummary {
  activeServices: number;
  expiringServices: number;
  pendingFollowups: number;
  openProspects: number;
}

export interface ExpiringServiceAlert {
  client_service_id: string;
  account_id: string;
  client_name: string;
  contact_number: string;
  plan_name: string;
  end_date: string;
  days_remaining: number;
}

export interface PendingFollowupAlert {
  log_id: string;
  entity_type: 'CLIENT_SERVICE' | 'PROSPECT';
  entity_id: string;
  call_timestamp: string;
  followup_date: string;
  remarks: string;
  logged_by: string;
}

export interface ProspectStatusBreakdown {
  NEW?: number;
  IN_PROGRESS?: number;
  CONVERTED?: number;
  REJECTED?: number;
  [key: string]: number | undefined;
}

export interface DashboardOverviewResponse {
  success: boolean;
  data: {
    summary: DashboardSummary;
    alerts: {
      expiringServices: ExpiringServiceAlert[];
      pendingFollowups: PendingFollowupAlert[];
    };
    prospectBreakdown: ProspectStatusBreakdown;
  };
}