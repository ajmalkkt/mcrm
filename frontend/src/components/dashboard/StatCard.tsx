import React from 'react';

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'emerald' | 'amber' | 'rose' | 'indigo';
}

const colorMap = {
  emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  amber: 'text-amber-600 bg-amber-50 border-amber-100',
  rose: 'text-rose-600 bg-rose-50 border-rose-100',
  indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
};

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color }) => {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{value?.toLocaleString() ?? 0}</h3>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className={`p-2.5 rounded-lg border ${colorMap[color]}`}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon}
        </svg>
      </div>
    </div>
  );
};