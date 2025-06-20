import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon: React.ElementType;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeType, icon: Icon }) => {
  const changeColor = changeType === 'increase' ? 'text-success' : 'text-error';

  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <p className="text-sm text-text-secondary">{title}</p>
          <p className="text-3xl font-bold text-text mt-1">{value}</p>
        </div>
        <div className="bg-primary/10 p-3 rounded-md">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`${changeColor} font-semibold`}>{change}</span>
          <span className="text-text-secondary ml-1">from last week</span>
        </div>
      )}
    </div>
  );
};

export default StatCard; 