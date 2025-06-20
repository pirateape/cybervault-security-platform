import React from 'react';
import { BellIcon } from '../../../libs/ui/Icons';

const alerts = [
  { id: 1, type: 'New Rule Violation', description: 'Policy X.25 was violated by user@example.com.', time: '2m ago' },
  { id: 2, type: 'Failed Login Attempt', description: 'Multiple failed login attempts for admin.', time: '1h ago' },
  { id: 3, type: 'High-Risk Action', description: 'User deleted production database.', time: '3h ago', severity: 'high' },
  { id: 4, type: 'Compliance Scan', description: 'Weekly compliance scan completed with 98% score.', time: '1d ago', severity: 'low' },
];

const RecentAlerts = () => {
  const getSeverityClasses = (severity?: string) => {
    switch (severity) {
      case 'high':
        return 'bg-error/10 text-error';
      case 'low':
        return 'bg-success/10 text-success';
      default:
        return 'bg-warning/10 text-warning';
    }
  };

  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm h-96 flex flex-col">
      <h3 className="text-lg font-semibold text-text mb-4">Recent Alerts</h3>
      <div className="flex-1 overflow-y-auto -mr-6 pr-6">
        <ul className="space-y-4">
          {alerts.map(alert => (
            <li key={alert.id} className="flex items-start gap-4">
              <div className={`mt-1 p-2 rounded-full ${getSeverityClasses(alert.severity)}`}>
                <BellIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-sm text-text">{alert.type}</p>
                <p className="text-sm text-text-secondary">{alert.description}</p>
                <p className="text-xs text-text-secondary/70 mt-1">{alert.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RecentAlerts; 