import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RemediationManagementPage from '../page';

// Mock the API hooks
jest.mock('@data-access/remediationApi', () => ({
  useRemediationActions: jest.fn(),
  useRemediationStats: jest.fn(),
  useCreateRemediationAction: jest.fn(),
  useUpdateRemediationAction: jest.fn(),
  useDeleteRemediationAction: jest.fn(),
  useAssignRemediationAction: jest.fn(),
  useUpdateRemediationStatus: jest.fn(),
  getStatusColor: jest.fn((status: string) => {
    const colors: Record<string, string> = {
      'pending': 'yellow',
      'in_progress': 'blue',
      'completed': 'green',
      'cancelled': 'red'
    };
    return colors[status] || 'gray';
  }),
  getPriorityColor: jest.fn((priority: string) => {
    const colors: Record<string, string> = {
      'low': 'green',
      'medium': 'yellow',
      'high': 'red',
      'critical': 'purple'
    };
    return colors[priority] || 'gray';
  }),
  isOverdue: jest.fn((action: any) => {
    if (!action.due_date) return false;
    return new Date(action.due_date) < new Date();
  }),
  getActionProgress: jest.fn((action: any) => {
    const progressMap: Record<string, number> = {
      'pending': 0,
      'in_progress': 50,
      'completed': 100,
      'cancelled': 0
    };
    return progressMap[action.status] || 0;
  }),
}));

jest.mock('@data-access/userManagementApi', () => ({
  useUsers: jest.fn(),
}));

jest.mock('@/libs/hooks/authProvider', () => ({
  useAuth: jest.fn(),
}));

// Mock dnd-kit to avoid complex drag and drop testing
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd?: any }) => <div data-testid="dnd-context" onDrop={onDragEnd}>{children}</div>,
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
  PointerSensor: jest.fn(),
  closestCorners: jest.fn(),
}));

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div data-testid="sortable-context">{children}</div>,
  useSortable: jest.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
  verticalListSortingStrategy: jest.fn(),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: jest.fn(() => ''),
    },
  },
}));

// Mock data
const mockActions = [
  {
    id: '1',
    title: 'Fix SQL Injection Vulnerability',
    description: 'Remediate SQL injection in user login form',
    status: 'pending',
    priority: 'high',
    assigned_to: 'user1',
    assignee_name: 'John Doe',
    due_date: '2024-12-31',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    estimated_effort_hours: 8,
    actual_effort_hours: null,
    org_id: 'org1',
  },
  {
    id: '2',
    title: 'Update SSL Certificate',
    description: 'Renew SSL certificate for production environment',
    status: 'in_progress',
    priority: 'medium',
    assigned_to: 'user2',
    assignee_name: 'Jane Smith',
    due_date: '2024-11-30',
    created_at: '2024-01-02',
    updated_at: '2024-01-02',
    estimated_effort_hours: 4,
    actual_effort_hours: 2,
    org_id: 'org1',
  },
];

const mockStats = {
  total: 2,
  pending: 1,
  in_progress: 1,
  completed: 0,
  cancelled: 0,
  overdue: 0,
  avg_completion_time: 0,
};

const mockUsers = [
  { id: 'user1', full_name: 'John Doe', email: 'john@example.com' },
  { id: 'user2', full_name: 'Jane Smith', email: 'jane@example.com' },
];

