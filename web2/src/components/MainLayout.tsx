import React, { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Providers } from './Providers';

export function MainLayout({ children, pageTitle }: { children: ReactNode; pageTitle?: string }) {
  return (
    <Providers>
      <div className="app">
        <Sidebar />
        <div className="main">
          <Topbar pageTitle={pageTitle} />
          <div className="page">
            {children}
          </div>
        </div>
      </div>
    </Providers>
  );
}
