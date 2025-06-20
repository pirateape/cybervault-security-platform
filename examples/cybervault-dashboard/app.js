// CyberVault Application JavaScript

// Mock data from the provided JSON
const appData = {
  "company": {
    "name": "CyberVault",
    "tagline": "Advanced Compliance Automation",
    "logo": "https://pplx-res.cloudinary.com/image/upload/v1750338045/gpt4o_images/pmthoq01palqzwezaeur.png"
  },
  "user": {
    "name": "Sarah Johnson",
    "email": "sarah.johnson@cybervault.com",
    "role": "Security Administrator",
    "avatar": "SJ"
  },
  "organizations": [
    {
      "id": 1,
      "name": "Acme Corporation",
      "status": "Connected",
      "complianceScore": 92,
      "lastScan": "2025-06-19T18:30:00Z",
      "environment": "Microsoft 365 + Azure",
      "users": 1250,
      "criticalIssues": 2
    },
    {
      "id": 2,
      "name": "Global Tech Solutions",
      "status": "Scanning",
      "complianceScore": 78,
      "lastScan": "2025-06-19T17:45:00Z",
      "environment": "Microsoft 365 + Power Platform",
      "users": 850,
      "criticalIssues": 5
    },
    {
      "id": 3,
      "name": "Healthcare Plus",
      "status": "Warning",
      "complianceScore": 65,
      "lastScan": "2025-06-19T16:20:00Z",
      "environment": "Microsoft 365 + Azure + Power Platform",
      "users": 2100,
      "criticalIssues": 12
    }
  ],
  "auditLogs": [
    {
      "id": 1,
      "timestamp": "2025-06-19T20:45:00Z",
      "user": "sarah.johnson@cybervault.com",
      "action": "Rule Created",
      "resource": "NIST-800-53-AC-2",
      "status": "Success",
      "ipAddress": "192.168.1.100",
      "details": "Created new access control rule for user account management"
    },
    {
      "id": 2,
      "timestamp": "2025-06-19T20:30:00Z",
      "user": "mike.chen@cybervault.com",
      "action": "Scan Initiated",
      "resource": "Acme Corporation",
      "status": "In Progress",
      "ipAddress": "192.168.1.105",
      "details": "Full compliance scan started for Microsoft 365 environment"
    },
    {
      "id": 3,
      "timestamp": "2025-06-19T20:15:00Z",
      "user": "lisa.rodriguez@cybervault.com",
      "action": "Report Generated",
      "resource": "ISO 27001 Compliance Report",
      "status": "Success",
      "ipAddress": "192.168.1.112",
      "details": "Generated executive summary report for Q2 compliance review"
    }
  ],
  "rules": [
    {
      "id": 1,
      "name": "Multi-Factor Authentication Required",
      "framework": "NIST 800-53",
      "category": "Identity & Access",
      "severity": "High",
      "status": "Active",
      "organizations": 3,
      "lastUpdated": "2025-06-15T10:00:00Z"
    },
    {
      "id": 2,
      "name": "Password Complexity Requirements",
      "framework": "CIS Controls",
      "category": "Identity & Access",
      "severity": "Medium",
      "status": "Active",
      "organizations": 3,
      "lastUpdated": "2025-06-10T14:30:00Z"
    },
    {
      "id": 3,
      "name": "Guest Access Restrictions",
      "framework": "ISO 27001",
      "category": "Access Control",
      "severity": "High",
      "status": "Draft",
      "organizations": 0,
      "lastUpdated": "2025-06-18T09:15:00Z"
    }
  ],
  "reports": [
    {
      "id": 1,
      "name": "Q2 2025 Compliance Summary",
      "framework": "NIST",
      "type": "Executive Summary",
      "status": "Generated",
      "createdAt": "2025-06-19T15:00:00Z",
      "size": "2.4 MB"
    },
    {
      "id": 2,
      "name": "Azure Security Assessment",
      "framework": "CIS Controls",
      "type": "Technical Report",
      "status": "Generating",
      "createdAt": "2025-06-19T19:30:00Z",
      "size": "Pending"
    }
  ],
  "dashboardStats": {
    "totalOrganizations": 3,
    "activeRules": 15,
    "recentScans": 7,
    "averageComplianceScore": 78,
    "criticalAlerts": 4,
    "resolvedIssues": 23
  },
  "recentAlerts": [
    {
      "id": 1,
      "type": "Critical",
      "title": "Privileged Account Without MFA",
      "organization": "Healthcare Plus",
      "timestamp": "2025-06-19T19:45:00Z",
      "status": "Open"
    },
    {
      "id": 2,
      "type": "Warning",
      "title": "Outdated Security Policy",
      "organization": "Global Tech Solutions",
      "timestamp": "2025-06-19T18:20:00Z",
      "status": "In Review"
    }
  ]
};

