// libs/types/src/organization.ts
// Shared types for organizations, team members, and credentials

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  // Optional metadata for extensibility
  metadata?: Record<string, any>;
}

export interface TeamMember {
  id: string;
  org_id: string;
  user_id: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer' | string;
  invited_at?: string;
  joined_at?: string;
  status?: 'active' | 'invited' | 'removed' | string;
  metadata?: Record<string, any>;
}

export interface Credential {
  id: string;
  org_id: string;
  name: string;
  type: string;
  value: string;
  created_at: string;
  updated_at: string;
  // Optional metadata for extensibility
  metadata?: Record<string, any>;
}

export {}; 