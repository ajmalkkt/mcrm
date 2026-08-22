export interface AlertConfiguration {
  alert_id?: string | null;
  renewal_warning_days: number;
  expiry_warning_days: number;
  followup_reminder_days: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AlertConfigurationResponse {
  success: boolean;
  data: AlertConfiguration;
  message?: string;
}
