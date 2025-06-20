import { Role } from './roleContext';
import React from 'react';

const permissionMatrix: Record<string, Role[]> = {
  view_org_settings: ['owner', 'admin'],
  manage_members: ['owner', 'admin'],
  invite_users: ['owner', 'admin'],
  remove_users: ['owner', 'admin'],
  change_roles: ['owner', 'admin'],
  delete_organization: ['owner'],
  view_data: ['owner', 'admin', 'member'],
  create_update_data: ['owner', 'admin', 'member'],
  delete_data: ['owner', 'admin'],
};

type Action = keyof typeof permissionMatrix;

export function hasPermission(role: Role, action: Action): boolean {
  if (!role) return false;
  return permissionMatrix[action].includes(role);
}

// Higher-order component for protecting React components by role/action
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredAction: Action,
  getRole: () => Role
): React.FC<P> {
  return function PermissionWrapper(props: P) {
    const role = getRole();
    if (!hasPermission(role, requiredAction)) {
      return null;
    }
    return <Component {...props} />;
  };
}
