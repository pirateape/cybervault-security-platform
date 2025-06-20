'use client';

// widgets/OrganizationList.tsx
// Modular, accessible, extensible organization list widget
// Uses Shadcn UI, Radix, Tailwind, DaisyUI, and best practices

import React, { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogClose } from '@radix-ui/react-dialog';
import { Button, Card } from '../../../../../libs/ui/primitives';
import { LoadingSkeleton, FormError } from './SharedComponents';
import {
  useOrganizations,
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
} from 'libs/data-access/organizationApi';
import { Organization } from 'libs/types/src/organization';
import { OrganizationForm } from './OrganizationForm';
// import { useAuth } from 'libs/hooks/authProvider'; // For user context if needed
// import { z } from 'zod';
// import { useForm } from 'react-hook-form';

export interface OrganizationListProps {
  userId?: string;
}

export function OrganizationList({ userId }: OrganizationListProps) {
  // const { user } = useAuth();
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch organizations
  const {
    data: orgs = [],
    isLoading,
    isError,
    error,
  } = useOrganizations(userId);

  // Create organization mutation
  const createMutation = useCreateOrganization();
  // Update organization mutation (dynamic orgId)
  const updateMutation = editingOrg ? useUpdateOrganization(editingOrg.id) : null;
  // Delete organization mutation (dynamic orgId)
  const [orgIdToDelete, setOrgIdToDelete] = useState<string | null>(null);
  const deleteMutation = orgIdToDelete ? useDeleteOrganization(orgIdToDelete) : null;

  const handleFormSubmit = async (values: Partial<Organization>) => {
    setFormError(null);
    try {
      if (editingOrg) {
        await updateMutation?.mutateAsync({ ...editingOrg, ...values });
      } else {
        await createMutation.mutateAsync(values as Organization);
      }
      setShowForm(false);
      setEditingOrg(null);
    } catch (err: any) {
      setFormError(err?.message || 'An error occurred.');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingOrg(null);
    setFormError(null);
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setShowForm(true);
  };

  const handleDelete = async (org: Organization) => {
    if (window.confirm(`Delete organization "${org.name}"?`)) {
      await deleteMutation?.mutateAsync();
    }
  };

  return (
    <Card as="section" aria-labelledby="org-list-title" className="w-full max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 id="org-list-title" className="text-xl font-bold">Organizations</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="solid" colorScheme="primary" onClick={() => { setEditingOrg(null); setShowForm(true); }}>
              + New Organization
            </Button>
          </DialogTrigger>
          {showForm && (
            <DialogContent className="max-w-lg w-full">
              <DialogTitle>{editingOrg ? 'Edit Organization' : 'New Organization'}</DialogTitle>
              <OrganizationForm
                initialValues={editingOrg || {}}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
                loading={createMutation.isPending || updateMutation?.isPending}
                error={formError}
              />
              <DialogClose asChild>
                <Button variant="ghost" colorScheme="secondary" className="mt-2" onClick={handleFormCancel}>Close</Button>
              </DialogClose>
            </DialogContent>
          )}
        </Dialog>
      </div>
      {isLoading && <LoadingSkeleton className="h-12 w-full" />}
      {isError && <FormError error={(error as any)?.message || 'Failed to load organizations.'} />}
      {formError && <FormError error={formError} />}
      <ul aria-live="polite">
        {orgs.length === 0 && !isLoading && (
          <li className="text-base-content/60 py-4">No organizations found.</li>
        )}
        {orgs.map((org: Organization) => (
          <li key={org.id} className="py-3 gap-2">
            <Card className="flex items-center justify-between p-3">
              <div className="flex flex-col">
                <span className="font-medium">{org.name}</span>
                <span className="text-xs text-base-content/60">{org.slug}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" colorScheme="primary" onClick={() => handleEdit(org)} aria-label={`Edit ${org.name}`}>Edit</Button>
                <Button size="sm" variant="solid" colorScheme="danger" onClick={() => handleDelete(org)} aria-label={`Delete ${org.name}`}>Delete</Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      {/* TODO: Add pagination, search, and advanced filtering */}
      {/* TODO: Add RBAC enforcement and feedback */}
    </Card>
  );
} 