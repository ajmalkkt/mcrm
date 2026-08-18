import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardOverview } from '../api/dashboard';
import { DashboardOverviewResponse } from '../types/dashboard';
import { StatCard } from '../components/dashboard/StatCard';
import { ExpiringServicesTable, PendingFollowupsTable } from '../components/dashboard/AlertTables';
import { RoleBadge } from '../components/dashboard/RoleBadge';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardOverviewResponse['data'] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expiryDays, setExpiryDays] = useState<number>(30);

  useEffect(() => {
    fetchData(expiryDays);
  }, [expiryDays]);

  const fetchData = async (days: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDashboardOverview(days);
      if (response.success) {
        setData(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const isManagement = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      {/* Role & Greeting Banner */}
      {user && (
        <RoleBadge role={user.role} user={user} />
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {isManagement ? 'Management Overview' : 'My Workstation Summary'}
          </h1>
          <p className="text-xs text-slate-500">
            {isManagement 
              ? 'Real-time service lifecycle and agent performance indicators.' 
              : 'Your active accounts, upcoming service expirations, and calls.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="expiryFilter" className="text-xs font-semibold text-slate-600">
            Expiry Window:
          </label>
          <select
            id="expiryFilter"
            value={expiryDays}
            onChange={(e) => setExpiryDays(Number(e.target.value))}
            className="text-sm bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value={7}>Next 7 Days</option>
            <option value={15}>Next 15 Days</option>
            <option value={30}>Next 30 Days</option>
            <option value={60}>Next 60 Days</option>
          </select>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex items-center gap-3 text-slate-500">
            <svg className="w-6 h-6 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="font-medium text-sm">Loading dashboard analytics...</span>
          </div>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center justify-between">
          <span className="text-sm font-medium">{error}</span>
          <button
            onClick={() => fetchData(expiryDays)}
            className="px-3 py-1 bg-rose-600 text-white text-xs font-semibold rounded hover:bg-rose-700 transition"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={isManagement ? "Total Active Services" : "My Active Services"}
              value={data?.summary?.activeServices ?? 0}
              icon={
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              }
              color="emerald"
            />
            <StatCard
              title="Expiring Contracts"
              value={data?.summary?.expiringServices ?? 0}
              subtitle={`Within ${expiryDays} days`}
              icon={
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              }
              color="amber"
            />
            <StatCard
              title={isManagement ? "Team Follow-ups Due" : "My Pending Follow-ups"}
              value={data?.summary?.pendingFollowups ?? 0}
              icon={
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              }
              color="rose"
            />
            <StatCard
              title="Unassigned Prospects"
              value={data?.summary?.openProspects ?? 0}
              icon={
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              }
              color="indigo"
            />
          </div>

          {/* Feeds Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpiringServicesTable items={data?.alerts?.expiringServices || []} expiryDays={expiryDays} />
            <PendingFollowupsTable items={data?.alerts?.pendingFollowups || []} />
          </div>
        </>
      )}
    </div>
  );
};