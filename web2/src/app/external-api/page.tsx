'use client';

import React, { useState } from 'react';
import { Card } from '@ui/primitives/Card';
import { Button } from '@ui/primitives/Button';

// Custom Icons for External API Management
const KeyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

const ActivityIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
  </svg>
);

const BarChartIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <line x1="12" y1="20" x2="12" y2="10"/>
    <line x1="18" y1="20" x2="18" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="16"/>
  </svg>
);

const FileTextIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
);

const ZapIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
  </svg>
);

// Import the sub-components
import { ApiKeyManagement } from './components/ApiKeyManagement';
import { ExternalApiMonitoring } from './components/ExternalApiMonitoring';
import { ApiUsageAnalytics } from './components/ApiUsageAnalytics';
import { ApiDocumentation } from './components/ApiDocumentation';
import { ExternalApiMonitoring } from './components/ExternalApiMonitoring';
import { ApiUsageAnalytics } from './components/ApiUsageAnalytics';
import { ApiDocumentation } from './components/ApiDocumentation';

export default function ExternalApiPage() {
  const [activeTab, setActiveTab] = useState('keys');

  const tabItems = [
    {
      id: 'keys',
      label: 'API Keys',
      icon: KeyIcon,
      description: 'Manage API keys, rotation, and security',
      component: ApiKeyManagement,
      badge: 'Security'
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      icon: ActivityIcon,
      description: 'Monitor API health and performance',
      component: ExternalApiMonitoring,
      badge: 'Live'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChartIcon,
      description: 'Usage analytics and cost tracking',
      component: ApiUsageAnalytics,
      badge: 'Insights'
    },
    {
      id: 'documentation',
      label: 'Documentation',
      icon: FileTextIcon,
      description: 'API documentation and testing tools',
      component: ApiDocumentation,
      badge: 'Docs'
    }
  ];

  const activeTabData = tabItems.find(tab => tab.id === activeTab) || tabItems[0];
  const ActiveComponent = activeTabData.component;
  const ActiveIcon = activeTabData.icon;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ZapIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                External API Management
              </h1>
              <p className="text-gray-600 mt-1">
                Comprehensive management of external API integrations, monitoring, and analytics
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card variant="elevated" className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <KeyIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Keys</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
              </div>
            </Card>
            
            <Card variant="elevated" className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ActivityIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">API Health</p>
                  <p className="text-2xl font-bold text-green-600">99.9%</p>
                </div>
              </div>
            </Card>
            
            <Card variant="elevated" className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChartIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Calls</p>
                  <p className="text-2xl font-bold text-gray-900">2.4M</p>
                </div>
              </div>
            </Card>
            
            <Card variant="elevated" className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileTextIcon className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">API Versions</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Tab Navigation */}
        <Card variant="elevated" className="mb-6">
          <div className="flex flex-wrap gap-2 p-4 border-b border-gray-200">
            {tabItems.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'primary' : 'secondary'}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2"
                >
                  <TabIcon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                    {tab.badge}
                  </span>
                </Button>
              );
            })}
          </div>
        </Card>

        {/* Main Content */}
        <Card variant="elevated">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <ActiveIcon className="w-5 h-5" />
                {activeTabData.label}
              </h2>
              <p className="text-gray-600 text-sm mt-1">{activeTabData.description}</p>
            </div>
            <ActiveComponent />
          </div>
        </Card>
      </div>
    </div>
  );
} 