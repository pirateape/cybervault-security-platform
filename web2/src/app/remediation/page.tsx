"use client";

import React, { useState, useMemo } from 'react';
import { Button, Card, Input } from '@ui/primitives';
import { Modal } from '@ui/primitives/Modal';

// Import our remediation management API hooks
import {
  useRemediationActions,
  useRemediationStats,
  useCreateRemediationAction,
  useUpdateRemediationAction,
  useDeleteRemediationAction,
  useBulkRemediationOperation,
  useAssignRemediationAction,
  useVerifyRemediationAction,
  useUpdateRemediationStatus,
  type RemediationAction,
  type CreateRemediationActionRequest,
  type UpdateRemediationActionRequest,
  type RemediationSearchFilters,
  type RemediationStatus,
  type RemediationPriority,
  getStatusColor,
  getPriorityColor,
  isOverdue,
  calculateSLACompliance,
  getValidStatusTransitions,
  getActionProgress,
  formatTimeSpent,
} from '@data-access/remediationApi';

// Import user management for assignment
import { useUsers } from '@data-access/userManagementApi';

// Import auth context
import { useAuth } from '@/libs/hooks/authProvider';

// ====================
// TYPES & INTERFACES
// ====================

interface RemediationCardProps {
  action: RemediationAction;
  onUpdate: (actionId: string) => void;
  onDelete: (actionId: string) => void;
  onAssign: (actionId: string, assigneeId: string) => void;
  onStatusChange: (actionId: string, status: RemediationStatus) => void;
  onVerify: (actionId: string, verified: boolean) => void;
  users: any[];
}

interface KanbanColumnProps {
  title: string;
  status: RemediationStatus;
  actions: RemediationAction[];
  onUpdate: (actionId: string) => void;
  onDelete: (actionId: string) => void;
  onAssign: (actionId: string, assigneeId: string) => void;
  onStatusChange: (actionId: string, status: RemediationStatus) => void;
  onVerify: (actionId: string, verified: boolean) => void;
  users: any[];
}

interface CreateActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (actionData: CreateRemediationActionRequest) => void;
  users: any[];
}

// ====================
// UTILITY COMPONENTS
// ====================

