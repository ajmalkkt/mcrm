import React, { useEffect, useState, useCallback } from 'react';
import { getHealthStatus } from '../api/health';
import { HealthResponse } from '../types/health';
import { CheckCircle2, XCircle, RefreshCw, Server, Database } from 'lucide-react';

export const HealthStatus: React.FC = () => {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getHealthStatus();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to reach backend service');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Poll every 15 seconds
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md border border-gray-200 space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-lg font-bold text-gray-800">System Diagnostic</h2>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          title="Refresh Status"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error ? (
        <div className="flex items-center space-x-3 p-3 bg-red-50 text-red-700 rounded-lg">
          <XCircle className="w-6 h-6 flex-shrink-0 text-red-500" />
          <div>
            <p className="font-semibold text-sm">Backend Offline</p>
            <p className="text-xs">{error}</p>
          </div>
        </div>
      ) : data ? (
        <div className="space-y-3">
          {/* Service Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">API Gateway</span>
            </div>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
              data.status === 'UP' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {data.status === 'UP' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <XCircle className="w-3.5 h-3.5 text-red-600" />}
              {data.status}
            </span>
          </div>

          {/* Database Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">PostgreSQL</span>
            </div>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
              data.database.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {data.database.connected ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <XCircle className="w-3.5 h-3.5 text-red-600" />}
              {data.database.connected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          <p className="text-xs text-right text-gray-400">
            Last checked: {new Date(data.timestamp).toLocaleTimeString()}
          </p>
        </div>
      ) : null}
    </div>
  );
};