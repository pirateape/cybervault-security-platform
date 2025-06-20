import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserManagement from '../components/UserManagement';
import { AuthContext } from '../context/AuthContext';

const adminUser = {
  id: '1',
  email: 'admin@example.com',
  role: 'admin',
  org_id: 'org1',
};
const normalUser = {
  id: '2',
  email: 'user@example.com',
  role: 'user',
  org_id: 'org1',
};
const users = [adminUser, normalUser];

global.fetch = jest.fn();

describe('Admin Password Reset Button', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows reset button for admin', () => {
    render(
      <AuthContext.Provider value={{ user: adminUser }}>
        <UserManagement users={users} />
      </AuthContext.Provider>
    );
    expect(screen.getAllByText('Reset Password').length).toBeGreaterThan(0);
  });

  it('does not show reset button for non-admin', () => {
    render(
      <AuthContext.Provider value={{ user: normalUser }}>
        <UserManagement users={users} />
      </AuthContext.Provider>
    );
    expect(screen.queryByText('Reset Password')).toBeNull();
  });

  it('opens dialog and triggers API call on confirm', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true, message: 'sent' }),
    });
    render(
      <AuthContext.Provider value={{ user: adminUser }}>
        <UserManagement users={users} />
      </AuthContext.Provider>
    );
    fireEvent.click(screen.getAllByText('Reset Password')[0]);
    expect(
      screen.getByText(/Are you sure you want to send a password reset email/)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      '/api/admin/reset-password',
      expect.objectContaining({ method: 'POST' })
    );
    await waitFor(() =>
      expect(
        screen.getByText(/Password Reset Email Sent|Reset Failed/)
      ).toBeInTheDocument()
    );
  });
});