// Application state
let currentPage = 'dashboard';
let sidebarCollapsed = false;
let complianceChart = null;

// DOM elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const currentPageTitle = document.getElementById('currentPageTitle');

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
  initializeNavigation();
  initializeSidebar();
  populateData();
  initializeCharts();
  initializeEventListeners();
});

// Navigation functions
function initializeNavigation() {
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const page = this.getAttribute('data-page');
      navigateToPage(page);
    });
  });
}

function navigateToPage(page) {
  // Update active nav link
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-page') === page) {
      link.classList.add('active');
    }
  });

  // Hide all pages
  pages.forEach(p => p.classList.add('hidden'));

  // Show target page
  const targetPage = document.getElementById(`${page}-page`);
  if (targetPage) {
    targetPage.classList.remove('hidden');
    currentPage = page;
    
    // Update page title
    const pageTitle = page.charAt(0).toUpperCase() + page.slice(1).replace('-', ' ');
    currentPageTitle.textContent = pageTitle;
  }
}

// Sidebar functions
function initializeSidebar() {
  sidebarToggle.addEventListener('click', toggleSidebar);
  mobileMenuToggle.addEventListener('click', toggleMobileSidebar);
}

function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;
  sidebar.classList.toggle('sidebar--collapsed', sidebarCollapsed);
}

function toggleMobileSidebar() {
  sidebar.classList.toggle('sidebar--mobile-open');
}

// Data population functions
function populateData() {
  populateOrganizationsTable();
  populateOrganizationsGrid();
  populateRulesTable();
  populateAuditLogTable();
  populateReportsTable();
}

function populateOrganizationsTable() {
  const tableBody = document.getElementById('organizationsTable');
  if (!tableBody) return;

  tableBody.innerHTML = appData.organizations.map(org => `
    <tr>
      <td>
        <div>
          <strong>${org.name}</strong>
          <div style="font-size: 12px; color: var(--color-text-secondary); margin-top: 4px;">
            ${org.environment}
          </div>
        </div>
      </td>
      <td>
        <span class="status status--${org.status.toLowerCase()}">${org.status}</span>
      </td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 60px; height: 8px; background: var(--color-secondary); border-radius: 4px; overflow: hidden;">
            <div style="width: ${org.complianceScore}%; height: 100%; background: ${org.complianceScore >= 80 ? '#28a745' : org.complianceScore >= 60 ? '#ffc107' : '#dc3545'};"></div>
          </div>
          <span style="font-weight: 600;">${org.complianceScore}%</span>
        </div>
      </td>
      <td>${formatDateTime(org.lastScan)}</td>
      <td>
        <span class="status ${org.criticalIssues > 10 ? 'status--error' : org.criticalIssues > 5 ? 'status--warning' : 'status--success'}">
          ${org.criticalIssues}
        </span>
      </td>
    </tr>
  `).join('');
}

function populateOrganizationsGrid() {
  const grid = document.getElementById('organizationsGrid');
  if (!grid) return;

  grid.innerHTML = appData.organizations.map(org => `
    <div class="organization-card">
      <div class="organization-card__header">
        <div>
          <h3 class="organization-card__name">${org.name}</h3>
          <div class="organization-card__status">
            <span class="status status--${org.status.toLowerCase()}">${org.status}</span>
          </div>
        </div>
      </div>
      
      <div class="organization-card__metrics">
        <div class="metric">
          <div class="metric__value">${org.complianceScore}%</div>
          <div class="metric__label">Compliance Score</div>
        </div>
        <div class="metric">
          <div class="metric__value">${org.users.toLocaleString()}</div>
          <div class="metric__label">Users</div>
        </div>
      </div>
      
      <div class="organization-card__footer">
        <div class="organization-card__info">
          <div style="font-size: 12px; color: var(--color-text-secondary);">
            ${org.environment}
          </div>
          <div style="font-size: 12px; color: var(--color-text-secondary); margin-top: 4px;">
            Last scan: ${formatDateTime(org.lastScan)}
          </div>
        </div>
        <button class="btn btn--outline btn--sm">Manage</button>
      </div>
    </div>
  `).join('');
}

