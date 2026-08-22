import React, { useState } from 'react';
import { ClientAccountsTable } from '../components/ClientAccountsTable';
import { Plus } from 'lucide-react';
import { AddClientModal } from '../components/clients/AddClientModal';
import { useScreenProtection } from '../hooks/useScreenProtection';

export const ClientAccountsPage: React.FC = () => {
  useScreenProtection(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [tableKey, setTableKey] = useState(0);

  const handleClientCreated = (accountId?: string) => {
    // trigger remount/reload of table
    setTableKey((k) => k + 1);
  };
  return (
    <div className="p-margin-desktop bg-background flex-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-stack-lg">
        <div>
            <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary" style={{ fontSize: '28px' }}>business</span>
            <h1 className="font-display-lg text-display-lg text-primary">Client Accounts & Subscriptions</h1>
            </div>
            <p className="text-body-lg text-on-surface-variant mt-1">
            Monitor enterprise accounts, assigned active services, and subscription contract terms.
            </p>
        </div>

        <div className="flex items-center justify-end mb-4">
            <button onClick={() => setIsAddOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary text-white font-label-md text-label-md rounded-lg">
            <Plus className="w-4 h-4" />
            Add Client
            </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <ClientAccountsTable key={tableKey} />
      </div>

      <AddClientModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSuccess={handleClientCreated} />
    </div>
  );
};