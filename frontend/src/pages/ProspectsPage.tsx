import React, { useState, useEffect, useMemo } from 'react';
import { 
  Prospect, 
  ProspectStatus 
} from '../types/prospect';
import { prospectsApi } from '../api/prospects';
import { AddProspectModal } from '../components/prospects/AddProspectModal';
import { 
  Users, 
  Plus, 
  Search, 
  LayoutGrid, 
  List, 
  Phone, 
  Mail, 
  MapPin, 
  Package, 
  Calendar,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const STATUS_CONFIG: Record<ProspectStatus, { label: string; color: string; badge: string }> = {
  NEW: { 
    label: 'New', 
    color: 'bg-sky-500/10 border-sky-200 text-sky-700', 
    badge: 'bg-sky-100 text-sky-800 border-sky-300' 
  },
  IN_PROGRESS: { 
    label: 'In Progress', 
    color: 'bg-amber-500/10 border-amber-200 text-amber-700', 
    badge: 'bg-amber-100 text-amber-800 border-amber-300' 
  },
  CONVERTED: { 
    label: 'Converted', 
    color: 'bg-emerald-500/10 border-emerald-200 text-emerald-700', 
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' 
  },
  REJECTED: { 
    label: 'Rejected', 
    color: 'bg-rose-500/10 border-rose-200 text-rose-700', 
    badge: 'bg-rose-100 text-rose-800 border-rose-300' 
  }
};

const KANBAN_STAGES: ProspectStatus[] = ['NEW', 'IN_PROGRESS', 'CONVERTED', 'REJECTED'];

export const ProspectsPage: React.FC = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Views
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchProspects();
  }, []);

  const fetchProspects = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await prospectsApi.getProspects();
      if (res.success) {
        setProspects(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load prospects');
    } finally {
      setLoading(false);
    }
  };

  // Filtered Prospects
  const filteredProspects = useMemo(() => {
    return prospects.filter((p) => {
      const matchesSearch = 
        p.prospect_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contact_number.includes(searchQuery);

      const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [prospects, searchQuery, selectedStatus]);

  // Handle Prospect Created
  const handleProspectCreated = (newProspect: Prospect) => {
    setProspects((prev) => [newProspect, ...prev]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-800">Prospects Directory</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track, convert, and manage prospective clients through your acquisition pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProspects}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Prospect</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Filters & View Toggles */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters and View Switcher */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses ({prospects.length})</option>
              {KANBAN_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_CONFIG[s].label} ({prospects.filter((p) => p.status === s).length})
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === 'kanban'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex items-center gap-3 text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
            <span className="font-medium text-xs">Loading prospects pipeline...</span>
          </div>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={fetchProspects}
            className="px-3 py-1 bg-rose-600 text-white font-semibold rounded hover:bg-rose-700 transition"
          >
            Retry
          </button>
        </div>
      ) : filteredProspects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-md mx-auto">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No Prospects Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery || selectedStatus !== 'ALL'
              ? 'Try adjusting your search criteria or status filter.'
              : 'Get started by creating your first sales prospect.'}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add Prospect</span>
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        /* ================= KANBAN BOARD VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {KANBAN_STAGES.map((stage) => {
            const stageProspects = filteredProspects.filter((p) => p.status === stage);
            const stageInfo = STATUS_CONFIG[stage];

            return (
              <div
                key={stage}
                className="bg-slate-100/70 border border-slate-200 rounded-xl p-3 flex flex-col min-h-[500px]"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${stageInfo.badge}`}>
                      {stageInfo.label}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    {stageProspects.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] pr-1">
                  {stageProspects.map((prospect) => (
                    <div
                      key={prospect.prospect_id}
                      className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition space-y-3"
                    >
                      <div>
                        <h4 className="font-bold text-xs text-slate-800 line-clamp-1">
                          {prospect.prospect_name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{prospect.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{prospect.contact_number}</span>
                        </div>
                      </div>

                      {/* Product Tag */}
                      {prospect.product_name && (
                        <div className="flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-medium px-2 py-1 rounded">
                          <Package className="w-3 h-3" />
                          <span className="truncate">{prospect.product_name}</span>
                        </div>
                      )}

                      {/* Address / Location */}
                      {prospect.address && (
                        <div className="flex items-start gap-1 text-[10px] text-slate-400">
                          <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{prospect.address}</span>
                        </div>
                      )}

                      {/* Created Date */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(prospect.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {stageProspects.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-300 rounded-lg">
                      No prospects in {stageInfo.label}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= TABLE LIST VIEW ================= */
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Prospect / Company</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Preferred Service</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProspects.map((prospect) => {
                  const statusInfo = STATUS_CONFIG[prospect.status];
                  return (
                    <tr key={prospect.prospect_id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-3.5 font-bold text-slate-800">
                        {prospect.prospect_name}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-medium text-slate-700">{prospect.email}</div>
                        <div className="text-slate-400 text-[11px]">{prospect.contact_number}</div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {prospect.product_name ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                            <Package className="w-3 h-3 text-slate-500" />
                            {prospect.product_name}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${statusInfo.badge}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 max-w-xs truncate">
                        {prospect.address || prospect.geo_location || '-'}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {new Date(prospect.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Prospect Modal */}
      <AddProspectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleProspectCreated}
      />
    </div>
  );
};