function populateRulesTable() {
  const tableBody = document.getElementById('rulesTable');
  if (!tableBody) return;

  tableBody.innerHTML = appData.rules.map(rule => `
    <tr>
      <td>
        <strong>${rule.name}</strong>
      </td>
      <td>
        <span class="status status--info">${rule.framework}</span>
      </td>
      <td>${rule.category}</td>
      <td>
        <span class="status ${rule.severity === 'High' ? 'status--error' : rule.severity === 'Medium' ? 'status--warning' : 'status--success'}">
          ${rule.severity}
        </span>
      </td>
      <td>
        <span class="status status--${rule.status.toLowerCase()}">${rule.status}</span>
      </td>
      <td>${rule.organizations}</td>
      <td>
        <button class="btn btn--outline btn--sm">Edit</button>
      </td>
    </tr>
  `).join('');
}

function populateAuditLogTable() {
  const tableBody = document.getElementById('auditLogTable');
  if (!tableBody) return;

  tableBody.innerHTML = appData.auditLogs.map(log => `
    <tr>
      <td>${formatDateTime(log.timestamp)}</td>
      <td>
        <div style="font-size: 12px;">
          ${log.user.split('@')[0]}
          <div style="color: var(--color-text-secondary); margin-top: 2px;">
            ${log.user.split('@')[1]}
          </div>
        </div>
      </td>
      <td>
        <span class="status status--info">${log.action}</span>
      </td>
      <td class="font-mono" style="font-size: 12px;">${log.resource}</td>
      <td>
        <span class="status status--${log.status === 'Success' ? 'success' : log.status === 'In Progress' ? 'warning' : 'error'}">
          ${log.status}
        </span>
      </td>
      <td class="font-mono" style="font-size: 12px;">${log.ipAddress}</td>
    </tr>
  `).join('');
}

function populateReportsTable() {
  const tableBody = document.getElementById('reportsTable');
  if (!tableBody) return;

  tableBody.innerHTML = appData.reports.map(report => `
    <tr>
      <td>
        <strong>${report.name}</strong>
      </td>
      <td>
        <span class="status status--info">${report.framework}</span>
      </td>
      <td>${report.type}</td>
      <td>
        <span class="status status--${report.status === 'Generated' ? 'success' : 'warning'}">
          ${report.status}
        </span>
      </td>
      <td>${formatDateTime(report.createdAt)}</td>
      <td>
        ${report.status === 'Generated' ? 
          '<button class="btn btn--outline btn--sm">Download</button>' : 
          '<button class="btn btn--secondary btn--sm" disabled>Processing...</button>'
        }
      </td>
    </tr>
  `).join('');
}

// Chart initialization
function initializeCharts() {
  const ctx = document.getElementById('complianceChart');
  if (!ctx) return;

  // Sample compliance trend data
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Compliance Score',
      data: [65, 68, 72, 75, 76, 78],
      borderColor: '#426CFF',
      backgroundColor: 'rgba(66, 108, 255, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#426CFF',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 6
    }, {
      label: 'Target Score',
      data: [85, 85, 85, 85, 85, 85],
      borderColor: '#28a745',
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderDash: [5, 5],
      pointRadius: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim(),
          font: {
            size: 12
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim()
        },
        grid: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim()
        }
      },
      y: {
        beginAtZero: false,
        min: 50,
        max: 100,
        ticks: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim(),
          callback: function(value) {
            return value + '%';
          }
        },
        grid: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim()
        }
      }
    }
  };

  complianceChart = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: chartOptions
  });
}

// Event listeners
function initializeEventListeners() {
  // Search functionality
  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }

  // Notification button
  const notificationBtn = document.querySelector('.notification-btn');
  if (notificationBtn) {
    notificationBtn.addEventListener('click', showNotifications);
  }

  // Close mobile menu when clicking outside
  document.addEventListener('click', function(e) {
    if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
      sidebar.classList.remove('sidebar--mobile-open');
    }
  });

  // Button interactions
  document.addEventListener('click', function(e) {
    if (e.target.matches('.btn')) {
      handleButtonClick(e.target);
    }
  });
}