const mockAuth = {
  user: { id: 'current-user', org_id: 'org1' },
  isAuthenticated: true,
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('RemediationManagementPage', () => {
  const mockUseRemediationActions = require('@data-access/remediationApi').useRemediationActions;
  const mockUseRemediationStats = require('@data-access/remediationApi').useRemediationStats;
  const mockUseCreateRemediationAction = require('@data-access/remediationApi').useCreateRemediationAction;
  const mockUseUpdateRemediationAction = require('@data-access/remediationApi').useUpdateRemediationAction;
  const mockUseDeleteRemediationAction = require('@data-access/remediationApi').useDeleteRemediationAction;
  const mockUseAssignRemediationAction = require('@data-access/remediationApi').useAssignRemediationAction;
  const mockUseUpdateRemediationStatus = require('@data-access/remediationApi').useUpdateRemediationStatus;
  const mockUseUsers = require('@data-access/userManagementApi').useUsers;
  const mockUseAuth = require('@/libs/hooks/authProvider').useAuth;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockUseAuth.mockReturnValue(mockAuth);
    mockUseUsers.mockReturnValue({ data: mockUsers, isLoading: false });
    mockUseRemediationActions.mockReturnValue({ 
      data: mockActions, 
      isLoading: false, 
      error: null 
    });
    mockUseRemediationStats.mockReturnValue({ 
      data: mockStats, 
      isLoading: false 
    });
    mockUseCreateRemediationAction.mockReturnValue({ 
      mutate: jest.fn(), 
      isPending: false 
    });
    mockUseUpdateRemediationAction.mockReturnValue({ 
      mutate: jest.fn(), 
      isPending: false 
    });
    mockUseDeleteRemediationAction.mockReturnValue({ 
      mutate: jest.fn(), 
      isPending: false 
    });
    mockUseAssignRemediationAction.mockReturnValue({ 
      mutate: jest.fn(), 
      isPending: false 
    });
    mockUseUpdateRemediationStatus.mockReturnValue({ 
      mutate: jest.fn(), 
      isPending: false 
    });
  });

  it('renders the remediation management page correctly', () => {
    render(
      <TestWrapper>
        <RemediationManagementPage />
      </TestWrapper>
    );

    expect(screen.getByText('Remediation Management')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('displays statistics correctly', () => {
    render(
      <TestWrapper>
        <RemediationManagementPage />
      </TestWrapper>
    );

    expect(screen.getByText('Total Actions')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('displays remediation actions in kanban columns', () => {
    render(
      <TestWrapper>
        <RemediationManagementPage />
      </TestWrapper>
    );

    // Check for kanban columns
    expect(screen.getByText('Pending (1)')).toBeInTheDocument();
    expect(screen.getByText('In Progress (1)')).toBeInTheDocument();
    expect(screen.getByText('Completed (0)')).toBeInTheDocument();

    // Check for action cards
    expect(screen.getByText('Fix SQL Injection Vulnerability')).toBeInTheDocument();
    expect(screen.getByText('Update SSL Certificate')).toBeInTheDocument();
  });

  it('opens create action modal when Create Action button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <RemediationManagementPage />
      </TestWrapper>
    );

    const createButton = screen.getByText('Create Action');
    await user.click(createButton);

    expect(screen.getByText('Create Remediation Action')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('filters actions by search term', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <RemediationManagementPage />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(/search actions/i);
    await user.type(searchInput, 'SQL');

    // Should show only the SQL injection action
    expect(screen.getByText('Fix SQL Injection Vulnerability')).toBeInTheDocument();
    expect(screen.queryByText('Update SSL Certificate')).not.toBeInTheDocument();
  });

  it('filters actions by priority', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <RemediationManagementPage />
      </TestWrapper>
    );

    const priorityFilter = screen.getByDisplayValue('all');
    await user.selectOptions(priorityFilter, 'high');

    // Should show only high priority actions
    expect(screen.getByText('Fix SQL Injection Vulnerability')).toBeInTheDocument();
    expect(screen.queryByText('Update SSL Certificate')).not.toBeInTheDocument();
  });

  it('filters actions by assignee', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <RemediationManagementPage />
      </TestWrapper>
    );

    const assigneeFilter = screen.getByDisplayValue('all');
    await user.selectOptions(assigneeFilter, 'user1');

    // Should show only actions assigned to user1
    expect(screen.getByText('Fix SQL Injection Vulnerability')).toBeInTheDocument();
    expect(screen.queryByText('Update SSL Certificate')).not.toBeInTheDocument();
  });

  it('creates a new action when form is submitted', async () => {
    const user = userEvent.setup();
    const mockMutate = jest.fn();
    mockUseCreateRemediationAction.mockReturnValue({ 
      mutate: mockMutate, 
      isPending: false 
    });
    
    render(
      <TestWrapper>
        <RemediationManagementPage />
      </TestWrapper>
    );

    // Open create modal
    await user.click(screen.getByText('Create Action'));

    // Fill out form
    await user.type(screen.getByLabelText(/title/i), 'New Test Action');
    await user.type(screen.getByLabelText(/description/i), 'Test description');
    await user.selectOptions(screen.getByLabelText(/priority/i), 'high');

    // Submit form
    await user.click(screen.getByText('Create'));

    expect(mockMutate).toHaveBeenCalledWith({
      orgId: 'org1',
      data: {
        title: 'New Test Action',
        description: 'Test description',
        priority: 'high',
        assigned_to: null,
        due_date: null,
        estimated_effort_hours: null,
      },
    });
  });

  it('edits an action when edit button is clicked', async () => {
    const user = userEvent.setup();
    const mockMutate = jest.fn();
    mockUseUpdateRemediationAction.mockReturnValue({ 
      mutate: mockMutate, 
      isPending: false 
    });
    
    render(
      <TestWrapper>
        <RemediationManagementPage />
      </TestWrapper>
    );

    // Click edit button on first action
    const editButtons = screen.getAllByText('✏️');
    await user.click(editButtons[0]);

    expect(screen.getByText('Edit Remediation Action')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Fix SQL Injection Vulnerability')).toBeInTheDocument();
  });

  it('deletes an action when delete button is clicked', async () => {
    const user = userEvent.setup();
    const mockMutate = jest.fn();
    mockUseDeleteRemediationAction.mockReturnValue({ 
      mutate: mockMutate, 
      isPending: false 
    });
    
    // Mock window.confirm to return true
    global.confirm = jest.fn(() => true);
    
    render(
      <TestWrapper>
        <RemediationManagementPage />
      </TestWrapper>
    );

    // Click delete button on first action
    const deleteButtons = screen.getAllByText('🗑️');
    await user.click(deleteButtons[0]);

    expect(mockMutate).toHaveBeenCalledWith({
      orgId: 'org1',
      actionId: '1',
    });
  });

  it('shows loading state when data is loading', () => {
    mockUseRemediationActions.mockReturnValue({ 
      data: null, 
      isLoading: true, 
      error: null 
    });
    
    render(
      <TestWrapper>
        <RemediationManagementPage />
      </TestWrapper>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state when there is an error', () => {
    mockUseRemediationActions.mockReturnValue({ 
      data: null, 
      isLoading: false, 
      error: new Error('Failed to fetch') 
    });
    
    render(
      <TestWrapper>
        <RemediationManagementPage />
      </TestWrapper>
    );

    expect(screen.getByText(/error loading remediation actions/i)).toBeInTheDocument();
  });

  it('handles drag and drop functionality', async () => {
    const mockMutate = jest.fn();
    mockUseUpdateRemediationStatus.mockReturnValue({ 
      mutate: mockMutate, 
      isPending: false 
    });
    
    render(
      <TestWrapper>
        <RemediationManagementPage />
      </TestWrapper>
    );

    // Verify DnD context is rendered
    expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
  });

  it('shows action progress bars correctly', () => {
    render(
      <TestWrapper>
        <RemediationManagementPage />
      </TestWrapper>
    );

    // Check that progress bars are rendered
    const progressBars = screen.getAllByRole('progressbar', { hidden: true });
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('displays overdue indicators for overdue actions', () => {
    // Mock an overdue action
    const overdueAction = {
      ...mockActions[0],
      due_date: '2023-01-01', // Past date
    };
    
    mockUseRemediationActions.mockReturnValue({ 
      data: [overdueAction], 
      isLoading: false, 
      error: null 
    });
    
    require('@data-access/remediationApi').isOverdue.mockReturnValue(true);
    
    render(
      <TestWrapper>
        <RemediationManagementPage />
      </TestWrapper>
    );

    expect(screen.getByText('(Overdue)')).toBeInTheDocument();
  });

  it('validates form inputs correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <RemediationManagementPage />
      </TestWrapper>
    );

    // Open create modal
    await user.click(screen.getByText('Create Action'));

    // Try to submit without required fields
    await user.click(screen.getByText('Create'));

    // Form should not submit without title
    expect(screen.getByText('Create Remediation Action')).toBeInTheDocument();
  });

  it('closes modal when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <RemediationManagementPage />
      </TestWrapper>
    );

    // Open create modal
    await user.click(screen.getByText('Create Action'));
    expect(screen.getByText('Create Remediation Action')).toBeInTheDocument();

    // Close modal
    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Create Remediation Action')).not.toBeInTheDocument();
  });
}); 