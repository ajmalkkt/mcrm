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
    <div className="p-margin-desktop bg-background flex-1">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-stack-lg">
        <div>
          <h2 className="font-display-lg text-display-lg text-primary">
            {isManagement ? 'Command Center' : 'My Daily Focus'}
          </h2>
          <p className="text-body-lg text-on-surface-variant mt-1">
            {isManagement 
              ? 'High-level management overview and pending actions.' 
              : 'Review your urgent tasks and daily metrics to prioritize your workflow.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bg-surface-container border border-outline-variant text-on-surface px-4 py-2 rounded-lg font-label-md text-label-md flex items-center gap-2 hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
            Export Report
          </button>
          <button className="bg-primary-container text-on-primary font-label-md text-label-md px-4 py-2 rounded-lg hover:bg-primary transition-colors shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            New Account
          </button>
        </div>
      </div>

      {/* KPI Widgets (Bento-style Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-stack-lg">
        {/* Widget 1: Total Active Services */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md shadow-[0px_4px_12px_rgba(0,0,0,0.05)] relative overflow-hidden group hover:border-secondary transition-colors">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#10B981]"></div>
          <div className="flex justify-between items-start mb-4 pl-2">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant">Total Active Services</p>
              <h3 className="font-display-lg text-display-lg text-primary mt-1">{data?.summary?.activeServices ?? 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981]">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>router</span>
            </div>
          </div>
          <div className="flex items-center gap-1 pl-2 font-label-sm text-label-sm text-[#10B981]">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span>
            <span>+4.2% from last month</span>
          </div>
        </div>

        {/* Widget 2: Expiring Contracts */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md shadow-[0px_4px_12px_rgba(0,0,0,0.05)] relative overflow-hidden group hover:border-error transition-colors">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-error"></div>
          <div className="flex justify-between items-start mb-4 pl-2">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant">Expiring (30 Days)</p>
              <h3 className="font-display-lg text-display-lg text-primary mt-1">{data?.summary?.expiringServices ?? 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center text-on-error-container">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>warning</span>
            </div>
          </div>
          <div className="flex items-center gap-1 pl-2 font-label-sm text-label-sm text-error">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span>
            <span>+12 pending renewal</span>
          </div>
        </div>

        {/* Widget 3: Team Follow-ups Due */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md shadow-[0px_4px_12px_rgba(0,0,0,0.05)] relative overflow-hidden group hover:border-secondary transition-colors">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F59E0B]"></div>
          <div className="flex justify-between items-start mb-4 pl-2">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant">Follow-ups Due Today</p>
              <h3 className="font-display-lg text-display-lg text-primary mt-1">{data?.summary?.pendingFollowups ?? 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B]">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>assignment_late</span>
            </div>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 ml-2">
            <div className="bg-[#F59E0B] h-1.5 rounded-full" style={{ width: '65%' }}></div>
          </div>
        </div>

        {/* Widget 4: Unassigned Prospects */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md shadow-[0px_4px_12px_rgba(0,0,0,0.05)] relative overflow-hidden group hover:border-secondary transition-colors">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary-container"></div>
          <div className="flex justify-between items-start mb-4 pl-2">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant">Unassigned Prospects</p>
              <h3 className="font-display-lg text-display-lg text-primary mt-1">{data?.summary?.openProspects ?? 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_add</span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex items-center gap-3 text-on-surface-variant">
            <div className="w-6 h-6 animate-spin text-primary border-2 border-primary-container rounded-full border-t-primary"></div>
            <span className="font-body-md text-body-md">Loading dashboard analytics...</span>
          </div>
        </div>
      ) : error ? (
        <div className="p-4 bg-error-container border border-error rounded-lg text-on-error-container flex items-center justify-between">
          <span className="font-body-md text-body-md font-medium">{error}</span>
          <button
            onClick={() => fetchData(expiryDays)}
            className="px-3 py-1 bg-error text-on-error text-label-md font-label-md rounded hover:opacity-90 transition"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Main Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
            {/* Left Column (Wider): Expiring Services List */}
            <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.05)] flex flex-col">
              <div className="p-stack-md border-b border-outline-variant flex justify-between items-center">
                <h3 className="font-headline-md text-headline-md text-primary">Expiring Services Action Required</h3>
                <button className="text-secondary font-label-md text-label-md hover:underline">View All ({data?.summary?.expiringServices || 0})</button>
              </div>
              <div className="overflow-x-auto flex-1">
                <ExpiringServicesTable items={data?.alerts?.expiringServices || []} expiryDays={expiryDays} />
              </div>
            </div>

            {/* Right Column (Narrower): Pending Team Follow-ups */}
            <div className="lg:col-span-1 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.05)] flex flex-col">
              <div className="p-stack-md border-b border-outline-variant flex justify-between items-center">
                <h3 className="font-headline-sm text-headline-sm text-primary">Team Follow-ups</h3>
                <button className="text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>filter_list</span>
                </button>
              </div>
              <div className="p-stack-sm flex-1 overflow-y-auto">
                <PendingFollowupsTable items={data?.alerts?.pendingFollowups || []} />
              </div>
              <div className="p-stack-sm border-t border-outline-variant text-center">
                <button className="text-secondary font-label-md text-label-md hover:underline w-full py-1">View All Follow-ups</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};