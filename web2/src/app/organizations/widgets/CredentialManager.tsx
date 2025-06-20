'use client';

// widgets/CredentialManager.tsx
// Modular, accessible, extensible credential manager widget
// Uses Shadcn UI, Radix, Tailwind, DaisyUI, and best practices

import React, { useState } from 'react';
import { Modal, Button, Input, Card } from 'libs/ui/primitives';
import { useCredentials, useCreateCredential, useUpdateCredential, useDeleteCredential } from 'libs/data-access/credentialApi';
import { Credential } from 'libs/types/src/organization';
import { IVaultProvider, VaultProviderType } from 'libs/types/src/vault';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth, useRequireRole } from 'libs/hooks/authProvider';
// TODO: Import getVaultProvider from credentialApi when implemented

const CredentialSchema = z.object({
  name: z.string().min(2, 'Name required'),
  type: z.string().min(2, 'Type required'),
  value: z.string().min(2, 'Value required'),
});

type CredentialFormValues = z.infer<typeof CredentialSchema>;

function CredentialForm({ initialValues = {}, onSubmit, onCancel, loading, error }: any) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CredentialFormValues>({
    resolver: zodResolver(CredentialSchema),
    defaultValues: { type: initialValues.type || 'generic', ...initialValues },
    mode: 'onBlur',
  });
  React.useEffect(() => { reset({ type: initialValues.type || 'generic', ...initialValues }); }, [initialValues, reset]);
  return (
    <form onSubmit={handleSubmit(onSubmit)} aria-label="Credential form" style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>
      <Card style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <label htmlFor="name" style={{ fontWeight: 500, marginBottom: 4 }}>Name</label>
          <Input id="name" type="text" {...register('name')} aria-invalid={!!errors.name} aria-describedby="cred-name-error" disabled={loading || isSubmitting} />
          {errors.name && <span id="cred-name-error" style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.name.message}</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <label htmlFor="type" style={{ fontWeight: 500, marginBottom: 4 }}>Type</label>
          <Input id="type" type="text" {...register('type')} aria-invalid={!!errors.type} aria-describedby="cred-type-error" disabled={loading || isSubmitting} />
          {errors.type && <span id="cred-type-error" style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.type.message}</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <label htmlFor="value" style={{ fontWeight: 500, marginBottom: 4 }}>Secret Value</label>
          <Input id="value" type="password" {...register('value')} aria-invalid={!!errors.value} aria-describedby="cred-value-error" disabled={loading || isSubmitting} autoComplete="new-password" />
          {errors.value && <span id="cred-value-error" style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.value.message}</span>}
        </div>
        <div aria-live="polite" aria-atomic="true" style={{ minHeight: 20 }}>
          {error && <span style={{ color: '#dc2626', fontSize: 12 }}>{error}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <Button type="button" variant="ghost" colorScheme="secondary" onClick={onCancel} disabled={loading || isSubmitting}>Cancel</Button>
          <Button type="submit" variant="solid" colorScheme="primary" disabled={loading || isSubmitting} aria-busy={loading || isSubmitting}>{loading || isSubmitting ? 'Saving...' : 'Save'}</Button>
        </div>
      </Card>
    </form>
  );
}

function VaultProviderBadge({ provider }: { provider: VaultProviderType }) {
  const label = provider === 'azure_key_vault' ? 'Azure Key Vault' : 'Supabase Vault';
  return (
    <span className={`badge badge-outline badge-sm ml-2 ${provider === 'azure_key_vault' ? 'badge-info' : 'badge-success'}`}>{label}</span>
  );
}

