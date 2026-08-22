import React, { useState, useEffect, useMemo } from 'react';
import {
  Prospect,
  ProspectStatus
} from '../types/prospect';
import { prospectsApi } from '../api/prospects';
import { AddProspectModal } from '../components/prospects/AddProspectModal';
import { ConvertProspectModal } from '../components/prospects/ConvertModal';
import { useScreenProtection } from '../hooks/useScreenProtection';
import { 
  Users, 
  Plus, 
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

const STATUS_CONFIG: Record<ProspectStatus, { label: string; color: string; badge: string; icon: string }> = {
  NEW: { 
    label: 'New', 
    color: 'bg-blue-500/10 border-blue-200 text-blue-700', 
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: 'new_label'
  },
  IN_PROGRESS: { 
    label: 'Qualifying', 
    color: 'bg-amber-500/10 border-amber-200 text-amber-700', 
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: 'hourglass_top'
  },
  CONVERTED: { 
    label: 'Converted', 
    color: 'bg-emerald-500/10 border-emerald-200 text-emerald-700', 
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: 'check_circle'
  },
  REJECTED: { 
    label: 'Rejected', 
    color: 'bg-rose-500/10 border-rose-200 text-rose-700', 
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    icon: 'cancel'
  }
};

const KANBAN_STAGES: ProspectStatus[] = ['NEW', 'IN_PROGRESS', 'CONVERTED', 'REJECTED'];

export const ProspectsPage: React.FC = () => {
  useScreenProtection(true);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Views
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [conversionProspect, setConversionProspect] = useState<Prospect | null>(null);
  const [showConversionModal, setShowConversionModal] = useState<boolean>(false);

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

  // Handle Conversion Modal 
  const handleOpenConversion = (prospect: Prospect) => {
    setConversionProspect(prospect);
    setShowConversionModal(true);
  };

  const handleDeleteProspect = async (prospectId: string) => {
    if (!window.confirm('Delete this prospect from the pipeline?')) {
      return;
    }

    try {
      await prospectsApi.deleteProspect(prospectId);
      setProspects((prev) => prev.filter((p) => p.prospect_id !== prospectId));
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete prospect');
    }
  };

  const handleReadyProspect = async (prospectId: string) => {
    try {
      await prospectsApi.updateProspect(prospectId, { status: 'IN_PROGRESS' });
      setProspects((prev) =>
        prev.map((p) =>
          p.prospect_id === prospectId ? { ...p, status: 'IN_PROGRESS' as ProspectStatus } : p
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update prospect status');
    }
  };

  // Handle Conversion Complete
  const handleConversionComplete = (prospectId: string, accountId: string) => {
    setProspects(prev => 
      prev.map(p => 
        p.prospect_id === prospectId 
          ? { ...p, status: 'CONVERTED' as ProspectStatus }
          : p
      )
    );
    setShowConversionModal(false);
    setConversionProspect(null);
  };

  return (
    <div className="p-margin-desktop bg-background flex-1">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-stack-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary" style={{ fontSize: '28px' }}>person_search</span>
            <h1 className="font-display-lg text-display-lg text-primary">Lead Qualification Pipeline</h1>
          </div>
          <p className="text-body-lg text-on-surface-variant mt-1">
            Track, qualify, and convert prospective clients through your acquisition pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProspects}
            className="p-2 text-on-surface-variant hover:text-secondary-container hover:bg-surface-container border border-outline-variant rounded-lg transition"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container font-label-md text-label-md px-4 py-2.5 rounded-lg shadow-sm hover:bg-secondary transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Prospect</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Filters & View Toggles */}
      <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 mb-stack-lg">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: '18px' }}>search</span>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-body-md pl-9 pr-3 py-2 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-surface-container-low"
          />
        </div>

        {/* Filters and View Switcher */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-label-md font-label-md text-on-surface-variant">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-label-md bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
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
          <div className="flex items-center bg-surface-container p-1 rounded-lg border border-outline-variant">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-label-md font-label-md transition ${
                viewMode === 'kanban'
                  ? 'bg-surface-container-lowest text-secondary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-label-md font-label-md transition ${
                viewMode === 'list'
                  ? 'bg-surface-container-lowest text-secondary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <List className="w-4 h-4" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex items-center gap-3 text-on-surface-variant">
            <div className="w-6 h-6 animate-spin text-secondary border-2 border-secondary-fixed rounded-full border-t-secondary"></div>
            <span className="font-body-md text-body-md">Loading prospects pipeline...</span>
          </div>
        </div>
      ) : error ? (
        <div className="p-4 bg-error-container border border-error rounded-lg text-on-error-container flex items-center justify-between text-label-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={fetchProspects}
            className="px-3 py-1 bg-error text-on-error font-label-md rounded hover:opacity-90 transition"
          >
            Retry
          </button>
        </div>
      ) : filteredProspects.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center max-w-md mx-auto">
          <Users className="w-10 h-10 text-on-surface-variant/40 mx-auto mb-3" />
          <h3 className="font-headline-md text-headline-md text-on-surface">No Prospects Found</h3>
          <p className="text-body-md text-on-surface-variant mt-1">
            {searchQuery || selectedStatus !== 'ALL'
              ? 'Try adjusting your search criteria or status filter.'
              : 'Get started by creating your first sales prospect.'}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container font-label-md px-4 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add Prospect</span>
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {KANBAN_STAGES.map((stage) => {
            const stageProspects = filteredProspects.filter((p) => p.status === stage);
            const stageInfo = STATUS_CONFIG[stage];

            return (
              <div
                key={stage}
                className="bg-surface-container-low border border-outline-variant rounded-xl p-stack-md flex flex-col min-h-[500px]"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-stack-sm border-b border-outline-variant mb-stack-sm px-1">
                  <span className={`text-label-md font-label-md uppercase tracking-wider px-2 py-0.5 rounded border ${stageInfo.badge}`}>
                    {stageInfo.label}
                  </span>
                  <span className="text-label-md font-label-md text-on-surface-variant bg-surface-container-lowest border border-outline-variant px-2 py-0.5 rounded-full">
                    {stageProspects.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] pr-1">
                  {stageProspects.map((prospect) => (
                    <div
                      key={prospect.prospect_id}
                      className="bg-surface-container-lowest p-stack-md rounded-lg border border-outline-variant shadow-sm hover:shadow-md transition space-y-stack-sm"
                    >
                      <div>
                        <h4 className="font-headline-sm text-headline-sm text-primary line-clamp-1">
                          {prospect.prospect_name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-label-sm text-on-surface-variant mt-0.5">
                          <Mail className="w-3 h-3 text-on-surface-variant/60" />
                          <span className="truncate">{prospect.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-label-sm text-on-surface-variant mt-0.5">
                          <Phone className="w-3 h-3 text-on-surface-variant/60" />
                          <span>{prospect.contact_number}</span>
                        </div>
                      </div>

                      {/* Product Tag */}
                      {prospect.product_name && (
                        <div className="flex items-center gap-1 bg-secondary-fixed text-on-secondary-fixed text-label-sm font-label-md px-2 py-1 rounded">
                          <Package className="w-3 h-3" />
                          <span className="truncate">{prospect.product_name}</span>
                        </div>
                      )}

                      {/* Address / Location */}
                      {prospect.address && (
                        <div className="flex items-start gap-1 text-label-sm text-on-surface-variant">
                          <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{prospect.address}</span>
                        </div>
                      )}

                      {/* Created Date */}
                      <div className="flex items-center justify-between pt-2 border-t border-outline-variant text-label-sm text-on-surface-variant">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(prospect.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant">
                        {prospect.status === 'NEW' && (
                          <button
                            onClick={() => handleReadyProspect(prospect.prospect_id)}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-label-md text-label-md px-2 py-1.5 rounded transition"
                          >
                            Mark Ready
                          </button>
                        )}

                        {prospect.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleOpenConversion(prospect)}
                            className="w-full bg-secondary-container text-on-secondary-container font-label-md text-label-md px-2 py-1.5 rounded hover:bg-secondary transition"
                          >
                            Convert to Client
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteProspect(prospect.prospect_id)}
                          className="w-full border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 font-label-md text-label-md px-2 py-1.5 rounded transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {stageProspects.length === 0 && (
                    <div className="text-center py-8 text-label-md text-on-surface-variant/60 border border-dashed border-outline-variant rounded-lg">
                      No prospects in {stageInfo.label}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th className="text-left p-4 font-label-md text-label-md text-on-surface-variant">Name</th>
                <th className="text-left p-4 font-label-md text-label-md text-on-surface-variant">Contact</th>
                <th className="text-left p-4 font-label-md text-label-md text-on-surface-variant">Product</th>
                <th className="text-left p-4 font-label-md text-label-md text-on-surface-variant">Status</th>
                <th className="text-left p-4 font-label-md text-label-md text-on-surface-variant">Added</th>
                <th className="text-right p-4 font-label-md text-label-md text-on-surface-variant">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProspects.map((prospect) => (
                <tr key={prospect.prospect_id} className="border-b border-outline-variant hover:bg-surface-container-low transition">
                  <td className="p-4">
                    <div className="font-body-md text-on-surface">{prospect.prospect_name}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-body-md text-on-surface-variant">{prospect.email}</div>
                    <div className="text-label-sm text-on-surface-variant">{prospect.contact_number}</div>
                  </td>
                  <td className="p-4">
                    <span className="text-label-md text-on-surface">{prospect.product_name || '-'}</span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-1 rounded text-label-sm font-label-md ${STATUS_CONFIG[prospect.status].badge}`}>
                      {STATUS_CONFIG[prospect.status].label}
                    </span>
                  </td>
                  <td className="p-4 text-label-md text-on-surface-variant">
                    {new Date(prospect.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {prospect.status === 'NEW' && (
                        <button
                          onClick={() => handleReadyProspect(prospect.prospect_id)}
                          className="text-amber-700 hover:text-amber-900 font-label-md text-label-md"
                        >
                          Ready
                        </button>
                      )}

                      {prospect.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleOpenConversion(prospect)}
                          className="text-secondary-container hover:text-secondary font-label-md text-label-md"
                        >
                          Convert →
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteProspect(prospect.prospect_id)}
                        className="text-rose-700 hover:text-rose-900 font-label-md text-label-md"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <AddProspectModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleProspectCreated}
      />
      
      <ConvertProspectModal
        isOpen={showConversionModal}
        prospect={conversionProspect}
        onClose={() => {
          setShowConversionModal(false);
          setConversionProspect(null);
        }}
        onSuccess={handleConversionComplete}
      />
    </div>
  );
};