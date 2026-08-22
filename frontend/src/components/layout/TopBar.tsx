import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Settings, Menu, X } from 'lucide-react';

export const TopBar: React.FC<{ onMenuClick?: () => void; menuOpen?: boolean }> = ({ onMenuClick, menuOpen = false }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-surface-container-lowest border-b border-outline-variant h-16 fixed top-0 right-0 left-0 lg:left-[260px] 
      flex items-center justify-between px-margin-desktop w-full lg:w-[calc(100%-260px)] z-40 transition-all duration-200 ease-in-out">
      
      {/* Left: Menu Button + Product Name */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-on-surface-variant hover:text-secondary-container hover:bg-surface-container-high rounded-full transition-colors"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <span className="font-headline-sm text-headline-sm font-black text-primary">TelecomPro CRM</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-6">
        {/* Search Bar - Hidden on Mobile */}
        <div className="relative hidden lg:block w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: '18px' }}>
            search
          </span>
          <input
            className="w-full bg-surface-container pl-10 pr-4 py-2 rounded-full border-none text-body-md focus:ring-1 focus:ring-primary-container outline-none placeholder:text-on-surface-variant/70"
            placeholder="Search CRM..."
            type="text"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button className="p-2 text-on-surface-variant hover:text-secondary-container hover:bg-surface-container-high rounded-full transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
          </button>
          <button className="p-2 text-on-surface-variant hover:text-secondary-container hover:bg-surface-container-high rounded-full transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-8 w-[1px] bg-outline-variant mx-2"></div>

        {/* User Profile Dropdown */}
        <div className="flex items-center gap-3 relative" ref={menuRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 hover:bg-surface-container-high rounded-lg px-2 py-1 transition-colors focus:outline-none"
          >
            <div className="text-right hidden sm:block">
              <div className="font-label-md text-label-md text-primary">{user?.username || 'User'}</div>
              <div className="font-label-sm text-label-sm text-on-surface-variant capitalize">{user?.role.toLowerCase() || 'Agent'}</div>
            </div>
            <img
              alt="User Avatar"
              className="w-9 h-9 rounded-full object-cover border border-outline-variant"
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant py-1 z-50 top-full">
              <div className="px-4 py-3 border-b border-outline-variant">
                <p className="font-label-md text-label-md text-on-surface">{user?.username}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">{user?.email}</p>
                <span className="inline-flex items-center gap-1.5 mt-1 text-label-sm font-label-md bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified_user</span>
                  {user?.role}
                </span>
              </div>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2.5 text-label-md font-label-md text-error hover:bg-error-container/20 flex items-center gap-2 transition"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