function ProviderSettingsPanel({ orgId, currentProvider, onProviderChange, isAdmin }: any) {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-4">
      <Button size="xs" variant="outline" onClick={() => setShow((v) => !v)} disabled={!isAdmin} title={!isAdmin ? 'Only admins can configure vault provider' : ''}>
        Vault Settings
      </Button>
      {show && (
        <Card className="bg-base-200 p-4 mt-2 max-w-md">
          <div className="font-bold mb-2">Vault Provider</div>
          <div className="flex gap-2 items-center">
            <label className="cursor-pointer">
              <input type="radio" name="vault-provider" checked={currentProvider === 'supabase'} onChange={() => onProviderChange('supabase')} disabled={!isAdmin} /> Supabase Vault
            </label>
            <label className="cursor-pointer">
              <input type="radio" name="vault-provider" checked={currentProvider === 'azure_key_vault'} onChange={() => onProviderChange('azure_key_vault')} disabled={!isAdmin} /> Azure Key Vault
            </label>
          </div>
          {currentProvider === 'azure_key_vault' && (
            <div className="mt-2">
              <label className="label-text">Azure Key Vault Config (stub)</label>
              <input className="input input-bordered w-full" placeholder="Key Vault URL" disabled={!isAdmin} />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export interface CredentialManagerProps {
  orgId: string;
}

export function CredentialManager({ orgId }: CredentialManagerProps) {
  // RBAC and context
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { data: credentials, isLoading, isError, error } = useCredentials(orgId);
  const createMutation = useCreateCredential(orgId);
  const updateMutation = useUpdateCredential(orgId, editingCredential?.id || '');
  const deleteMutation = useDeleteCredential(orgId, editingCredential?.id || '');
  const [provider, setProvider] = useState<VaultProviderType>('supabase'); // Default, stub
  const { user, loading } = useAuth();
  const isTenantAdmin = useRequireRole(['owner', 'admin']);
  const [revealId, setRevealId] = useState<string | null>(null);
  const [revealedValue, setRevealedValue] = useState<string | null>(null);
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealError, setRevealError] = useState<string | null>(null);

  // Simulate provider change (stub)
  const handleProviderChange = (prov: VaultProviderType) => setProvider(prov);

  // Securely fetch secret value from vault (stub)
  const handleReveal = async (cred: Credential) => {
    setRevealId(cred.id);
    setRevealLoading(true);
    setRevealError(null);
    setRevealedValue(null);
    try {
      // TODO: Use getVaultProvider(orgId).getSecret(orgId, cred.secret_ref)
      // For now, simulate delay
      await new Promise((res) => setTimeout(res, 800));
      setRevealedValue('••••••••••••••••'); // Never show real value in logs
    } catch (err: any) {
      setRevealError('Failed to fetch secret.');
    } finally {
      setRevealLoading(false);
    }
  };

  const handleFormSubmit = async (values: CredentialFormValues) => {
    setFormError(null);
    try {
      const payload = { ...values, type: values.type || 'generic' };
      if (editingCredential) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }
      setShowForm(false);
      setEditingCredential(null);
    } catch (err: any) {
      setFormError(err?.message || 'An error occurred.');
    }
  };

  const handleFormCancel = () => { setShowForm(false); setEditingCredential(null); setFormError(null); };
  const handleEdit = (cred: Credential) => { setEditingCredential(cred); setShowForm(true); };
  const handleDelete = async (cred: Credential) => {
    if (window.confirm(`Delete credential ${cred.name}?`)) {
      const deleteMut = useDeleteCredential(orgId, cred.id);
      await deleteMut.mutateAsync();
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 640, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
          Credentials
          <VaultProviderBadge provider={provider} />
        </h2>
        <Button variant="solid" colorScheme="primary" onClick={() => { setEditingCredential(null); setShowForm(true); }} disabled={!isTenantAdmin} title={!isTenantAdmin ? 'Only tenant admins can add credentials' : ''}>
          + Add Credential
        </Button>
        <Modal isOpen={showForm} onClose={handleFormCancel} title={editingCredential ? 'Edit Credential' : 'Add Credential'}>
          <CredentialForm initialValues={editingCredential || {}} onSubmit={handleFormSubmit} onCancel={handleFormCancel} loading={createMutation.isPending || updateMutation.isPending} error={formError} />
        </Modal>
      </div>
      <ProviderSettingsPanel orgId={orgId} currentProvider={provider} onProviderChange={handleProviderChange} isAdmin={isTenantAdmin} />
      <div aria-live="polite" aria-atomic="true" style={{ minHeight: 24 }}>
        {isLoading && <span style={{ color: '#2563eb', fontSize: 14 }}>Loading...</span>}
        {isError && <span style={{ color: '#dc2626', fontSize: 14 }}>{(error as any)?.message || 'Failed to load credentials.'}</span>}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {credentials?.map((cred) => (
          <li key={cred.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
            <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 500 }}>{cred.name}</span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{cred.type || 'N/A'}</span>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>Created: {cred.created_at ? new Date(cred.created_at).toLocaleString() : 'N/A'}</span>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>Updated: {cred.updated_at ? new Date(cred.updated_at).toLocaleString() : 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {isTenantAdmin && (
                  <Button size="xs" variant="outline" colorScheme="primary" onClick={() => handleReveal(cred)} aria-label={`Reveal value for ${cred.name}`} disabled={revealLoading && revealId === cred.id}>
                    {revealLoading && revealId === cred.id ? 'Loading...' : 'Reveal'}
                  </Button>
                )}
                {revealId === cred.id && (
                  <span style={{ marginLeft: 8, color: '#2563eb', fontSize: 12 }}>{revealError ? <span style={{ color: '#dc2626' }}>{revealError}</span> : revealedValue}</span>
                )}
                <Button size="sm" variant="outline" colorScheme="primary" onClick={() => handleEdit(cred)} disabled={!isTenantAdmin} title={!isTenantAdmin ? 'Only tenant admins can edit credentials' : ''}>
                  Edit
                </Button>
                <Button size="sm" variant="solid" colorScheme="danger" onClick={() => handleDelete(cred)} disabled={!isTenantAdmin} title={!isTenantAdmin ? 'Only tenant admins can delete credentials' : ''}>
                  Delete
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      {/* TODO: Add RBAC, audit logging, extensibility, and Storybook/test coverage hooks */}
    </div>
  );
} 