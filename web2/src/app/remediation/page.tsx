"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Button, Card, Input } from '@ui/primitives';
import { Modal } from '@ui/primitives/Modal';

// Import dnd-kit for drag and drop functionality
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Import our remediation management API hooks
import {
  useRemediationActions,
  useRemediationStats,
  useCreateRemediationAction,
  useUpdateRemediationAction,
  useDeleteRemediationAction,
  useAssignRemediationAction,
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
  getActionProgress,
} from '@data-access/remediationApi';

// Import user management for assignee selection
import { useUsers } from '@data-access/userManagementApi';
import { useAuth } from '@/libs/hooks/authProvider';

// Extend User type to include org_id if not present
interface UserWithOrgId {
  org_id?: string;
}

// Types for our component
interface KanbanColumn {
  id: RemediationStatus;
  title: string;
  actions: RemediationAction[];
}

interface ActionFormData {
  title: string;
  description: string;
  priority: RemediationPriority;
  assigned_to?: string | null;
  due_date?: string | null;
  estimated_effort_hours?: number | null;
}

// Sortable card component for drag and drop
const SortableActionCard: React.FC<{
  action: RemediationAction;
  onEdit: (action: RemediationAction) => void;
  onDelete: (id: string) => void;
  onAssign: (id: string, userId: string) => void;
  onStatusChange: (id: string, status: RemediationStatus) => void;
}> = ({ action, onEdit, onDelete, onAssign, onStatusChange }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const progress = getActionProgress(action);
  const overdue = isOverdue(action);

  const handleEdit = useCallback(() => {
    onEdit(action);
  }, [action, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(action.id);
  }, [action.id, onDelete]);

  const handleAssign = useCallback((userId: string) => {
    onAssign(action.id, userId);
  }, [action.id, onAssign]);

  const handleStatusChange = useCallback((status: RemediationStatus) => {
    onStatusChange(action.id, status);
  }, [action.id, onStatusChange]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg shadow-md p-4 mb-3 border-l-4 cursor-grab ${
        isDragging ? 'shadow-lg' : ''
      } ${overdue ? 'border-red-500' : `border-${getPriorityColor(action.priority)}-500`}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900 truncate flex-1">
          {action.title}
        </h4>
        <div className="flex gap-1 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
            className="p-1"
          >
            ✏️
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="p-1 text-red-600"
          >
            🗑️
          </Button>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {action.description}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span className={`px-2 py-1 rounded ${getPriorityColor(action.priority)} text-white`}>
          {action.priority}
        </span>
        {action.assignee_name && (
          <span>Assigned to: {action.assignee_name}</span>
        )}
      </div>
      
      {action.due_date && (
        <div className={`text-xs ${overdue ? 'text-red-600' : 'text-gray-500'} mb-2`}>
          Due: {new Date(action.due_date).toLocaleDateString()}
          {overdue && ' (Overdue)'}
        </div>
      )}
      
      <div className="w-full bg-gray-200 rounded-full h-2" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Progress: ${progress}%`}>
        <div
          className={`h-2 rounded-full bg-${getStatusColor(action.status)}-500`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Quick action buttons */}
      <div className="mt-2 flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleStatusChange('in_progress' as RemediationStatus);
          }}
          className="text-xs"
        >
          Start
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleAssign('current-user-id'); // TODO: Get current user ID
          }}
          className="text-xs"
        >
          Assign to Me
        </Button>
      </div>
    </div>
  );
};

// Droppable column component
const KanbanColumnComponent: React.FC<{
  column: KanbanColumn;
  onEdit: (action: RemediationAction) => void;
  onDelete: (id: string) => void;
  onAssign: (id: string, userId: string) => void;
  onStatusChange: (id: string, status: RemediationStatus) => void;
}> = ({ column, onEdit, onDelete, onAssign, onStatusChange }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 min-h-[600px] w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">
          {column.title}
        </h3>
        <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">
          {column.actions.length}
        </span>
      </div>
      
      <SortableContext items={column.actions.map(a => a.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {column.actions.map((action) => (
            <SortableActionCard
              key={action.id}
              action={action}
              onEdit={onEdit}
              onDelete={onDelete}
              onAssign={onAssign}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

// Main remediation management page
const RemediationManagementPage: React.FC = () => {
  // Get current user and organization context
  const { user } = useAuth();
  const userWithOrg = user as UserWithOrgId;
  const orgId = userWithOrg?.org_id || 'default-org';

  // State for drag and drop
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RemediationStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<RemediationPriority | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  // State for modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAction, setEditingAction] = useState<RemediationAction | null>(null);

  // Build filters for API
  const filters: RemediationSearchFilters = useMemo(() => ({
    search: searchTerm || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    priority: priorityFilter === 'all' ? undefined : priorityFilter,
    assigned_to: assigneeFilter === 'all' ? undefined : assigneeFilter,
    overdue_only: showOverdueOnly || undefined,
    sort_by: 'created_at',
    sort_order: 'desc',
    page: 1,
    limit: 100,
  }), [searchTerm, statusFilter, priorityFilter, assigneeFilter, showOverdueOnly]);

  // API hooks
  const { data: actionsData, isLoading, error, refetch } = useRemediationActions(orgId, filters);
  const { data: stats } = useRemediationStats(orgId);
  const { data: usersData } = useUsers(orgId);
  
  // Extract actions array from API response
  const actions = actionsData?.actions || [];
  const users = usersData?.users || [];
  
  // Mutations
  const createMutation = useCreateRemediationAction(orgId);
  const updateMutation = useUpdateRemediationAction(orgId, editingAction?.id || '');
  const deleteMutation = useDeleteRemediationAction(orgId);
  const assignMutation = useAssignRemediationAction(orgId);
  const statusMutation = useUpdateRemediationStatus(orgId);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Organize actions into kanban columns - map to simplified status names
  const columns: KanbanColumn[] = useMemo(() => {
    const statusColumns: Record<string, KanbanColumn> = {
      'open': { id: 'open', title: 'Open', actions: [] },
      'assigned': { id: 'assigned', title: 'Assigned', actions: [] },
      'in_progress': { id: 'in_progress', title: 'In Progress', actions: [] },
      'under_review': { id: 'under_review', title: 'Under Review', actions: [] },
      'resolved': { id: 'resolved', title: 'Resolved', actions: [] },
    };

    actions.forEach((action: RemediationAction) => {
      if (statusColumns[action.status]) {
        statusColumns[action.status].actions.push(action);
      }
    });

    return Object.values(statusColumns);
  }, [actions]);

  // Event handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the action being dragged
    const draggedAction = actions.find((action: RemediationAction) => action.id === activeId);
    if (!draggedAction) return;

    // Determine the new status based on the drop zone
    let newStatus: RemediationStatus | null = null;
    
    // Check if dropped on a column or another action
    if (overId.startsWith('open') || overId === 'open') newStatus = 'open';
    else if (overId.startsWith('assigned') || overId === 'assigned') newStatus = 'assigned';
    else if (overId.startsWith('in_progress') || overId === 'in_progress') newStatus = 'in_progress';
    else if (overId.startsWith('under_review') || overId === 'under_review') newStatus = 'under_review';
    else if (overId.startsWith('resolved') || overId === 'resolved') newStatus = 'resolved';
    else {
      // Dropped on another action, find its status
      const targetAction = actions.find((action: RemediationAction) => action.id === overId);
      if (targetAction) newStatus = targetAction.status;
    }

    if (newStatus && newStatus !== draggedAction.status) {
      statusMutation.mutate({
        actionId: activeId,
        status: newStatus,
      }, {
        onSuccess: () => {
          refetch();
        },
        onError: (error) => {
          console.error('Failed to update status:', error);
          // TODO: Show error toast
        }
      });
    }
  }, [actions, statusMutation, refetch]);

  // Action handlers
  const handleCreateAction = useCallback((data: ActionFormData) => {
    const createData: CreateRemediationActionRequest = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      assigned_to: data.assigned_to || null,
      due_date: data.due_date || null,
      estimated_effort_hours: data.estimated_effort_hours || null,
      sla_hours: null,
      evidence_required: false,
      category: null,
      tags: [],
      risk_level: null,
      parent_action_id: null,
      related_finding_id: null,
      compliance_framework: null,
      notes: '',
    };

    createMutation.mutate(createData, {
      onSuccess: () => {
        setShowCreateModal(false);
        refetch();
      },
      onError: (error) => {
        console.error('Failed to create action:', error);
        // TODO: Show error toast
      }
    });
  }, [createMutation, refetch]);

  const handleEditAction = useCallback((action: RemediationAction) => {
    setEditingAction(action);
    setShowEditModal(true);
  }, []);

  const handleUpdateAction = useCallback((data: ActionFormData) => {
    if (!editingAction) return;

    const updateData: UpdateRemediationActionRequest = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      assigned_to: data.assigned_to || null,
      due_date: data.due_date || null,
      estimated_effort_hours: data.estimated_effort_hours || null,
    };

    updateMutation.mutate(updateData, {
      onSuccess: () => {
        setShowEditModal(false);
        setEditingAction(null);
        refetch();
      },
      onError: (error) => {
        console.error('Failed to update action:', error);
        // TODO: Show error toast
      }
    });
  }, [editingAction, updateMutation, refetch]);

  const handleDeleteAction = useCallback((actionId: string) => {
    if (!confirm('Are you sure you want to delete this remediation action?')) return;

    deleteMutation.mutate(actionId, {
      onSuccess: () => {
        refetch();
      },
      onError: (error) => {
        console.error('Failed to delete action:', error);
        // TODO: Show error toast
      }
    });
  }, [deleteMutation, refetch]);

  const handleAssignAction = useCallback((actionId: string, userId: string) => {
    assignMutation.mutate({ actionId, assigneeId: userId }, {
      onSuccess: () => {
        refetch();
      },
      onError: (error) => {
        console.error('Failed to assign action:', error);
        // TODO: Show error toast
      }
    });
  }, [assignMutation, refetch]);

  const handleStatusChange = useCallback((actionId: string, status: RemediationStatus) => {
    statusMutation.mutate({ actionId, status }, {
      onSuccess: () => {
        refetch();
      },
      onError: (error) => {
        console.error('Failed to update status:', error);
        // TODO: Show error toast
      }
    });
  }, [statusMutation, refetch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="text-lg text-gray-600">Loading remediation actions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64" role="alert" aria-live="assertive">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 max-w-md">
          <div className="flex items-center space-x-3">
            <div className="text-red-600">⚠️</div>
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Data</h3>
              <p className="text-red-600 mt-1">
                {error.message || 'Failed to load remediation actions. Please try again.'}
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Remediation Management
        </h1>
        <p className="text-gray-600">
          Manage and track remediation actions across your organization
        </p>
      </div>

      {/* Statistics Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total_actions}</div>
            <div className="text-sm text-gray-600">Total Actions</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.open_actions}</div>
            <div className="text-sm text-gray-600">Open</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.resolved_actions}</div>
            <div className="text-sm text-gray-600">Resolved</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.overdue_actions}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1 min-w-64">
          <Input
            placeholder="Search actions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            aria-label="Search remediation actions"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as RemediationStatus | 'all')}
          className="px-3 py-2 border border-gray-300 rounded-md"
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
          <option value="verified">Verified</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as RemediationPriority | 'all')}
          className="px-3 py-2 border border-gray-300 rounded-md"
          aria-label="Filter by priority"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
          aria-label="Filter by assignee"
        >
          <option value="all">All Assignees</option>
          <option value="unassigned">Unassigned</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.full_name || user.email}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showOverdueOnly}
            onChange={(e) => setShowOverdueOnly(e.target.checked)}
          />
          <span className="text-sm">Overdue Only</span>
        </label>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          + Create Action
        </Button>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4" role="main" aria-label="Remediation actions kanban board">
          {columns.map((column) => (
            <KanbanColumnComponent
              key={column.id}
              column={column}
              onEdit={handleEditAction}
              onDelete={handleDeleteAction}
              onAssign={handleAssignAction}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      </DndContext>

      {/* Create Action Modal */}
      {showCreateModal && (
        <ActionFormModal
          title="Create Remediation Action"
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAction}
          users={users}
        />
      )}

      {/* Edit Action Modal */}
      {showEditModal && editingAction && (
        <ActionFormModal
          title="Edit Remediation Action"
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingAction(null);
          }}
          onSubmit={handleUpdateAction}
          users={users}
          initialData={{
            title: editingAction.title,
            description: editingAction.description,
            priority: editingAction.priority,
            assigned_to: editingAction.assigned_to,
            due_date: editingAction.due_date,
            estimated_effort_hours: editingAction.estimated_effort_hours,
          }}
        />
      )}
    </div>
  );
};

// Action Form Modal Component
const ActionFormModal: React.FC<{
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ActionFormData) => void;
  users: Array<{ id: string; full_name?: string | null; email: string }>;
  initialData?: Partial<ActionFormData>;
}> = ({ title, isOpen, onClose, onSubmit, users, initialData }) => {
  const [formData, setFormData] = useState<ActionFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 'medium',
    assigned_to: initialData?.assigned_to || '',
    due_date: initialData?.due_date || '',
    estimated_effort_hours: initialData?.estimated_effort_hours || undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof ActionFormData, value: string | number | null | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <Input
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            required
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignee
            </label>
            <select
              value={formData.assigned_to || ''}
              onChange={(e) => handleChange('assigned_to', e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Unassigned</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <Input
              type="date"
              value={formData.due_date || ''}
              onChange={(e) => handleChange('due_date', e.target.value || null)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Hours
            </label>
            <Input
              type="number"
              value={formData.estimated_effort_hours || ''}
              onChange={(e) => handleChange('estimated_effort_hours', e.target.value ? parseInt(e.target.value) : undefined)}
              min="0"
              step="0.5"
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            {initialData ? 'Update' : 'Create'} Action
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RemediationManagementPage; 