function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  console.log('Searching for:', query);
  // Implement search functionality based on current page
}

function showNotifications() {
  alert('Notifications:\n\n' + 
    appData.recentAlerts.map(alert => 
      `${alert.type}: ${alert.title}\n${alert.organization} - ${alert.status}`
    ).join('\n\n')
  );
}

function handleButtonClick(button) {
  const buttonText = button.textContent.trim();
  
  switch(buttonText) {
    case 'Add Organization':
      showAddOrganizationModal();
      break;
    case 'Create Rule':
      showCreateRuleModal();
      break;
    case 'Generate Report':
      showGenerateReportModal();
      break;
    case 'Manage':
      showManageOrganizationModal();
      break;
    case 'Edit':
      showEditRuleModal();
      break;
    case 'Download':
      downloadReport();
      break;
    case 'Use Template':
      useReportTemplate();
      break;
    default:
      console.log('Button clicked:', buttonText);
  }
}

// Modal functions (simplified for demo)
function showAddOrganizationModal() {
  alert('Add Organization modal would open here.\n\nThis would allow you to connect a new Microsoft 365, Azure, or Power Platform environment.');
}

function showCreateRuleModal() {
  alert('Create Rule modal would open here.\n\nThis would provide a wizard to create custom compliance rules.');
}

function showGenerateReportModal() {
  alert('Generate Report modal would open here.\n\nThis would allow you to select report templates and customize parameters.');
}

function showManageOrganizationModal() {
  alert('Manage Organization modal would open here.\n\nThis would provide detailed organization settings and configuration options.');
}

function showEditRuleModal() {
  alert('Edit Rule modal would open here.\n\nThis would allow you to modify rule parameters and settings.');
}

function downloadReport() {
  // Simulate report download
  const link = document.createElement('a');
  link.href = 'data:text/plain;charset=utf-8,CyberVault Compliance Report\n\nThis is a sample compliance report generated by CyberVault.';
  link.download = 'cybervault-compliance-report.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function useReportTemplate() {
  alert('Report template selected!\n\nThe report generation wizard would now open with pre-configured settings.');
}

// Utility functions
function formatDateTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }
}

function getStatusClass(status) {
  const statusMap = {
    'Connected': 'connected',
    'Scanning': 'scanning',
    'Warning': 'warning',
    'Active': 'active',
    'Draft': 'draft',
    'Success': 'success',
    'In Progress': 'warning',
    'Generated': 'success',
    'Generating': 'warning',
    'High': 'error',
    'Medium': 'warning',
    'Low': 'success'
  };
  
  return statusMap[status] || 'info';
}

// Real-time updates simulation
function simulateRealTimeUpdates() {
  setInterval(() => {
    // Simulate compliance score changes
    const scoreElements = document.querySelectorAll('.metric__value');
    scoreElements.forEach(element => {
      if (element.textContent.includes('%')) {
        const currentScore = parseInt(element.textContent);
        const variation = Math.random() * 2 - 1; // -1 to +1
        const newScore = Math.max(0, Math.min(100, currentScore + variation));
        element.textContent = Math.round(newScore) + '%';
      }
    });
  }, 30000); // Update every 30 seconds
}

// Start real-time updates
setTimeout(simulateRealTimeUpdates, 5000);

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey || e.metaKey) {
    switch(e.key) {
      case '1':
        e.preventDefault();
        navigateToPage('dashboard');
        break;
      case '2':
        e.preventDefault();
        navigateToPage('organizations');
        break;
      case '3':
        e.preventDefault();
        navigateToPage('rules');
        break;
      case '4':
        e.preventDefault();
        navigateToPage('audit-log');
        break;
      case '5':
        e.preventDefault();
        navigateToPage('reports');
        break;
      case 'k':
        e.preventDefault();
        document.querySelector('.search-input').focus();
        break;
    }
  }
});

// Theme handling (if needed)
function toggleTheme() {
  const currentScheme = document.documentElement.getAttribute('data-color-scheme');
  const newScheme = currentScheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-color-scheme', newScheme);
  
  // Update chart colors if chart exists
  if (complianceChart) {
    complianceChart.destroy();
    setTimeout(initializeCharts, 100);
  }
}

// Export functions for global access
window.CyberVault = {
  navigateToPage,
  toggleSidebar,
  toggleTheme,
  appData
};