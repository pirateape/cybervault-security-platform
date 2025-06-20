'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// organizations/page.tsx
// Modular, best-in-class multi-tenant dashboard entry point
// Uses Shadcn UI, Radix, Tailwind, DaisyUI, and best practices

import React, { useState, useEffect } from 'react';
import nextDynamic from 'next/dynamic';

// Dynamic imports to prevent SSR issues
const OrganizationList = nextDynamic(() => import('./widgets').then(m => ({ default: m.OrganizationList })), { ssr: false });
const TeamMembers = nextDynamic(() => import('./widgets').then(m => ({ default: m.TeamMembers })), { ssr: false });
const CredentialManager = nextDynamic(() => import('./widgets').then(m => ({ default: m.CredentialManager })), { ssr: false });
const OrgSwitcher = nextDynamic(() => import('./widgets').then(m => ({ default: m.OrgSwitcher })), { ssr: false });
const TenantReports = nextDynamic(() => import('./widgets').then(m => ({ default: m.TenantReports })), { ssr: false });
const RuleListWidget = nextDynamic(() => import('./widgets').then(m => ({ default: m.RuleListWidget })), { ssr: false });
const ErrorBoundary = nextDynamic(() => import('./widgets').then(m => ({ default: m.ErrorBoundary })), { ssr: false });

// TODO: Replace with actual user/org context from auth provider
const mockUserId = 'user-123';
const mockOrgId = 'org-123';

function OrganizationsDashboardContent() {
  const [currentOrgId, setCurrentOrgId] = useState(mockOrgId);
  // TODO: Replace with actual org switching logic
  const handleOrgSwitch = (org: { id: string }) => setCurrentOrgId(org.id);
  return (
    <main className="flex flex-col gap-8 p-4 max-w-7xl mx-auto">
      <section className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          {/* ErrorBoundary for OrganizationList */}
          <ErrorBoundary>
            <OrgSwitcher userId={mockUserId} currentOrgId={currentOrgId} onSwitch={handleOrgSwitch} />
            <OrganizationList userId={mockUserId} />
          </ErrorBoundary>
        </div>
        <div className="flex-1">
          {/* ErrorBoundary for TeamMembers */}
          <ErrorBoundary>
            <TeamMembers orgId={currentOrgId} />
          </ErrorBoundary>
        </div>
        <div className="flex-1">
          {/* ErrorBoundary for CredentialManager */}
          <ErrorBoundary>
            <CredentialManager orgId={currentOrgId} />
          </ErrorBoundary>
        </div>
      </section>
      <section className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          {/* ErrorBoundary for TenantReports */}
          <ErrorBoundary>
            <TenantReports orgId={currentOrgId} />
          </ErrorBoundary>
        </div>
        <div className="flex-1">
          {/* ErrorBoundary for RuleListWidget */}
          <ErrorBoundary>
            <RuleListWidget orgId={currentOrgId} />
          </ErrorBoundary>
        </div>
      </section>
      {/* TODO: Add more advanced widgets, RBAC, and extensibility hooks */}
    </main>
  );
}

export default function OrganizationsDashboard() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return (
      <main className="flex flex-col gap-8 p-4 max-w-7xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </main>
    );
  }
  
  return <OrganizationsDashboardContent />;
}
