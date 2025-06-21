'use client';

import React, { useState } from 'react';
import { Card } from '@ui/primitives/Card';
import { Button } from '@ui/primitives/Button';
import { Input } from '@ui/primitives/Input';
import { Modal } from '@ui/primitives/Modal';
import { 
  useApiKeys, 
  useCreateApiKey, 
  useUpdateApiKey, 
  useDeleteApiKey, 
  useRotateApiKey 
} from '@/libs/data-access/externalApiManagementApi';

// Custom Icons
const KeyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const RefreshIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
  </svg>
);

const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <polyline points="3,6 5,6 21,6"/>
    <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const CopyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

interface CreateApiKeyForm {
  name: string;
  description: string;
  expiresIn: string;
  permissions: string[];
}

export function ApiKeyManagement() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState<any>(null);
  const [newKeyData, setNewKeyData] = useState<any>(null);
  const [createForm, setCreateForm] = useState<CreateApiKeyForm>({
    name: '',
    description: '',
    expiresIn: '30',
    permissions: ['read']
  });

  // React Query hooks
  const { data: apiKeys, isLoading, error } = useApiKeys();
  const createApiKeyMutation = useCreateApiKey();
  const updateApiKeyMutation = useUpdateApiKey();
  const deleteApiKeyMutation = useDeleteApiKey();
  const rotateApiKeyMutation = useRotateApiKey();

  const handleCreateApiKey = async () => {
    try {
      const result = await createApiKeyMutation.mutateAsync({
        name: createForm.name,
        description: createForm.description,
        expiresIn: parseInt(createForm.expiresIn),
        permissions: createForm.permissions
      });
      
      setNewKeyData(result);
      setShowCreateModal(false);
      setShowKeyModal(true);
      setCreateForm({
        name: '',
        description: '',
        expiresIn: '30',
        permissions: ['read']
      });
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const handleRotateKey = async (keyId: string) => {
    try {
      const result = await rotateApiKeyMutation.mutateAsync(keyId);
      setNewKeyData(result);
      setShowKeyModal(true);
    } catch (error) {
      console.error('Failed to rotate API key:', error);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      try {
        await deleteApiKeyMutation.mutateAsync(keyId);
      } catch (error) {
        console.error('Failed to delete API key:', error);
      }
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'revoked': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading API keys...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading API keys: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">API Key Management</h3>
          <p className="text-gray-600 text-sm">
            Securely manage API keys with automatic rotation and expiration tracking
          </p>
        </div>
        <Button
          variant="solid"
          colorScheme="primary"
          onClick={() => setShowCreateModal(true)}
          leftIcon={<PlusIcon className="w-4 h-4" />}
        >
          Create API Key
        </Button>
      </div>

      {/* API Keys List */}
      <div className="grid gap-4">
        {apiKeys?.map((key: any) => (
          <Card key={key.id} variant="outline" className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <KeyIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{key.name}</h4>
                  <p className="text-sm text-gray-600">{key.description}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>Created: {formatDate(key.createdAt)}</span>
                    <span>Expires: {formatDate(key.expiresAt)}</span>
                    <span>Last used: {key.lastUsed ? formatDate(key.lastUsed) : 'Never'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(key.status)}`}>
                  {key.status}
                </span>
                
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(key.maskedKey)}
                    title="Copy masked key"
                  >
                    <CopyIcon className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRotateKey(key.id)}
                    title="Rotate key"
                  >
                    <RefreshIcon className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    colorScheme="danger"
                    onClick={() => handleDeleteKey(key.id)}
                    title="Delete key"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Usage Stats */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Requests:</span>
                  <span className="ml-1 font-medium">{key.totalRequests?.toLocaleString() || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">This Month:</span>
                  <span className="ml-1 font-medium">{key.monthlyRequests?.toLocaleString() || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Rate Limit:</span>
                  <span className="ml-1 font-medium">{key.rateLimit || 'Unlimited'}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
        
        {(!apiKeys || apiKeys.length === 0) && (
          <Card variant="outline" className="p-8 text-center">
            <KeyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No API Keys</h3>
            <p className="text-gray-600 mb-4">
              Create your first API key to start integrating with external services.
            </p>
            <Button
              variant="solid"
              colorScheme="primary"
              onClick={() => setShowCreateModal(true)}
            >
              Create API Key
            </Button>
          </Card>
        )}
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New API Key</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Production API Key"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Input
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expires In (days)
                </label>
                <select
                  value={createForm.expiresIn}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, expiresIn: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="365">1 year</option>
                  <option value="0">Never expires</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  {['read', 'write', 'admin'].map((permission) => (
                    <label key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={createForm.permissions.includes(permission)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCreateForm(prev => ({
                              ...prev,
                              permissions: [...prev.permissions, permission]
                            }));
                          } else {
                            setCreateForm(prev => ({
                              ...prev,
                              permissions: prev.permissions.filter(p => p !== permission)
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 capitalize">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="solid"
                colorScheme="primary"
                onClick={handleCreateApiKey}
                disabled={!createForm.name || createApiKeyMutation.isPending}
              >
                {createApiKeyMutation.isPending ? 'Creating...' : 'Create API Key'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Show New API Key Modal */}
      {showKeyModal && newKeyData && (
        <Modal onClose={() => setShowKeyModal(false)}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <KeyIcon className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">API Key Created</h3>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> This is the only time you'll see the full API key. 
                Copy it now and store it securely.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <div className="flex gap-2">
                  <Input
                    value={newKeyData.key}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(newKeyData.key)}
                  >
                    <CopyIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key ID
                </label>
                <Input
                  value={newKeyData.id}
                  readOnly
                  className="font-mono"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button
                variant="solid"
                colorScheme="primary"
                onClick={() => setShowKeyModal(false)}
              >
                I've Saved the Key
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
} 