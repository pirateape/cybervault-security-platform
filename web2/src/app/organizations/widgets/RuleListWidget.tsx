'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRules, useCreateRule, useUpdateRule, useDeleteRule } from 'libs/hooks/useRulesApi';
import { RuleZ } from 'libs/types/src/rule';
import { RuleFormDialog } from './RuleFormDialog';
import { Button, Card } from 'libs/ui/primitives';

export function RuleListWidget({ orgId }: { orgId: string }) {
  const { data: rules = [], isLoading, isError, error } = useRules(orgId);
  const createRule = useCreateRule(orgId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleZ | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingRule(null);
    setDialogOpen(true);
    setFormError(null);
  };
  const handleEdit = (rule: RuleZ) => {
    setEditingRule(rule);
    setDialogOpen(true);
    setFormError(null);
  };
  const handleDelete = async (rule: RuleZ) => {
    const deleteRule = useDeleteRule(orgId, rule.id);
    if (window.confirm(`Delete rule "${rule.name}"?`)) {
      try {
        await deleteRule.mutateAsync();
      } catch (err: any) {
        setFormError(err.message || 'Failed to delete rule.');
      }
    }
  };
  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingRule(null);
    setFormError(null);
  };
  const handleDialogSubmit = async (values: { name: string; description?: string; code: string }) => {
    try {
      if (editingRule) {
        const updateRule = useUpdateRule(orgId, editingRule.id);
        await updateRule.mutateAsync({ ...editingRule, ...values });
      } else {
        await createRule.mutateAsync(values as any);
      }
      setDialogOpen(false);
      setEditingRule(null);
      setFormError(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save rule.');
    }
  };
  return (
    <Card aria-label="Rule List Widget">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Rules</h2>
        <Button variant="solid" colorScheme="brand" onClick={handleCreate} aria-label="Create New Rule">New Rule</Button>
      </div>
      {isLoading ? (
        <div aria-busy="true" aria-live="polite" style={{ minHeight: 64 }}>Loading rules...</div>
      ) : isError ? (
        <div role="alert" aria-live="assertive" style={{ color: '#dc2626' }}>{error?.message || 'Failed to load rules.'}</div>
      ) : rules.length === 0 ? (
        <div role="status" aria-live="polite" style={{ color: '#64748b' }}>No rules found.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} role="listbox" aria-label="Rule List">
          {rules.map((rule: RuleZ) => (
            <li key={rule.id} style={{ marginBottom: 12 }}>
              <Card tabIndex={0} role="option" aria-selected={false} aria-label={rule.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{rule.name}</div>
                  <div style={{ fontSize: 14, color: '#64748b' }}>{rule.description}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button type="button" variant="outline" colorScheme="brand" onClick={() => handleEdit(rule)} aria-label={`Edit ${rule.name}`}>Edit</Button>
                  <Button type="button" variant="outline" colorScheme="danger" onClick={() => handleDelete(rule)} aria-label={`Delete ${rule.name}`}>Delete</Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <RuleFormDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        initialRule={editingRule || undefined}
        onSubmit={handleDialogSubmit}
        loading={createRule.isPending}
      />
      {formError && <div role="alert" aria-live="assertive" style={{ color: '#dc2626', marginTop: 12 }}>{formError}</div>}
      {/* TODO: Add RBAC, advanced features, and extensibility hooks */}
    </Card>
  );
} 