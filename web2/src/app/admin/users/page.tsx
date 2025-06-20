"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/libs/ui/primitives/Button';
import { Card } from '@/libs/ui/primitives/Card';
import { Input } from '@/libs/ui/primitives/Input';

// Import our user management API hooks
import {
  useUsers,
  useUserStats,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useBulkUserOperation,
  useToggleUserStatus,
  useResetUserPassword,
  type User,
  type CreateUserRequest,
  type UpdateUserRequest,
  type UserSearchFilters,
  type BulkUserOperation,
} from '@/libs/data-access/userManagementApi';

// Import auth context
import { useAuth } from '@/libs/hooks/authProvider';

interface SearchParams {
  page?: string;
  limit?: string;
  search?: string;
  role?: string;
  status?: string;
  sort_by?: string;
  sort_order?: string;
}

interface UserManagementPageProps {
  searchParams?: Promise<SearchParams>;
}

// Client component that handles the actual user management
function UserManagementClient({ initialSearchParams }: { initialSearchParams?: SearchParams }) {
  const { user: currentUser } = useAuth();

  // State for filters and pagination
  const [filters, setFilters] = useState<UserSearchFilters>({
    page: parseInt(initialSearchParams?.page || '1'),
    limit: parseInt(initialSearchParams?.limit || '20'),
    search: initialSearchParams?.search || '',
    role: initialSearchParams?.role as any,
    status: initialSearchParams?.status as any,
    sort_by: (initialSearchParams?.sort_by as any) || 'created_at',
    sort_order: (initialSearchParams?.sort_order as any) || 'desc',
  });

  // State for dialogs and selections
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [_selectedUserIds, _setSelectedUserIds] = useState<string[]>([]);

  // Get organization ID from current user (assuming it's available)
  const orgId = currentUser?.id || 'demo-org-id'; // Using user ID as org ID for now

  // API hooks
  const { data: usersData, isLoading: usersLoading, error: usersError } = useUsers(orgId, filters);
  const { data: statsData, isLoading: _statsLoading } = useUserStats(orgId);
  const createUserMutation = useCreateUser(orgId);
  const updateUserMutation = useUpdateUser(orgId, selectedUser?.id || '');
  const deleteUserMutation = useDeleteUser(orgId);
  const _bulkOperationMutation = useBulkUserOperation(orgId);
  const toggleStatusMutation = useToggleUserStatus(orgId);
  const resetPasswordMutation = useResetUserPassword(orgId);

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin';

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-96 p-6">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            🛡️ Access Denied
          </h2>
          <p className="text-gray-600">
            You need administrator privileges to access user management.
          </p>
        </Card>
      </div>
    );
  }

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<UserSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 })); // Reset to page 1 when filtering
  }, []);

  // Handle user creation
  const handleCreateUser = useCallback(async (userData: CreateUserRequest) => {
    try {
      await createUserMutation.mutateAsync(userData);
      if (typeof window !== 'undefined') {
        window.alert(`User ${userData.email} has been created successfully.`);
      }
      setCreateDialogOpen(false);
    } catch (_error) {
      if (typeof window !== 'undefined') {
        window.alert('Failed to create user. Please try again.');
      }
    }
  }, [createUserMutation]);

  // Handle user editing
  const handleEditUser = useCallback(async (userData: UpdateUserRequest) => {
    if (!selectedUser) return;
    
    try {
      await updateUserMutation.mutateAsync(userData);
      if (typeof window !== 'undefined') {
        window.alert(`User ${selectedUser.email} has been updated successfully.`);
      }
      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch (_error) {
      if (typeof window !== 'undefined') {
        window.alert('Failed to update user. Please try again.');
      }
    }
  }, [selectedUser, updateUserMutation]);

  // Handle user deletion
  const handleDeleteUser = useCallback(async (userId: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteUserMutation.mutateAsync(userId);
      if (typeof window !== 'undefined') {
        window.alert('User has been deleted successfully.');
      }
    } catch (_error) {
      if (typeof window !== 'undefined') {
        window.alert('Failed to delete user. Please try again.');
      }
    }
  }, [deleteUserMutation]);

  // Handle status toggle
  const handleToggleUserStatus = useCallback(async (userId: string, action: 'enable' | 'disable') => {
    try {
      await toggleStatusMutation.mutateAsync({ userId, action });
      if (typeof window !== 'undefined') {
        window.alert(`User has been ${action}d successfully.`);
      }
    } catch (_error) {
      if (typeof window !== 'undefined') {
        window.alert(`Failed to ${action} user. Please try again.`);
      }
    }
  }, [toggleStatusMutation]);

  // Handle password reset
  const handleResetPassword = useCallback(async (userEmail: string) => {
    try {
      await resetPasswordMutation.mutateAsync({ user_email: userEmail, send_email: true });
      if (typeof window !== 'undefined') {
        window.alert(`Password reset email sent to ${userEmail}.`);
      }
    } catch (_error) {
      if (typeof window !== 'undefined') {
        window.alert('Failed to send password reset email. Please try again.');
      }
    }
  }, [resetPasswordMutation]);

  if (usersError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-96 p-6">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Users</h2>
          <p className="text-gray-600 mb-4">
            {usersError.message || 'An error occurred while loading user data.'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-gray-600">
            Manage users, roles, and permissions for your organization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* TODO: Export users */}}
          >
            📥 Export
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            size="sm"
          >
            ➕ Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {statsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                👥
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{statsData.total_users}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                ✅
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{statsData.active_users}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                ⏸️
              </div>
              <div>
                <p className="text-sm text-gray-600">Inactive Users</p>
                <p className="text-2xl font-bold">{statsData.inactive_users}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                🛡️
              </div>
              <div>
                                 <p className="text-sm text-gray-600">Admins</p>
                 <p className="text-2xl font-bold">{statsData.users_by_role?.admin || 0}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <Input
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filters.role || ''}
              onChange={(e) => handleFilterChange({ role: e.target.value as any })}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange({ status: e.target.value as any })}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => setFilters({
                page: 1,
                limit: 20,
                search: '',
                role: undefined,
                status: undefined,
                sort_by: 'created_at',
                sort_order: 'desc',
              })}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Users</h3>
        </div>
        <div className="overflow-x-auto">
          {usersLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading users...</p>
            </div>
          ) : usersData?.users && usersData.users.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersData.users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {user.full_name?.charAt(0) || user.email.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'user'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                         user.status === 'active' 
                           ? 'bg-green-100 text-green-800'
                           : 'bg-red-100 text-red-800'
                       }`}>
                         {user.status === 'active' ? 'Active' : 'Inactive'}
                       </span>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setEditDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleUserStatus(user.id, user.is_active ? 'disable' : 'enable')}
                      >
                        {user.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetPassword(user.email)}
                      >
                        Reset Password
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">No users found.</p>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {usersData && usersData.total > usersData.limit && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((usersData.page - 1) * usersData.limit) + 1} to {Math.min(usersData.page * usersData.limit, usersData.total)} of {usersData.total} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange({ page: Math.max(1, filters.page - 1) })}
                disabled={filters.page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700">
                Page {filters.page} of {Math.ceil(usersData.total / usersData.limit)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange({ page: filters.page + 1 })}
                disabled={filters.page >= Math.ceil(usersData.total / usersData.limit)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create User Modal */}
      {createDialogOpen && (
        <UserFormModal
          title="Create New User"
          isOpen={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={handleCreateUser}
        />
      )}

      {/* Edit User Modal */}
      {editDialogOpen && selectedUser && (
        <UserFormModal
          title="Edit User"
          isOpen={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedUser(null);
          }}
          onSubmit={handleEditUser}
          initialData={{
            email: selectedUser.email,
            full_name: selectedUser.full_name || '',
            role: selectedUser.role,
            is_active: selectedUser.is_active,
          }}
        />
      )}
    </div>
  );
}

// User Form Modal Component
const UserFormModal: React.FC<{
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest | UpdateUserRequest) => void;
  initialData?: Partial<CreateUserRequest>;
}> = ({ title, isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    email: initialData?.email || '',
    full_name: initialData?.full_name || '',
    role: initialData?.role || 'user',
    is_active: initialData?.is_active ?? true,
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = new FormData(e.target as HTMLFormElement);
    const data: any = {};
    for (const [key, value] of submitData.entries()) {
      data[key] = value;
    }
    data.is_active = data.is_active === 'true';
    onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <Input
                name="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="is_active"
                value={formData.is_active.toString()}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {!initialData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required={!initialData}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? 'Update' : 'Create'} User
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main page component that handles async searchParams
export default async function UserManagementPage({ searchParams }: UserManagementPageProps) {
  const resolvedSearchParams = await searchParams;
  
  return <UserManagementClient initialSearchParams={resolvedSearchParams} />;
} 
} 