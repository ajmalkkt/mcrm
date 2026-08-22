import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building, 
  PhoneCall,
  Settings,
  User,
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Prospects', path: '/prospects', icon: Users },
  { label: 'Client Accounts', path: '/accounts', icon: Building },
  { label: 'Call Logs', path: '/call-logs', icon: PhoneCall },
];

const bottomNavItems = [
  { label: 'Profile', path: '/profile', icon: User },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC<{ open?: boolean; onClose?: () => void }> = ({ open = true, onClose }) => {
  const { logout } = useAuth();

  return (
    <nav className={`
      fixed lg:static inset-y-0 left-0 z-50 w-[260px] h-screen 
      bg-surface border-r border-outline-variant shadow-sm 
      flex flex-col py-stack-lg px-gutter
      transition-transform duration-200 ease-in-out lg:translate-x-0
      ${open ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Header Brand */}
      <div className="mb-stack-lg flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-on-primary-container" style={{ fontSize: '20px' }}>
            cell_tower
          </span>
        </div>
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">TelecomPro</h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant">Enterprise ISP CRM</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="flex flex-col gap-1 mt-stack-md flex-grow">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg font-label-md text-label-md
                  cursor-pointer active:scale-95 transition-transform
                  ${
                    isActive
                      ? 'bg-secondary-container text-on-secondary-container font-bold'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:bg-secondary-fixed-dim/20 transition-colors'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>

      {/* Bottom Navigation + Logout */}
      <div className="mt-auto pt-stack-md border-t border-outline-variant">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg font-label-md text-label-md
                cursor-pointer active:scale-95 transition-transform
                ${
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:bg-secondary-fixed-dim/20 transition-colors'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <button
          onClick={() => {
            logout();
            onClose?.();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-label-md text-label-md
          text-on-surface-variant hover:bg-surface-container-high hover:bg-error/10 hover:text-error transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
};
