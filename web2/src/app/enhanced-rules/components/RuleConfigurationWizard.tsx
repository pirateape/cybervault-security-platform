'use client';

import React, { useState, useEffect } from 'react';
import {
  useUpdateRuleConfiguration,
  useValidateRuleConfiguration,
  useCreateRuleFromTemplate,
  type RuleConfiguration
} from '@/libs/data-access/enhancedRulesApi';

interface RuleConfigurationWizardProps {
  ruleId: string;
  orgId: string;
  configuration?: RuleConfiguration;
  templates?: any[];
  isLoading: boolean;
  onRuleSelect: (ruleId: string) => void;
  onRuleCreated: (ruleId: string) => void;
}

export function RuleConfigurationWizard({
  ruleId,
  orgId,
  configuration,
  templates = [],
  isLoading,
  onRuleSelect,
  onRuleCreated
}: RuleConfigurationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [ruleConfig, setRuleConfig] = useState<Partial<RuleConfiguration>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(!ruleId);

  const updateConfiguration = useUpdateRuleConfiguration(orgId, ruleId);
  const validateConfiguration = useValidateRuleConfiguration(orgId, ruleId);
  const createFromTemplate = useCreateRuleFromTemplate(orgId);

  useEffect(() => {
    if (configuration) {
      setRuleConfig(configuration);
      setIsCreating(false);
    }
  }, [configuration]);

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setRuleConfig({
      ...template.default_configuration,
      rule_id: ruleId || `rule-${Date.now()}`
    });
    setCurrentStep(2);
  };

  const handleConfigurationChange = (field: string, value: any) => {
    setRuleConfig(prev => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        [field]: value
      }
    }));
  };

  const handleValidateConfiguration = async () => {
    try {
      const result = await validateConfiguration.mutateAsync(ruleConfig.configuration);
      if (result.valid) {
        setValidationErrors([]);
        setCurrentStep(4);
      } else {
        setValidationErrors(result.errors || []);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      setValidationErrors(['Validation failed. Please check your configuration.']);
    }
  };

  const handleSaveConfiguration = async () => {
    try {
      if (isCreating && selectedTemplate) {
        const newRule = await createFromTemplate.mutateAsync({
          templateId: selectedTemplate.id,
          customization: ruleConfig
        });
        onRuleCreated(newRule.id);
      } else {
        await updateConfiguration.mutateAsync(ruleConfig);
      }
      alert('Configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration. Please try again.');
    }
  };

  const steps = [
    { id: 1, name: 'Template Selection', icon: '📋' },
    { id: 2, name: 'Basic Configuration', icon: '⚙️' },
    { id: 3, name: 'Advanced Settings', icon: '🔧' },
    { id: 4, name: 'Validation & Review', icon: '✅' },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Choose a Template</h3>
              <p className="text-gray-600 mb-6">
                Select a template to get started quickly, or create a custom rule from scratch.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                onClick={() => handleTemplateSelect({ id: 'custom', name: 'Custom Rule', default_configuration: {} })}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div className="text-center">
                  <span className="text-4xl mb-3 block">➕</span>
                  <h4 className="font-medium text-gray-900">Custom Rule</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Start from scratch with a blank configuration
                  </p>
                </div>
              </div>

              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="border border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div className="text-center">
                    <span className="text-4xl mb-3 block">{template.icon || '📄'}</span>
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {template.description}
                    </p>
                    {template.category && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        {template.category}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Configuration</h3>
              <p className="text-gray-600 mb-6">
                Configure the basic settings for your rule.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rule Name
                </label>
                <input
                  type="text"
                  value={ruleConfig.configuration?.name || ''}
                  onChange={(e) => handleConfigurationChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter rule name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rule Type
                </label>
                <select
                  value={ruleConfig.configuration?.type || ''}
                  onChange={(e) => handleConfigurationChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select rule type</option>
                  <option value="compliance">Compliance Rule</option>
                  <option value="security">Security Rule</option>
                  <option value="performance">Performance Rule</option>
                  <option value="validation">Validation Rule</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={ruleConfig.configuration?.description || ''}
                  onChange={(e) => handleConfigurationChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what this rule does"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={ruleConfig.configuration?.priority || 'medium'}
                  onChange={(e) => handleConfigurationChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={ruleConfig.configuration?.status || 'draft'}
                  onChange={(e) => handleConfigurationChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="deprecated">Deprecated</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Settings</h3>
              <p className="text-gray-600 mb-6">
                Configure advanced options and conditions for your rule.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rule Conditions (JSON)
                </label>
                <textarea
                  value={JSON.stringify(ruleConfig.configuration?.conditions || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const conditions = JSON.parse(e.target.value);
                      handleConfigurationChange('conditions', conditions);
                    } catch (error) {
                      // Invalid JSON, don't update
                    }
                  }}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder='{"field": "value", "operator": "equals"}'
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actions (JSON)
                </label>
                <textarea
                  value={JSON.stringify(ruleConfig.configuration?.actions || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const actions = JSON.parse(e.target.value);
                      handleConfigurationChange('actions', actions);
                    } catch (error) {
                      // Invalid JSON, don't update
                    }
                  }}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder='{"type": "alert", "message": "Rule violation detected"}'
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={ruleConfig.configuration?.enabled || false}
                      onChange={(e) => handleConfigurationChange('enabled', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable rule</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={ruleConfig.configuration?.logging || false}
                      onChange={(e) => handleConfigurationChange('logging', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable logging</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Validation & Review</h3>
              <p className="text-gray-600 mb-6">
                Review your configuration and validate it before saving.
              </p>
            </div>

            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-800 mb-2">Validation Errors:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm text-red-700">{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Configuration Summary</h4>
              <pre className="text-sm text-gray-700 overflow-auto max-h-64">
                {JSON.stringify(ruleConfig, null, 2)}
              </pre>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleValidateConfiguration}
                disabled={validateConfiguration.isPending}
                className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                {validateConfiguration.isPending ? 'Validating...' : 'Validate Configuration'}
              </button>
              
              {validationErrors.length === 0 && (
                <button
                  onClick={handleSaveConfiguration}
                  disabled={updateConfiguration.isPending || createFromTemplate.isPending}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {(updateConfiguration.isPending || createFromTemplate.isPending) 
                    ? 'Saving...' 
                    : isCreating ? 'Create Rule' : 'Save Configuration'
                  }
                </button>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isCreating ? 'Create New Rule' : 'Configuration Wizard'}
            </h2>
            <p className="text-gray-600">
              {isCreating ? 'Use the wizard to create a new rule' : `Configure rule: ${ruleId}`}
            </p>
          </div>
        </div>

        {/* Step Navigation */}
        <nav className="flex space-x-4">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => handleStepChange(step.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === step.id
                  ? 'bg-blue-100 text-blue-700'
                  : currentStep > step.id
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <span>{step.icon}</span>
              <span className="text-sm font-medium">{step.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      {currentStep > 1 && currentStep < 4 && (
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
} 