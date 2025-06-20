import React, { useState, useRef, useEffect } from 'react';
import { useAdminResetPassword } from '../api/adminApi';
import { useAuth } from '../context/AuthContext';
import {
  useToast,
  Button,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Table,
  Tbody,
  Tr,
  Td,
  Box,
  Spinner,
  Alert,
  AlertIcon,
  Text,
  Select,
  Portal,
} from '@chakra-ui/react';
import { supabase } from '../utils/supabaseClient';

const UserManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const resetPasswordMutation = useAdminResetPassword();
  const toast = useToast();
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // User fetching state
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // userId for which action is loading

  // Fetch users
  const fetchUsers = async () => {
    if (!user || !user.org_id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error, status } = await supabase
        .from('users')
        .select('id, email, full_name, role, is_disabled')
        .eq('org_id', user.org_id);
      if (error && status !== 406) {
        setError(error.message);
        setUsers([]);
      } else if (status === 406) {
        setUsers([]);
      } else {
        setUsers(data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user?.org_id]);

  // Role change
  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!user || !user.org_id) return;
    setActionLoading(userId + '-role');
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)
        .eq('org_id', user.org_id);
      if (error) throw error;
      toast({ status: 'success', title: 'Role updated' });
      fetchUsers();
    } catch (err: any) {
      toast({
        status: 'error',
        title: 'Role update failed',
        description: err.message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Disable/Enable
  const handleDisable = async (userId: string) => {
    if (!user || !user.org_id) return;
    setActionLoading(userId + '-disable');
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_disabled: true })
        .eq('id', userId)
        .eq('org_id', user.org_id);
      if (error) throw error;
      toast({ status: 'success', title: 'User disabled' });
      fetchUsers();
    } catch (err: any) {
      toast({
        status: 'error',
        title: 'Disable failed',
        description: err.message,
      });
    } finally {
      setActionLoading(null);
    }
  };
  const handleEnable = async (userId: string) => {
    if (!user || !user.org_id) return;
    setActionLoading(userId + '-enable');
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_disabled: false })
        .eq('id', userId)
        .eq('org_id', user.org_id);
      if (error) throw error;
      toast({ status: 'success', title: 'User enabled' });
      fetchUsers();
    } catch (err: any) {
      toast({
        status: 'error',
        title: 'Enable failed',
        description: err.message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Delete
  const handleDelete = async (userId: string) => {
    if (!user || !user.org_id) return;
    if (!window.confirm('Are you sure? This cannot be undone.')) return;
    setActionLoading(userId + '-delete');
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
        .eq('org_id', user.org_id);
      if (error) throw error;
      toast({ status: 'success', title: 'User deleted' });
      fetchUsers();
    } catch (err: any) {
      toast({
        status: 'error',
        title: 'Delete failed',
        description: err.message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Reset password
  const handleOpenDialog = (email: string) => {
    setSelectedUserEmail(email);
    setIsDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedUserEmail(null);
  };
  const handleConfirmReset = () => {
    if (!selectedUserEmail) return;
    resetPasswordMutation.mutate(
      { user_email: selectedUserEmail },
      {
        onSuccess: (data) => {
          if ('success' in data && data.success) {
            toast({
              status: 'success',
              title: 'Password Reset Email Sent',
              description: data.message,
            });
          } else if ('error' in data) {
            toast({
              status: 'error',
              title: 'Reset Failed',
              description: data.error?.message || 'Unknown error',
            });
          }
          handleCloseDialog();
        },
        onError: (err) => {
          toast({
            status: 'error',
            title: 'Network Error',
            description: err.message,
          });
          handleCloseDialog();
        },
      }
    );
  };

  // RBAC helpers
  const isSelf = (u: any) => u.id === user?.id;
  const isLastAdmin = (u: any) => {
    if (u.role !== 'admin') return false;
    const admins = users.filter((x) => x.role === 'admin' && !x.is_disabled);
    return admins.length === 1 && admins[0].id === u.id;
  };

  return (
    <Box>
      {loading && <Spinner />}
      {error && (
        <Alert status="error" mt={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}
      {!loading && !error && users.length === 0 && <Text>No users found.</Text>}
      {!loading && !error && users.length > 0 && (
        <Table>
          <Tbody>
            {users.map((u) => (
              <Tr key={u.id} style={u.is_disabled ? { opacity: 0.5 } : {}}>
                <Td>{u.email}</Td>
                <Td>{u.full_name || ''}</Td>
                <Td>
                  <Select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    size="sm"
                    isDisabled={!isAdmin || u.is_disabled || isSelf(u)}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </Select>
                </Td>
                <Td>
                  {u.is_disabled ? (
                    <span style={{ color: 'red' }}>Disabled</span>
                  ) : (
                    <span style={{ color: 'green' }}>Active</span>
                  )}
                </Td>
                <Td>
                  {u.is_disabled ? (
                    <Button
                      size="sm"
                      colorScheme="green"
                      onClick={() => handleEnable(u.id)}
                      isDisabled={!isAdmin || isSelf(u) || isLastAdmin(u)}
                      isLoading={actionLoading === u.id + '-enable'}
                    >
                      Enable
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      colorScheme="yellow"
                      onClick={() => handleDisable(u.id)}
                      isDisabled={!isAdmin || isSelf(u) || isLastAdmin(u)}
                      isLoading={actionLoading === u.id + '-disable'}
                    >
                      Disable
                    </Button>
                  )}
                  {isAdmin && (
                    <Button
                      size="sm"
                      colorScheme="red"
                      ml={2}
                      onClick={() => handleDelete(u.id)}
                      isDisabled={isSelf(u) || isLastAdmin(u)}
                      isLoading={actionLoading === u.id + '-delete'}
                    >
                      Delete
                    </Button>
                  )}
                  {isAdmin && (
                    <Button
                      size="sm"
                      colorScheme="blue"
                      ml={2}
                      onClick={() => handleOpenDialog(u.email)}
                      isLoading={
                        resetPasswordMutation.isPending &&
                        selectedUserEmail === u.email
                      }
                      aria-label={`Reset password for ${u.email}`}
                    >
                      Reset Password
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
      <AlertDialog
        isOpen={isDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={handleCloseDialog}
      >
        <AlertDialogOverlay>
          {/*
            Wrapping AlertDialogContent in Portal ensures it is rendered at the document body level,
            avoiding clipping or z-index issues from dashboard grid/layout containers.
          */}
          <Portal>
            <AlertDialogContent>
              <AlertDialogHeader>Reset Password</AlertDialogHeader>
              <AlertDialogBody>
                Are you sure you want to send a password reset email to{' '}
                {selectedUserEmail}?
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleConfirmReset}
                  ml={3}
                  isLoading={resetPasswordMutation.isPending}
                >
                  Confirm
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </Portal>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default UserManagement;
