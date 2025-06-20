// Rule types for compliance rule management UI

import { z } from 'zod';

export enum RuleLanguage {
  JSON = 'json',
  JAVASCRIPT = 'javascript',
}

export interface Rule {
  id: string;
  name: string;
  code: string;
  language: RuleLanguage;
  // Optionally extend with orgId, description, severity, createdAt, etc.
}

// Zod schema for Rule (frontend validation, matches backend ComplianceRule)
export const RuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  framework: z.string(),
  severity: z.string(),
  code: z.string().optional(), // Add code property for rule editor
  language: z.nativeEnum(RuleLanguage).optional(), // Add language property
  conditions: z.object({
    all: z.array(
      z.object({
        fact: z.string(),
        operator: z.string(),
        value: z.any(),
        path: z.string().nullable().optional(),
        params: z.any().optional(),
      })
    ),
  }),
  event: z.object({
    type: z.string(),
    params: z.record(z.any()),
  }),
  parameters: z.record(z.any()).optional(),
  is_active: z.boolean(),
  version: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  org_id: z.string().optional(),
});

export type RuleZ = z.infer<typeof RuleSchema>;
