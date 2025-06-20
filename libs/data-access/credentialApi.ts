import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabaseClient';
import { Credential } from 'libs/types/src/organization';
import { IVaultProvider, VaultProviderType } from 'libs/types/src/vault';

const TABLE = 'tenant_credentials';

// Placeholder: Select vault provider based on org config (default: supabase)
function getVaultProvider(orgId: string): IVaultProvider {
  // TODO: Implement provider selection logic (e.g., fetch org config from DB)
  // For now, always return SupabaseVaultProvider
  return supabaseVaultProvider;
}

// Example Supabase Vault provider implementation (stub)
const supabaseVaultProvider: IVaultProvider = {
  provider: 'supabase',
  async storeSecret(orgId, name, value, meta) {
    // TODO: Integrate with Supabase Vault API
    throw new Error('Supabase Vault integration not implemented');
  },
  async getSecret(orgId, secretRef) {
    // TODO: Integrate with Supabase Vault API
    throw new Error('Supabase Vault integration not implemented');
  },
  async rotateSecret(orgId, secretRef, newValue) {
    // TODO: Integrate with Supabase Vault API
    throw new Error('Supabase Vault integration not implemented');
  },
  async revokeSecret(orgId, secretRef) {
    // TODO: Integrate with Supabase Vault API
    throw new Error('Supabase Vault integration not implemented');
  },
};

// Example Azure Key Vault provider (stub)
const azureKeyVaultProvider: IVaultProvider = {
  provider: 'azure_key_vault',
  async storeSecret(orgId, name, value, meta) {
    // TODO: Integrate with Azure Key Vault API
    throw new Error('Azure Key Vault integration not implemented');
  },
  async getSecret(orgId, secretRef) {
    // TODO: Integrate with Azure Key Vault API
    throw new Error('Azure Key Vault integration not implemented');
  },
  async rotateSecret(orgId, secretRef, newValue) {
    // TODO: Integrate with Azure Key Vault API
    throw new Error('Azure Key Vault integration not implemented');
  },
  async revokeSecret(orgId, secretRef) {
    // TODO: Integrate with Azure Key Vault API
    throw new Error('Azure Key Vault integration not implemented');
  },
};

/**
 * List credentials for a given org (tenant).
 * @param orgId Organization (tenant) ID
 */
export function useCredentials(orgId: string) {
  return useQuery<Credential[], Error>({
    queryKey: ['credentials', orgId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase.from(TABLE).select('*').eq('org_id', orgId);
      if (error) throw error;
      return data as Credential[];
    },
    enabled: !!orgId,
  });
}

/**
 * Get a single credential for a given org (tenant).
 * @param orgId Organization (tenant) ID
 * @param credentialId Credential ID
 */
export function useCredential(orgId: string, credentialId: string) {
  return useQuery<Credential, Error>({
    queryKey: ['credential', orgId, credentialId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase.from(TABLE).select('*').eq('org_id', orgId).eq('id', credentialId).single();
      if (error) throw error;
      return data as Credential;
    },
    enabled: !!orgId && !!credentialId,
  });
}

/**
 * Create a credential for a given org (tenant).
 * @param orgId Organization (tenant) ID
 */
export function useCreateCredential(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation<Credential, Error, { name: string; type: string; value: string; metadata?: Record<string, any> }>({
    mutationFn: async ({ name, type, value, metadata }) => {
      const vault = getVaultProvider(orgId);
      // Store secret in vault, get secret_ref
      const secret_ref = await vault.storeSecret(orgId, name, value, metadata);
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase.from(TABLE).insert([
        { org_id: orgId, name, type, secret_ref, metadata }
      ]).select().single();
      if (error) throw error;
      return data as Credential;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials', orgId] });
    },
  });
}

/**
 * Update a credential for a given org (tenant).
 * @param orgId Organization (tenant) ID
 * @param credentialId Credential ID
 */
export function useUpdateCredential(orgId: string, credentialId: string) {
  const queryClient = useQueryClient();
  return useMutation<Credential, Error, { value?: string; metadata?: Record<string, any> }>({
    mutationFn: async ({ value, metadata }) => {
      const vault = getVaultProvider(orgId);
      // Optionally rotate secret in vault if value is provided
      if (value) {
        // Fetch credential to get secret_ref
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase.from(TABLE).select('secret_ref').eq('org_id', orgId).eq('id', credentialId).single();
        if (error) throw error;
        await vault.rotateSecret(orgId, data.secret_ref, value);
      }
      // Update metadata in DB
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase.from(TABLE).update({ metadata }).eq('org_id', orgId).eq('id', credentialId).select().single();
      if (error) throw error;
      return data as Credential;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials', orgId] });
      queryClient.invalidateQueries({ queryKey: ['credential', orgId, credentialId] });
    },
  });
}

/**
 * Delete a credential for a given org (tenant).
 * @param orgId Organization (tenant) ID
 * @param credentialId Credential ID
 */
export function useDeleteCredential(orgId: string, credentialId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      // Fetch credential to get secret_ref
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase.from(TABLE).select('secret_ref').eq('org_id', orgId).eq('id', credentialId).single();
      if (error) throw error;
      const vault = getVaultProvider(orgId);
      await vault.revokeSecret(orgId, data.secret_ref);
      // Delete credential metadata from DB
      const { error: delError } = await supabase.from(TABLE).delete().eq('org_id', orgId).eq('id', credentialId);
      if (delError) throw delError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials', orgId] });
      queryClient.invalidateQueries({ queryKey: ['credential', orgId, credentialId] });
    },
  });
} 