export const env = {
  appName: import.meta.env.VITE_APP_TITLE || 'Mini-CRM',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  enableMockApi: import.meta.env.VITE_ENABLE_MOCK_API === 'true',
  maxUploadSizeMB: parseInt(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB || '50', 10),
  defaultAlertDays: parseInt(import.meta.env.VITE_DEFAULT_ALERT_THRESHOLD_DAYS || '30', 10),
  mapTileUrl: import.meta.env.VITE_MAP_TILES_PROVIDER_URL,
} as const;