function Badge({ children, className = '', variant = 'default' }: { 
  children: React.ReactNode; 
  className?: string; 
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}) {
  const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    destructive: 'bg-red-100 text-red-800',
    outline: 'border border-gray-300 text-gray-700',
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div 
        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function Select({ 
  value, 
  onChange, 
  children, 
  className = '' 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className={`border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      {children}
    </select>
  );
}

function Checkbox({ 
  checked, 
  onChange, 
  id,
  className = '' 
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void; 
  id?: string;
  className?: string;
}) {
  return (
    <input 
      type="checkbox" 
      id={id}
      checked={checked} 
      onChange={(e) => onChange(e.target.checked)}
      className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${className}`}
    />
  );
}

function Textarea({ 
  value, 
  onChange, 
  placeholder, 
  rows = 3, 
  className = '',
  ...props 
}: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; 
  placeholder?: string; 
  rows?: number; 
  className?: string;
  [key: string]: any;
}) {
  return (
    <textarea 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder}
      rows={rows}
      className={`w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
}

// ====================
// MAIN COMPONENT
// ====================

export default function RemediationManagementPage() {
  const { user } = useAuth();
  // Use a mock org_id for now since the auth User interface doesn't have org_id
  const orgId = 'demo-org-id';

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RemediationStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<RemediationPriority | 'all'>('all');
  const [overdueFilter, setOverdueFilter] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Build filters with proper defaults
  const filters: RemediationSearchFilters = useMemo(() => {
    const baseFilters: RemediationSearchFilters = {
      sort_by: 'created_at',
      sort_order: 'desc',
      page: 1,
      limit: 100, // Get all for kanban view
      search: searchTerm || undefined,
      overdue_only: overdueFilter || undefined,
    };

    if (statusFilter !== 'all') {
      baseFilters.status = statusFilter as RemediationStatus;
    }

    if (priorityFilter !== 'all') {
      baseFilters.priority = priorityFilter as RemediationPriority;
    }

    return baseFilters;
  }, [searchTerm, statusFilter, priorityFilter, overdueFilter]);

  // API hooks
  const { data: actionsData, isLoading: actionsLoading, refetch: refetchActions } = useRemediationActions(orgId, filters);
  const { data: stats, isLoading: statsLoading } = useRemediationStats(orgId);
  const { data: usersData } = useUsers(orgId);
  
  const createActionMutation = useCreateRemediationAction(orgId);
  const updateActionMutation = useUpdateRemediationAction(orgId, '');
  const deleteActionMutation = useDeleteRemediationAction(orgId);
  const assignActionMutation = useAssignRemediationAction(orgId);
  const updateStatusMutation = useUpdateRemediationStatus(orgId);
  const verifyActionMutation = useVerifyRemediationAction(orgId);
  const bulkOperationMutation = useBulkRemediationOperation(orgId);

  const actions = actionsData?.actions || [];
  const users = usersData?.users || [];

  // Kanban columns configuration
  const kanbanColumns: Array<{ title: string; status: RemediationStatus; count: number }> = [
    { title: 'Open', status: 'open', count: actions.filter((a: RemediationAction) => a.status === 'open').length },
    { title: 'Assigned', status: 'assigned', count: actions.filter((a: RemediationAction) => a.status === 'assigned').length },
    { title: 'In Progress', status: 'in_progress', count: actions.filter((a: RemediationAction) => a.status === 'in_progress').length },
    { title: 'Under Review', status: 'under_review', count: actions.filter((a: RemediationAction) => a.status === 'under_review').length },
    { title: 'Resolved', status: 'resolved', count: actions.filter((a: RemediationAction) => a.status === 'resolved').length },
    { title: 'Verified', status: 'verified', count: actions.filter((a: RemediationAction) => a.status === 'verified').length },
  ];

  // Utility function to show notifications
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Event handlers
  const handleCreateAction = async (actionData: CreateRemediationActionRequest) => {
    try {
      await createActionMutation.mutateAsync(actionData);
      setIsCreateModalOpen(false);
      showNotification('Remediation action created successfully', 'success');
    } catch (error) {
      showNotification('Failed to create remediation action', 'error');
    }
  };

  const handleUpdateAction = async (actionId: string) => {
    // This would typically open an edit modal - simplified for now
    refetchActions();
  };

  const handleDeleteAction = async (actionId: string) => {
    if (window.confirm('Are you sure you want to delete this action?')) {
      try {
        await deleteActionMutation.mutateAsync(actionId);
        showNotification('Remediation action deleted successfully', 'success');
      } catch (error) {
        showNotification('Failed to delete remediation action', 'error');
      }
    }
  };

  const handleAssignAction = async (actionId: string, assigneeId: string) => {
    try {
      await assignActionMutation.mutateAsync({ actionId, assigneeId });
      showNotification('Action assigned successfully', 'success');
    } catch (error) {
      showNotification('Failed to assign action', 'error');
    }
  };

  const handleStatusChange = async (actionId: string, status: RemediationStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ actionId, status });
      showNotification('Status updated successfully', 'success');
    } catch (error) {
      showNotification('Failed to update status', 'error');
    }
  };

  const handleVerifyAction = async (actionId: string, verified: boolean) => {
    try {
      await verifyActionMutation.mutateAsync({ actionId, verified });
      showNotification(verified ? 'Action verified successfully' : 'Verification removed', 'success');
    } catch (error) {
      showNotification('Failed to update verification', 'error');
    }
  };

  if (actionsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg z-50 ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Remediation Management</h1>
          <p className="text-gray-600 mt-1">Manage and track security remediation actions</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <span>+</span>
          New Action
        </Button>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Actions</p>
              <p className="text-2xl font-bold">{stats?.total_actions || 0}</p>
            </div>
            <div className="text-blue-600 text-2xl">📄</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats?.overdue_actions || 0}</p>
            </div>
            <div className="text-red-600 text-2xl">⚠️</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">SLA Compliance</p>
              <p className="text-2xl font-bold text-green-600">{stats?.sla_compliance_rate || 0}%</p>
            </div>
            <div className="text-green-600 text-2xl">✅</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Resolution</p>
              <p className="text-2xl font-bold">{stats?.average_resolution_time_hours ? `${Math.round(stats.average_resolution_time_hours)}h` : 'N/A'}</p>
            </div>
            <div className="text-yellow-600 text-2xl">⏱️</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Input
                placeholder="Search actions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</div>
            </div>
          </div>
          
          <Select value={statusFilter} onChange={(value) => setStatusFilter(value as RemediationStatus | 'all')}>
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="verified">Verified</option>
          </Select>
          
          <Select value={priorityFilter} onChange={(value) => setPriorityFilter(value as RemediationPriority | 'all')}>
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="overdue"
              checked={overdueFilter}
              onChange={(checked) => setOverdueFilter(checked)}
            />
            <label htmlFor="overdue" className="text-sm">Overdue only</label>
          </div>
        </div>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kanbanColumns.map((column) => (
          <KanbanColumn
            key={column.status}
            title={column.title}
            status={column.status}
            actions={actions.filter(action => action.status === column.status)}
            onUpdate={handleUpdateAction}
            onDelete={handleDeleteAction}
            onAssign={handleAssignAction}
            onStatusChange={handleStatusChange}
            onVerify={handleVerifyAction}
            users={users}
          />
        ))}
      </div>

      {/* Create Action Modal */}
      <CreateActionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateAction}
        users={users}
      />
    </div>
  );
}

// ====================
// KANBAN COLUMN COMPONENT
// ====================

function KanbanColumn({ title, status, actions, onUpdate, onDelete, onAssign, onStatusChange, onVerify, users }: KanbanColumnProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <Badge variant="secondary" className="text-xs">
          {actions.length}
        </Badge>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {actions.map((action) => (
          <RemediationCard
            key={action.id}
            action={action}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onAssign={onAssign}
            onStatusChange={onStatusChange}
            onVerify={onVerify}
            users={users}
          />
        ))}
        
        {actions.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No actions in this status</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ====================
// REMEDIATION CARD COMPONENT
// ====================

function RemediationCard({ action, onUpdate, onDelete, onAssign, onStatusChange, onVerify, users }: RemediationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const overdue = isOverdue(action);
  const progress = getActionProgress(action);
  const validTransitions = getValidStatusTransitions(action.status);
  
  const assignee = users.find(u => u.id === action.assigned_to);

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${overdue ? 'border-red-300 bg-red-50' : ''}`}>
      <div className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{action.title}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getPriorityColor(action.priority)} variant="secondary">
                  {action.priority}
                </Badge>
                {overdue && (
                  <Badge variant="destructive" className="text-xs">
                    Overdue
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ⋮
              </button>
              {showActions && (
                <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      onUpdate(action.id);
                      setShowActions(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => {
                      onDelete(action.id);
                      setShowActions(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          {progress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <ProgressBar value={progress} />
            </div>
          )}

          {/* Assignee */}
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <span>👤</span>
              <span>{assignee?.name || assignee?.first_name + ' ' + assignee?.last_name || 'Unassigned'}</span>
            </div>
            {action.due_date && (
              <div className="flex items-center gap-1">
                <span>📅</span>
                <span>{new Date(action.due_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {action.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {action.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {action.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{action.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-1">
            {/* Assignment */}
            <Select
              value={action.assigned_to || ''}
              onChange={(userId) => onAssign(action.id, userId)}
              className="flex-1 text-xs"
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.first_name + ' ' + user.last_name}
                </option>
              ))}
            </Select>

            {/* Status Change */}
            {validTransitions.length > 0 && (
              <Select
                value={action.status}
                onChange={(status) => onStatusChange(action.id, status as RemediationStatus)}
                className="flex-1 text-xs"
              >
                <option value={action.status}>{action.status}</option>
                {validTransitions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            )}
          </div>

          {/* Expandable Details */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-xs text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? '▲ Hide Details' : '▼ Show Details'}
          </button>

          {isExpanded && (
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600">{action.description}</p>
              
              {action.evidence_required && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Evidence Required</span>
                  <Badge variant={action.evidence_collected ? 'default' : 'secondary'}>
                    {action.evidence_collected ? 'Collected' : 'Pending'}
                  </Badge>
                </div>
              )}
              
              {action.time_spent_minutes > 0 && (
                <div className="text-xs text-gray-600">
                  Time Spent: {formatTimeSpent(action.time_spent_minutes)}
                </div>
              )}
              
              {action.status === 'resolved' && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={() => onVerify(action.id, true)}
                    className="flex-1 text-xs bg-green-600 hover:bg-green-700"
                  >
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onVerify(action.id, false)}
                    className="flex-1 text-xs bg-red-600 hover:bg-red-700"
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ====================
// CREATE ACTION MODAL
// ====================

function CreateActionModal({ isOpen, onClose, onCreate, users }: CreateActionModalProps) {
  const [formData, setFormData] = useState<Partial<CreateRemediationActionRequest>>({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: null,
    due_date: null,
    evidence_required: false,
    tags: [],
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      return;
    }

    onCreate(formData as CreateRemediationActionRequest);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      assigned_to: null,
      due_date: null,
      evidence_required: false,
      tags: [],
      notes: '',
    });
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Remediation Action">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <Input
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of the remediation action"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of what needs to be done"
              rows={3}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <Select
                value={formData.priority || 'medium'}
                onChange={(value) => setFormData({ ...formData, priority: value as RemediationPriority })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
              <Select
                value={formData.assigned_to || ''}
                onChange={(value) => setFormData({ ...formData, assigned_to: value || null })}
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.first_name + ' ' + user.last_name} ({user.email})
                  </option>
                ))}
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <Input
                type="datetime-local"
                value={formData.due_date || ''}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value || null })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SLA Hours</label>
              <Input
                type="number"
                min="1"
                value={formData.sla_hours || ''}
                onChange={(e) => setFormData({ ...formData, sla_hours: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="e.g., 72"
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="evidence_required"
                checked={formData.evidence_required || false}
                onChange={(checked) => setFormData({ ...formData, evidence_required: checked })}
              />
              <label htmlFor="evidence_required" className="text-sm">Evidence collection required</label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional context or requirements"
              rows={2}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Create Action
          </Button>
        </div>
      </form>
    </Modal>
  );
} 