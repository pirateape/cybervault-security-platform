export type VaultProviderType = 'supabase' | 'azure_key_vault';

export interface VaultSecretMeta {
  provider: VaultProviderType;
  secret_ref: string; // Opaque reference or ID for the secret
  org_id: string;
  created_at: string;
  updated_at: string;
  // Optional metadata for extensibility
  metadata?: Record<string, any>;
}

export interface IVaultProvider {
  provider: VaultProviderType;
  /**
   * Store a secret and return a reference (opaque ID or URL)
   */
  storeSecret(orgId: string, name: string, value: string, meta?: Record<string, any>): Promise<string>;
  /**
   * Retrieve a secret value by reference
   */
  getSecret(orgId: string, secretRef: string): Promise<string>;
  /**
   * Rotate (update) a secret value
   */
  rotateSecret(orgId: string, secretRef: string, newValue: string): Promise<void>;
  /**
   * Revoke (delete) a secret
   */
  revokeSecret(orgId: string, secretRef: string): Promise<void>;
} 