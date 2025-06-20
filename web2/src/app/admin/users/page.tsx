"use client";

import React, { useState, useCallback } from 'react';
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

interface UserManagementPageProps {
  searchParams?: {
    page?: string;
    limit?: string;
    search?: string;
    role?: string;
    status?: string;
    sort_by?: string;
    sort_order?: string;
  };
}

export default function UserManagementPage({ searchParams }: UserManagementPageProps) {
  const { user: currentUser } = useAuth();

  // State for filters and pagination
  const [filters, setFilters] = useState<UserSearchFilters>({
    page: parseInt(searchParams?.page || '1'),
    limit: parseInt(searchParams?.limit || '20'),
    search: searchParams?.search || '',
    role: searchParams?.role as any,
    status: searchParams?.status as any,
    sort_by: (searchParams?.sort_by as any) || 'created_at',
    sort_order: (searchParams?.sort_order as any) || 'desc',
  });

  // State for dialogs and selections
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Get organization ID from current user (assuming it's available)
  const orgId = currentUser?.id || 'demo-org-id'; // Using user ID as org ID for now

  // API hooks
  const { data: usersData, isLoading: usersLoading, error: usersError } = useUsers(orgId, filters);
  const { data: statsData, isLoading: statsLoading } = useUserStats(orgId);
  const createUserMutation = useCreateUser(orgId);
  const updateUserMutation = useUpdateUser(orgId, selectedUser?.id || '');
  const deleteUserMutation = useDeleteUser(orgId);
  const bulkOperationMutation = useBulkUserOperation(orgId);
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
      alert(`User ${userData.email} has been created successfully.`);
      setCreateDialogOpen(false);
    } catch (error) {
      alert('Failed to create user. Please try again.');
    }
  }, [createUserMutation]);

  // Handle user editing
  const handleEditUser = useCallback(async (userData: UpdateUserRequest) => {
    if (!selectedUser) return;
    
    try {
      await updateUserMutation.mutateAsync(userData);
      alert(`User ${selectedUser.email} has been updated successfully.`);
      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      alert('Failed to update user. Please try again.');
    }
  }, [selectedUser, updateUserMutation]);

  // Handle user deletion
  const handleDeleteUser = useCallback(async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteUserMutation.mutateAsync(userId);
      alert('User has been deleted successfully.');
    } catch (error) {
      alert('Failed to delete user. Please try again.');
    }
  }, [deleteUserMutation]);

  // Handle status toggle
  const handleToggleUserStatus = useCallback(async (userId: string, action: 'enable' | 'disable') => {
    try {
      await toggleStatusMutation.mutateAsync({ userId, action });
      alert(`User has been ${action}d successfully.`);
    } catch (error) {
      alert(`Failed to ${action} user. Please try again.`);
    }
  }, [toggleStatusMutation]);

  // Handle password reset
  const handleResetPassword = useCallback(async (userEmail: string) => {
    try {
      await resetPasswordMutation.mutateAsync({ user_email: userEmail, send_email: true });
      alert(`Password reset email sent to ${userEmail}.`);
    } catch (error) {
      alert('Failed to send password reset email. Please try again.');
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{statsData.total_users}</p>
              </div>
              <span className="text-2xl">👥</span>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{statsData.active_users}</p>
              </div>
              <span className="text-2xl">✅</span>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Users</p>
                <p className="text-2xl font-bold">{statsData.inactive_users}</p>
              </div>
              <span className="text-2xl">❌</span>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Users</p>
                <p className="text-2xl font-bold">{statsData.pending_users}</p>
              </div>
              <span className="text-2xl">⏳</span>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Users</h2>
            <p className="text-gray-600">
              {usersData ? `${usersData.total} total users` : 'Loading users...'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              className="max-w-sm"
            />
          </div>
          <select
            value={filters.role || 'all'}
            onChange={(e) => handleFilterChange({ role: e.target.value === 'all' ? undefined : e.target.value as any })}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="auditor">Auditor</option>
            <option value="viewer">Viewer</option>
          </select>
          <select
            value={filters.status || 'all'}
            onChange={(e) => handleFilterChange({ status: e.target.value === 'all' ? undefined : e.target.value as any })}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          {usersLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : usersData?.users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users found.</div>
          ) : (
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Role</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Last Login</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersData?.users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                    <td className="border border-gray-300 px-4 py-2">{user.full_name || '-'}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className={`inline-block px-2 py-1 text-xs rounded ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'auditor' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className={`inline-block px-2 py-1 text-xs rounded ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' :
                        user.status === 'inactive' ? 'bg-red-100 text-red-800' :
                        user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setEditDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleToggleUserStatus(
                            user.id, 
                            user.is_disabled ? 'enable' : 'disable'
                          )}
                        >
                          {user.is_disabled ? 'Enable' : 'Disable'}
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleResetPassword(user.email)}
                        >
                          Reset Password
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          colorScheme="danger"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === currentUser?.id}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {usersData && usersData.total > usersData.limit && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, usersData.total)} of {usersData.total} users
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleFilterChange({ page: filters.page - 1 })}
                disabled={filters.page <= 1}
              >
                Previous
              </Button>
              <span className="px-3 py-1 text-sm">
                Page {filters.page} of {Math.ceil(usersData.total / filters.limit)}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleFilterChange({ page: filters.page + 1 })}
                disabled={filters.page >= Math.ceil(usersData.total / filters.limit)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Simple Create User Modal */}
      {createDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 p-6">
            <h3 className="text-lg font-semibold mb-4">Create New User</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const userData: CreateUserRequest = {
                email: formData.get('email') as string,
                full_name: formData.get('full_name') as string,
                role: formData.get('role') as any,
                password: formData.get('password') as string,
                department: formData.get('department') as string || null,
                job_title: formData.get('job_title') as string || null,
                send_invitation: true,
              };
              handleCreateUser(userData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input name="email" type="email" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <Input name="full_name" type="text" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select name="role" required className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="auditor">Auditor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <Input name="password" type="password" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <Input name="department" type="text" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Job Title</label>
                  <Input name="job_title" type="text" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Simple Edit User Modal */}
      {editDialogOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 p-6">
            <h3 className="text-lg font-semibold mb-4">Edit User</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const userData: UpdateUserRequest = {
                full_name: formData.get('full_name') as string,
                role: formData.get('role') as any,
                department: formData.get('department') as string || null,
                job_title: formData.get('job_title') as string || null,
              };
              handleEditUser(userData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input value={selectedUser.email} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <Input name="full_name" type="text" defaultValue={selectedUser.full_name || ''} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select name="role" defaultValue={selectedUser.role} required className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="auditor">Auditor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <Input name="department" type="text" defaultValue={selectedUser.department || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Job Title</label>
                  <Input name="job_title" type="text" defaultValue={selectedUser.job_title || ''} />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setSelectedUser(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
} 