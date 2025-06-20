'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ComplianceChart = () => {
  const data = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'Compliance Score',
        data: [65, 59, 80, 81, 56, 55, 90],
        fill: true,
        backgroundColor: 'rgba(50, 184, 198, 0.2)',
        borderColor: 'rgba(50, 184, 198, 1)',
        tension: 0.4,
        pointBackgroundColor: 'rgba(50, 184, 198, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(50, 184, 198, 1)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Overall Compliance Trend',
        color: 'rgba(var(--color-text))',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(var(--color-text-secondary))',
        },
      },
      y: {
        grid: {
          color: 'rgba(var(--color-border), 0.1)',
        },
        ticks: {
          color: 'rgba(var(--color-text-secondary))',
        },
      },
    },
  };

  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm h-96">
      <Line options={options} data={data} />
    </div>
  );
};

export default ComplianceChart; 