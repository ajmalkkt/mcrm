import React from 'react';
import { Role, User } from '../../types/auth';

interface RoleBadgeProps {
  role: Role;
  user: User;
}

const roleStyles: Record<Role, { label: string; badge: string }> = {
  ADMIN: {
    label: 'System Admin (Full Access)',
    badge: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  MANAGER: {
    label: 'Team Manager (Department Access)',
    badge: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  USER: {
    label: 'Field Agent (Assigned Targets)',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  }
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, user }) => {
  const current = roleStyles[role] || roleStyles.USER;

  // Construct display name gracefully with fallbacks
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const displayName = fullName.trim() || user?.username || user?.email || 'User';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-3">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Welcome back, {displayName}</h2>
        <p className="text-xs text-slate-500">
          {role === 'USER' 
            ? 'Viewing assigned client accounts, services, and pending calls.' 
            : 'Viewing aggregated organizational metrics and active team feeds.'}
        </p>
      </div>
      <div>
        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${current.badge}`}>
          {current.label}
        </span>
      </div>
    </div>
  );
};