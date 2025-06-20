// widgets/OrgSwitcher.tsx
// Modular, accessible, extensible organization switcher widget
// Uses Shadcn UI, Radix, Tailwind, DaisyUI, and best practices

import React from 'react';
import { useOrganizations } from 'libs/data-access/organizationApi';
import { Organization } from 'libs/types/src/organization';
import { useQueryClient } from '@tanstack/react-query';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@radix-ui/react-dropdown-menu';
import { Button } from '../../../../../libs/ui/primitives';
import { FormError } from './SharedComponents';

interface OrgSwitcherProps {
  userId: string;
  currentOrgId: string;
  onSwitch: (org: Organization) => void;
}

export function OrgSwitcher({ userId, currentOrgId, onSwitch }: OrgSwitcherProps) {
  const { data: orgs = [], isLoading, isError, error } = useOrganizations(userId);
  const currentOrg = orgs.find((org) => org.id === currentOrgId);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" colorScheme="primary" aria-haspopup="listbox" aria-expanded="false">
          {currentOrg ? currentOrg.name : 'Select Organization'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-base-100 rounded shadow-lg mt-2 min-w-[200px]">
        {isLoading && <div className="p-2 text-base-content/60">Loading...</div>}
        {isError && <FormError error={(error as any)?.message || 'Failed to load organizations.'} />}
        {orgs.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onSelect={() => onSwitch(org)}
            className={`cursor-pointer px-4 py-2 ${org.id === currentOrgId ? 'bg-primary text-primary-content' : ''}`}
            aria-selected={org.id === currentOrgId}
            role="option"
          >
            {org.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
// TODO: Add RBAC, audit logging, and advanced features 