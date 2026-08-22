import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Building2,
  Phone,
  MapPin,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Filter,
  Layers,
  Calendar,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { ClientAccount, ServiceStatus } from '../types/client';
import { fetchClientAccounts } from '../api/clientApi';

export const ClientAccountsTable: React.FC = () => {
  const [accounts, setAccounts] = useState<ClientAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'ALL'>('ALL');

  // Expanded Row IDs
  const [expandedAccountIds, setExpandedAccountIds] = useState<Set<string>>(new Set());

  // 1. Debounce Search Term (300ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // 2. Fetch Data from API
  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchClientAccounts({
        search: debouncedSearch,
        status: statusFilter,
      });
      setAccounts(data);
    } catch (err: any) {
      console.error('Failed to load client accounts:', err);
      setError(
        err.response?.data?.message || 'Failed to connect to backend server. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  // Trigger API re-fetch on debounced search or filter change
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Listen for cross-component client updates (e.g., prospect conversion or direct create)
  useEffect(() => {
    const handler = (e: any) => {
      loadAccounts();
    };
    window.addEventListener('clients-updated', handler as EventListener);
    return () => window.removeEventListener('clients-updated', handler as EventListener);
  }, [loadAccounts]);

  // Toggle row expand/collapse
  const toggleExpand = (accountId: string) => {
    setExpandedAccountIds((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  // Status Badge Component
  const renderStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Active
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Expired
          </span>
        );
      case 'TERMINATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Terminated
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Search and Filter Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search client name, account ID, or phone..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Filter & Refresh Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ServiceStatus | 'ALL')}
              className="border border-slate-300 rounded-lg py-2 px-3 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Services</option>
              <option value="EXPIRED">Expired Services</option>
              <option value="TERMINATED">Terminated Services</option>
            </select>
          </div>

          <button
            onClick={loadAccounts}
            disabled={isLoading}
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 focus:outline-none transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Alert Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadAccounts}
            className="px-3 py-1 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10"></th>
                <th className="py-3.5 px-4">Account Details</th>
                <th className="py-3.5 px-4">Contact & Location</th>
                <th className="py-3.5 px-4">Subscribed Services</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-sm font-medium text-slate-600 mt-3">Fetching accounts from database...</p>
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No client accounts found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Try adjusting your search query or status filter.
                    </p>
                  </td>
                </tr>
              ) : (
                accounts.map((account) => {
                  const isExpanded = expandedAccountIds.has(account.account_id);
                  const activeServicesCount = account.services.filter(
                    (s) => s.status === 'ACTIVE'
                  ).length;

                  return (
                    <React.Fragment key={account.account_id}>
                      {/* Main Account Row */}
                      <tr className="hover:bg-slate-50/80 transition-colors duration-150">
                        <td className="py-4 px-4">
                          <button
                            onClick={() => toggleExpand(account.account_id)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-indigo-600" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                          </button>
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-semibold text-slate-900">{account.client_name}</div>
                          <div className="text-xs font-mono text-indigo-600 mt-0.5">
                            #{account.account_id}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center text-slate-700 gap-1.5 text-xs font-medium">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {account.contact_number}
                          </div>
                          <div className="flex items-center text-slate-500 gap-1.5 text-xs mt-1 truncate max-w-xs">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{account.address}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                            <Layers className="w-3.5 h-3.5 text-indigo-500" />
                            {account.services.length} Total ({activeServicesCount} Active)
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => toggleExpand(account.account_id)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            {isExpanded ? 'Hide Plans' : 'View Plans'}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Nested Subscribed Services */}
                      {isExpanded && (
                        <tr className="bg-slate-50/60 border-b border-slate-200">
                          <td colSpan={5} className="py-4 px-6">
                            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-inner space-y-3">
                              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600" />
                                Subscribed Services for {account.client_name}
                              </h4>

                              {account.services.length === 0 ? (
                                <p className="text-xs text-slate-500 py-2 italic">
                                  No service subscriptions attached to this account.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {account.services.map((service) => (
                                    <div
                                      key={service.client_service_id}
                                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 hover:border-indigo-200 transition-all"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <p className="text-xs font-bold text-slate-800">
                                            {service.product_name}
                                          </p>
                                          <p className="text-xs text-slate-500">{service.plan_name}</p>
                                        </div>
                                        {renderStatusBadge(service.status)}
                                      </div>

                                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                                        <div className="flex items-center gap-1">
                                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                          <span>
                                            {service.start_date} to {service.end_date}
                                          </span>
                                        </div>
                                        <span className="font-semibold text-slate-700 bg-slate-200/60 px-1.5 py-0.5 rounded text-[10px]">
                                          {service.billing_cycle}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};