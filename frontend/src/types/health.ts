export interface HealthResponse {
  status: 'UP' | 'DOWN';
  timestamp: string;
  database: {
    connected: boolean;
    time?: string;
    error?: string;
  };
}

export interface LivenessResponse {
  status: string;
  uptime: number;
}