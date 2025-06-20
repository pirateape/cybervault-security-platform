'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DashboardIcon,
  OrganizationsIcon,
  RulesIcon,
  AuditLogIcon,
  ReportsIcon,
  ChevronLeftIcon,
} from '../../../libs/ui/Icons';

interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { href: '/dashboard/organizations', label: 'Organizations', icon: OrganizationsIcon },
  { href: '/dashboard/rules', label: 'Rules', icon: RulesIcon },
  { href: '/dashboard/audit-log', label: 'Audit Log', icon: AuditLogIcon },
  { href: '/dashboard/reports', label: 'Reports', icon: ReportsIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, isMobileOpen, onToggle, onMobileClose }) => {
  const pathname = usePathname();

  const sidebarClasses = `
    flex flex-col bg-surface text-text-secondary
    transition-all duration-300 ease-in-out
    ${isCollapsed ? 'w-20' : 'w-64'}
    hidden md:flex
  `;

  const mobileSidebarClasses = `
    fixed inset-y-0 left-0 z-40
    flex flex-col bg-surface text-text-secondary
    w-64 transform transition-transform duration-300 ease-in-out
    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
    md:hidden
  `;
  
  const NavLink = ({ item, isCollapsed }: { item: typeof navItems[0], isCollapsed: boolean }) => {
    const isActive = pathname === item.href;
    return (
        <Link
            href={item.href}
            className={`flex items-center p-4 my-1 rounded-lg transition-colors duration-200
                ${isCollapsed ? 'justify-center' : ''}
                ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-primary/5'}`}
            title={isCollapsed ? item.label : undefined}
        >
            <item.icon className="h-5 w-5" />
            {!isCollapsed && <span className="ml-4 font-medium">{item.label}</span>}
        </Link>
    );
  };
  
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 h-16 border-b border-border/20">
        {!isCollapsed && <h1 className="text-xl font-bold text-text">CyberVault</h1>}
        <button
          onClick={onToggle}
          className="p-1 rounded-full hover:bg-primary/10 hidden md:block"
          title="Toggle Sidebar"
        >
          <ChevronLeftIcon className={`h-5 w-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <nav className="flex-1 p-2">
        {navItems.map((item) => <NavLink key={item.href} item={item} isCollapsed={isCollapsed} />)}
      </nav>
      {/* Add user profile / settings section here if needed */}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={sidebarClasses}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onMobileClose}></div>
      )}
      <aside className={mobileSidebarClasses}>
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar; 