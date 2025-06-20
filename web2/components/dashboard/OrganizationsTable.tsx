import React from 'react';

const organizations = [
  { id: 1, name: 'Stark Industries', compliance: 98, lastScan: '2024-07-20', status: 'Compliant' },
  { id: 2, name: 'Wayne Enterprises', compliance: 85, lastScan: '2024-07-19', status: 'Needs Review' },
  { id: 3, name: 'Cyberdyne Systems', compliance: 45, lastScan: '2024-07-21', status: 'At Risk' },
  { id: 4, name: 'Oscorp', compliance: 92, lastScan: '2024-07-18', status: 'Compliant' },
];

const OrganizationsTable = () => {
    const getStatusClasses = (status: string) => {
        switch (status) {
            case 'Compliant':
                return 'bg-success/10 text-success';
            case 'Needs Review':
                return 'bg-warning/10 text-warning';
            case 'At Risk':
                return 'bg-error/10 text-error';
            default:
                return 'bg-gray-500/10 text-gray-500';
        }
    };

  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-text mb-4">Organizations Overview</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-secondary uppercase border-b border-border/20">
            <tr>
              <th scope="col" className="px-6 py-3">Organization</th>
              <th scope="col" className="px-6 py-3">Compliance Score</th>
              <th scope="col" className="px-6 py-3">Last Scan</th>
              <th scope="col" className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map(org => (
              <tr key={org.id} className="border-b border-border/10 hover:bg-primary/5">
                <th scope="row" className="px-6 py-4 font-medium text-text whitespace-nowrap">
                  {org.name}
                </th>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mr-2">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${org.compliance}%` }}></div>
                    </div>
                    <span>{org.compliance}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">{org.lastScan}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClasses(org.status)}`}>
                    {org.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrganizationsTable; 