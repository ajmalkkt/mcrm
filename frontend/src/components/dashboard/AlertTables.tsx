import React from 'react';
import { ExpiringServiceAlert, PendingFollowupAlert } from '../../types/dashboard';

interface ExpiringServicesTableProps {
  items: ExpiringServiceAlert[];
  expiryDays: number;
}

export const ExpiringServicesTable: React.FC<ExpiringServicesTableProps> = ({ items, expiryDays }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
      <h2 className="text-base font-semibold text-slate-800">Expiring Services Feed</h2>
      <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 font-medium rounded-md border border-amber-200">
        {items.length} Alerts
      </span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-slate-600">
        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
          <tr>
            <th className="p-3">Client</th>
            <th className="p-3">Plan</th>
            <th className="p-3">End Date</th>
            <th className="p-3 text-right">Days Left</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.length > 0 ? (
            items.map((item) => (
              <tr key={item.client_service_id} className="hover:bg-slate-50/80 transition">
                <td className="p-3 font-medium text-slate-800">
                  {item.client_name}
                  <div className="text-[11px] text-slate-400 font-normal">{item.account_id}</div>
                </td>
                <td className="p-3">{item.plan_name}</td>
                <td className="p-3 whitespace-nowrap">{new Date(item.end_date).toLocaleDateString()}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                    item.days_remaining <= 7 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.days_remaining}d
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="p-6 text-center text-slate-400">
                No service contracts expiring within {expiryDays} days.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

interface PendingFollowupsTableProps {
  items: PendingFollowupAlert[];
}

export const PendingFollowupsTable: React.FC<PendingFollowupsTableProps> = ({ items }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
      <h2 className="text-base font-semibold text-slate-800">Pending Follow-ups Feed</h2>
      <span className="text-xs px-2 py-1 bg-rose-50 text-rose-700 font-medium rounded-md border border-rose-200">
        {items.length} Pending
      </span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-slate-600">
        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
          <tr>
            <th className="p-3">Entity</th>
            <th className="p-3">Follow-up Date</th>
            <th className="p-3">Remarks</th>
            <th className="p-3">Logged By</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.length > 0 ? (
            items.map((item) => (
              <tr key={item.log_id} className="hover:bg-slate-50/80 transition">
                <td className="p-3 font-medium text-slate-800">
                  <span className="inline-block px-1.5 py-0.5 text-[10px] rounded font-semibold bg-slate-100 text-slate-600 mr-2">
                    {item.entity_type}
                  </span>
                  {item.entity_id}
                </td>
                <td className="p-3 whitespace-nowrap font-medium text-slate-700">
                  {new Date(item.followup_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="p-3 max-w-[180px] truncate" title={item.remarks}>
                  {item.remarks || '-'}
                </td>
                <td className="p-3 text-slate-500">{item.logged_by}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="p-6 text-center text-slate-400">
                No overdue or pending follow-ups required.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);