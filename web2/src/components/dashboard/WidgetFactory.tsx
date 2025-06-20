import * as React from 'react';
import type { DashboardWidget } from '@ui/dashboard/types/widget';
import { KPIWidget } from '@ui/dashboard/components/KPIWidget';
import { ChartWidget } from '@ui/dashboard/components/ChartWidget';
import { RemediationProgressBar } from '@ui/dashboard/components/RemediationProgressBar';
import { ComplianceStatusWidget } from '@ui/dashboard/components/ComplianceStatusWidget';
import { AuditLogWidget } from '@ui/dashboard/components/AuditLogWidget';
import { ScorecardWidget } from '@ui/dashboard/components/ScorecardWidget';
import { ExportWidget } from '@ui/dashboard/components/ExportWidget';
import { CustomReportWidget } from '@ui/dashboard/components/CustomReportWidget';
import { NivoChartWidget } from '@ui/dashboard/components/NivoChartWidget';
// TODO: Import RiskWidget, RemediationWidget, CustomWidget as they are implemented

// Dynamic imports for advanced widgets
const CredentialManager = React.lazy(() => import('@web2/app/organizations/widgets/CredentialManager').then(m => ({ default: m.CredentialManager })));
const OrgSwitcher = React.lazy(() => import('@web2/app/organizations/widgets/OrgSwitcher').then(m => ({ default: m.OrgSwitcher })));
const OrganizationList = React.lazy(() => import('@web2/app/organizations/widgets/OrganizationList').then(m => ({ default: m.OrganizationList })));
const TeamMembers = React.lazy(() => import('@web2/app/organizations/widgets/TeamMembers').then(m => ({ default: m.TeamMembers })));
const TenantReports = React.lazy(() => import('@web2/app/organizations/widgets/TenantReports').then(m => ({ default: m.TenantReports })));
const RuleListWidget = React.lazy(() => import('@web2/app/organizations/widgets/RuleListWidget').then(m => ({ default: m.RuleListWidget })));
const MonacoEditorWidget = React.lazy(() => import('@web2/app/organizations/widgets/MonacoEditorWidget').then(m => ({ default: m.MonacoEditorWidget })));

function WidgetSkeleton() {
  return (
    <div className="animate-pulse bg-base-200 rounded-lg p-6 w-full h-40 flex items-center justify-center">
      <span className="text-base-content/40">Loading widget...</span>
    </div>
  );
}

interface WidgetFactoryProps {
  widget: DashboardWidget;
  className?: string;
}

export function WidgetFactory({ widget, className }: WidgetFactoryProps) {
  // Helper to extract orgId/userId/context from widget.data
  const orgId = widget.data?.orgId || widget.data?.organizationId;
  const userId = widget.data?.userId;
  // ... add more as needed ...
  return (
    <React.Suspense fallback={<WidgetSkeleton />}>
      {(() => {
        switch (widget.type) {
          case 'kpi':
            return <KPIWidget data={widget.data} className={className} />;
          case 'chart':
            return <ChartWidget data={widget.data} className={className} />;
          case 'remediation_progress':
            return <RemediationProgressBar {...widget.data} className={className} />;
          case 'compliance_status':
            return <ComplianceStatusWidget config={widget.data?.config} className={className} />;
          case 'audit_log':
            return <AuditLogWidget data={widget.data} className={className} />;
          case 'scorecard':
            return <ScorecardWidget {...widget.data} className={className} />;
          case 'export':
            return <ExportWidget {...widget.data} className={className} />;
          case 'custom_report':
            return <CustomReportWidget {...widget.data} className={className} />;
          case 'nivo_chart':
            return <NivoChartWidget {...widget.data} className={className} />;
          // Advanced widgets
          case 'credential_manager':
            return <CredentialManager orgId={orgId} {...widget.data} className={className} />;
          case 'org_switcher':
            return <OrgSwitcher userId={userId} currentOrgId={orgId} {...widget.data} className={className} />;
          case 'organization_list':
            return <OrganizationList userId={userId} {...widget.data} className={className} />;
          case 'team_members':
            return <TeamMembers orgId={orgId} {...widget.data} className={className} />;
          case 'tenant_reports':
            return <TenantReports orgId={orgId} {...widget.data} className={className} />;
          case 'rule_list':
            return <RuleListWidget orgId={orgId} {...widget.data} className={className} />;
          case 'monaco_editor':
            return <MonacoEditorWidget {...widget.data} className={className} />;
          default:
            return (
              <div
                className={`text-zinc-400 dark:text-zinc-600 text-center p-4 ${className ?? ''}`.trim()}
              >
                Unsupported widget type: <span className="font-mono">{widget.type}</span>
              </div>
            );
        }
      })()}
    </React.Suspense>
  );
} 