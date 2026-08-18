import React from 'react';
import { ClientAccountsTable } from '../components/ClientAccountsTable';

export const ClientAccountsPage: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Client Accounts & Subscriptions</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor enterprise accounts, assigned active services, and subscription contract terms.
        </p>
      </div>

      <ClientAccountsTable />
    </div>
  );
};