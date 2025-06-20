'use client';

import React from 'react';
import { MenuIcon, SearchIcon, BellIcon } from '../../../libs/ui/Icons';
import { useAuth } from '../../../libs/hooks/authProvider';

interface TopbarProps {
  onMobileMenuClick: () => void;
  isSidebarCollapsed: boolean;
}

const Topbar: React.FC<TopbarProps> = ({ onMobileMenuClick, isSidebarCollapsed }) => {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-surface border-b border-border/20">
      {/* Mobile Menu & Search */}
      <div className="flex items-center">
        <button
          onClick={onMobileMenuClick}
          className="mr-4 md:hidden text-text-secondary hover:text-text"
          aria-label="Open mobile menu"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        <div className="relative hidden md:block">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
          <input
            type="search"
            placeholder="Search..."
            className="w-full max-w-xs pl-10 pr-4 py-2 rounded-lg bg-background border border-border/50 focus:ring-2 focus:ring-focus-ring/50 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        <button
          className="relative text-text-secondary hover:text-text"
          aria-label="Notifications"
        >
          <BellIcon className="h-6 w-6" />
          <span className="absolute top-0 right-0 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
        </button>

        {user ? (
          <div className="flex items-center gap-3">
            <img
              src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.email}&background=random`}
              alt="User Avatar"
              className="h-9 w-9 rounded-full object-cover border-2 border-border/50"
            />
            <div className="hidden sm:flex flex-col text-right">
                <span className="font-semibold text-sm text-text">{user.email}</span>
                <span className="text-xs text-text-secondary">{user.role}</span>
            </div>
          </div>
        ) : (
          <div className="h-9 w-9 rounded-full bg-gray-300 animate-pulse"></div>
        )}
      </div>
    </header>
  );
};

export default Topbar; 