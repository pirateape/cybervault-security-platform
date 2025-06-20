'use client';

// widgets/TeamMembers.tsx
// Modular, accessible, extensible team member management widget
// Uses Shadcn UI, Radix, Tailwind, DaisyUI, and best practices

import React, { useState } from 'react';
import { Button, Input, Modal, Card, IconButton } from 'libs/ui/primitives';
import { useTeamMembers, useInviteTeamMember, useUpdateTeamMember, useRemoveTeamMember } from 'libs/data-access/teamApi';
import { TeamMember } from 'libs/types/src/organization';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ROLE_PERMISSIONS } from 'libs/types/src/roles';

const MemberSchema = z.object({
  email: z.string().email('Valid email required'),
  role: z.string().min(2, 'Role required'),
});

type MemberFormValues = z.infer<typeof MemberSchema>;

const ROLES = Object.keys(ROLE_PERMISSIONS);

function MemberForm({ initialValues = {}, onSubmit, onCancel, loading, error }: any) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setFocus } = useForm<MemberFormValues>({
    resolver: zodResolver(MemberSchema),
    defaultValues: initialValues,
    mode: 'onBlur',
  });
  React.useEffect(() => { reset(initialValues); }, [initialValues, reset]);
  React.useEffect(() => {
    if (errors.email) setFocus('email');
    else if (errors.role) setFocus('role');
  }, [errors, setFocus]);
  return (
    <Card as="form" onSubmit={handleSubmit(onSubmit)} aria-label="Team member form" className="max-w-md mx-auto">
      <div>
        <label htmlFor="email">Email</label>
        <Input id="email" type="email" {...register('email')} aria-invalid={!!errors.email} aria-describedby="member-email-error" disabled={loading || isSubmitting} autoFocus />
        {errors.email && <span id="member-email-error" role="alert" className="text-red-600 text-xs">{errors.email.message}</span>}
      </div>
      <div>
        <label htmlFor="role">Role</label>
        <select id="role" {...register('role')} aria-invalid={!!errors.role} aria-describedby="member-role-error" disabled={loading || isSubmitting} className="input input-bordered w-full">
          <option value="">Select role</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
          ))}
        </select>
        {errors.role && <span id="member-role-error" role="alert" className="text-red-600 text-xs">{errors.role.message}</span>}
      </div>
      {error && <div role="alert" aria-live="assertive" className="text-red-600 text-sm mt-2">{error}</div>}
      <div className="flex gap-2 justify-end mt-4">
        <Button type="button" variant="ghost" colorScheme="secondary" onClick={onCancel} disabled={loading || isSubmitting}>Cancel</Button>
        <Button type="submit" variant="solid" colorScheme="brand" isLoading={loading || isSubmitting} disabled={loading || isSubmitting}>{loading || isSubmitting ? 'Saving...' : 'Save'}</Button>
      </div>
    </Card>
  );
}

export function TeamMembers({ orgId }: { orgId: string }) {
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { data: members, isLoading, isError, error } = useTeamMembers(orgId);
  const inviteMutation = useInviteTeamMember(orgId);
  const updateMutation = editingMember ? useUpdateTeamMember(orgId, editingMember.id) : { mutateAsync: async () => {}, isPending: false };
  const removeMutation = editingMember ? useRemoveTeamMember(orgId, editingMember.id) : { mutateAsync: async () => {}, isPending: false };
  const handleFormSubmit = async (values: MemberFormValues) => {
    setFormError(null);
    try {
      if (editingMember) {
        await updateMutation.mutateAsync({ ...editingMember, ...values });
      } else {
        await inviteMutation.mutateAsync({ ...values, org_id: orgId });
      }
      setShowForm(false);
      setEditingMember(null);
    } catch (err: any) {
      setFormError(err?.message || 'An error occurred.');
    }
  };
  const handleFormCancel = () => { setShowForm(false); setEditingMember(null); setFormError(null); };
  const handleEdit = (member: TeamMember) => { setEditingMember(member); setShowForm(true); };
  const handleRemove = async (member: TeamMember) => {
    if (window.confirm(`Remove member ${member.email}?`)) {
      const remove = useRemoveTeamMember(orgId, member.id);
      await remove.mutateAsync();
    }
  };
  return (
    <Card className="max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Team Members</h2>
        <Button variant="solid" colorScheme="brand" onClick={() => { setEditingMember(null); setShowForm(true); }}>+ Invite Member</Button>
      </div>
      <Modal isOpen={showForm} onClose={handleFormCancel} title={editingMember ? 'Edit Member' : 'Invite Member'}>
        <MemberForm initialValues={editingMember || {}} onSubmit={handleFormSubmit} onCancel={handleFormCancel} loading={inviteMutation.isPending || updateMutation.isPending} error={formError} />
      </Modal>
      {isLoading && <div aria-busy="true" aria-live="polite" className="mb-2">Loading team members...</div>}
      {isError && <div role="alert" aria-live="assertive" className="text-red-600 mb-2">{(error as any)?.message || 'Failed to load team members.'}</div>}
      <ul>
        {members?.map((member) => {
          const update = useUpdateTeamMember(orgId, member.id);
          const remove = useRemoveTeamMember(orgId, member.id);
          return (
            <li key={member.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <div className="flex flex-col"><span className="font-medium">{member.email}</span><span className="text-xs text-gray-500">{member.role}</span></div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" colorScheme="primary" onClick={() => handleEdit(member)} aria-label={`Edit ${member.email}`}>Edit</Button>
                <Button size="sm" variant="solid" colorScheme="danger" onClick={async () => { if (window.confirm(`Remove member ${member.email}?`)) await remove.mutateAsync(); }} aria-label={`Remove ${member.email}`}>Remove</Button>
              </div>
            </li>
          );
        })}
      </ul>
      {/* TODO: Add RBAC, audit logging, and advanced features */}
    </Card>
  );
} 