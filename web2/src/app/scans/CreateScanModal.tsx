'use client';

import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  Select,
  Textarea,
  VStack,
  HStack,
  Text,
  Badge,
  Box,
  useToast,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Checkbox,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiPlay } from 'react-icons/fi';
import { useCreateScan, useScanTemplates } from '@data-access/scanApi';

interface CreateScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  userId: string;
  onSuccess: () => void;
}

interface ScanTarget {
  type: 'domain' | 'ip_range' | 'url' | 'file' | 'repository';
  value: string;
  description?: string;
}

const TARGET_TYPE_OPTIONS = [
  { value: 'domain', label: 'Domain', placeholder: 'example.com' },
  { value: 'ip_range', label: 'IP Range', placeholder: '192.168.1.0/24' },
  { value: 'url', label: 'URL', placeholder: 'https://example.com/api' },
  { value: 'file', label: 'File', placeholder: '/path/to/file.txt' },
  { value: 'repository', label: 'Repository', placeholder: 'https://github.com/user/repo' },
];

const SCAN_TYPE_OPTIONS = [
  { value: 'compliance', label: 'Compliance Scan' },
  { value: 'security', label: 'Security Scan' },
  { value: 'vulnerability', label: 'Vulnerability Scan' },
  { value: 'configuration', label: 'Configuration Scan' },
  { value: 'custom', label: 'Custom Scan' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'green' },
  { value: 'medium', label: 'Medium', color: 'yellow' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'critical', label: 'Critical', color: 'red' },
];

const COMPLIANCE_FRAMEWORKS = [
  'SOC 2', 'ISO 27001', 'NIST', 'GDPR', 'HIPAA', 'PCI DSS', 'CIS Controls'
];

export default function CreateScanModal({ isOpen, onClose, orgId, userId, onSuccess }: CreateScanModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scan_type: 'compliance',
    priority: 'medium',
    targets: [{ type: 'domain', value: '', description: '' }] as ScanTarget[],
    frameworks: [] as string[],
    scheduled: false,
  });
  
  const toast = useToast();
  const { data: templates } = useScanTemplates(orgId);
  const createScanMutation = useCreateScan();

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTargetChange = (index: number, field: string, value: string) => {
    const newTargets = [...formData.targets];
    newTargets[index] = { ...newTargets[index], [field]: value };
    setFormData(prev => ({ ...prev, targets: newTargets }));
  };

  const addTarget = () => {
    setFormData(prev => ({
      ...prev,
      targets: [...prev.targets, { type: 'domain', value: '', description: '' }]
    }));
  };

  const removeTarget = (index: number) => {
    if (formData.targets.length > 1) {
      setFormData(prev => ({
        ...prev,
        targets: prev.targets.filter((_, i) => i !== index)
      }));
    }
  };

  const handleFrameworkToggle = (framework: string) => {
    setFormData(prev => ({
      ...prev,
      frameworks: prev.frameworks.includes(framework)
        ? prev.frameworks.filter(f => f !== framework)
        : [...prev.frameworks, framework]
    }));
  };

  const applyTemplate = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (!template) return;

    setFormData(prev => ({
      ...prev,
      name: `${template.name} - ${new Date().toLocaleDateString()}`,
      description: template.description || '',
      scan_type: template.config.scan_type,
      priority: template.config.priority,
      targets: template.config.targets.length > 0 ? template.config.targets : [{ type: 'domain', value: '', description: '' }],
      frameworks: template.config.options?.frameworks || [],
    }));
    setStep(2);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter a scan name',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      if (formData.targets.some(t => !t.value.trim())) {
        toast({
          title: 'Error',
          description: 'Please fill in all target values',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const scanConfig = {
        scan_type: formData.scan_type as any,
        targets: formData.targets,
        priority: formData.priority as any,
        options: {
          frameworks: formData.frameworks,
          depth: 'standard',
        },
      };

      await createScanMutation.mutateAsync({
        org_id: orgId,
        user_id: userId,
        name: formData.name,
        description: formData.description,
        config: scanConfig,
      });

      toast({
        title: 'Scan Created',
        description: 'Your scan has been created successfully and is now pending execution.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onSuccess();
      handleClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create scan. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      name: '',
      description: '',
      scan_type: 'compliance',
      priority: 'medium',
      targets: [{ type: 'domain', value: '', description: '' }],
      frameworks: [],
      scheduled: false,
    });
    onClose();
  };

  const isValidStep = () => {
    switch (step) {
      case 2:
        return formData.name.trim() !== '';
      case 3:
        return formData.targets.every(t => t.value.trim() !== '');
      default:
        return true;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent maxH="90vh" overflowY="auto">
        <ModalHeader>
          Create New Scan - Step {step} of 4
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {/* Step 1: Template Selection */}
          {step === 1 && (
            <VStack spacing={4} align="stretch">
              <Box>
                <Heading size="md" mb={2}>Choose a Template</Heading>
                <Text color="gray.600">Start with a pre-configured template or create a custom scan</Text>
              </Box>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {templates?.map((template) => (
                  <Card 
                    key={template.id} 
                    cursor="pointer" 
                    _hover={{ borderColor: 'blue.300' }}
                    onClick={() => applyTemplate(template.id)}
                  >
                    <CardHeader pb={2}>
                      <HStack justify="space-between">
                        <Heading size="sm">{template.name}</Heading>
                        {template.is_default && <Badge colorScheme="blue">Default</Badge>}
                      </HStack>
                    </CardHeader>
                    <CardBody pt={0}>
                      <Text fontSize="sm" color="gray.600" mb={3}>
                        {template.description}
                      </Text>
                      <HStack spacing={2}>
                        <Badge colorScheme="purple">{template.config.scan_type}</Badge>
                        <Badge colorScheme="orange">{template.config.priority}</Badge>
                      </HStack>
                    </CardBody>
                  </Card>
                ))}
                
                <Card 
                  cursor="pointer" 
                  _hover={{ borderColor: 'blue.300' }}
                  onClick={() => setStep(2)}
                >
                  <CardHeader pb={2}>
                    <Heading size="sm">Custom Scan</Heading>
                  </CardHeader>
                  <CardBody pt={0}>
                    <Text fontSize="sm" color="gray.600">
                      Create a completely custom scan configuration from scratch
                    </Text>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </VStack>
          )}

          {/* Step 2: Basic Information */}
          {step === 2 && (
            <VStack spacing={4} align="stretch">
              <Box>
                <Heading size="md" mb={2}>Basic Information</Heading>
                <Text color="gray.600">Configure the basic settings for your scan</Text>
              </Box>

              <Box>
                <Text mb={2} fontWeight="medium">Scan Name *</Text>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter a descriptive name for your scan"
                />
              </Box>

              <Box>
                <Text mb={2} fontWeight="medium">Description</Text>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Optional description of what this scan will accomplish"
                  rows={3}
                />
              </Box>

              <SimpleGrid columns={2} spacing={4}>
                <Box>
                  <Text mb={2} fontWeight="medium">Scan Type *</Text>
                  <Select
                    value={formData.scan_type}
                    onChange={(e) => handleInputChange('scan_type', e.target.value)}
                  >
                    {SCAN_TYPE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Box>

                <Box>
                  <Text mb={2} fontWeight="medium">Priority *</Text>
                  <Select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                  >
                    {PRIORITY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Box>
              </SimpleGrid>
            </VStack>
          )}

          {/* Step 3: Targets */}
          {step === 3 && (
            <VStack spacing={4} align="stretch">
              <Box>
                <Heading size="md" mb={2}>Scan Targets</Heading>
                <Text color="gray.600">Define what systems, domains, or resources to scan</Text>
              </Box>

              <VStack spacing={3} align="stretch">
                {formData.targets.map((target, index) => (
                  <Card key={index}>
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <HStack spacing={3}>
                          <Box flex={1}>
                            <Text mb={1} fontSize="sm" fontWeight="medium">Type</Text>
                            <Select
                              value={target.type}
                              onChange={(e) => handleTargetChange(index, 'type', e.target.value)}
                              size="sm"
                            >
                              {TARGET_TYPE_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Select>
                          </Box>

                          <Box flex={2}>
                            <Text mb={1} fontSize="sm" fontWeight="medium">Target *</Text>
                            <Input
                              value={target.value}
                              onChange={(e) => handleTargetChange(index, 'value', e.target.value)}
                              placeholder={TARGET_TYPE_OPTIONS.find(opt => opt.value === target.type)?.placeholder}
                              size="sm"
                            />
                          </Box>

                          {formData.targets.length > 1 && (
                            <Tooltip label="Remove Target">
                              <IconButton
                                aria-label="Remove target"
                                icon={<FiTrash2 />}
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => removeTarget(index)}
                                mt={5}
                              />
                            </Tooltip>
                          )}
                        </HStack>

                        <Box>
                          <Text mb={1} fontSize="sm" fontWeight="medium">Description (Optional)</Text>
                          <Input
                            value={target.description || ''}
                            onChange={(e) => handleTargetChange(index, 'description', e.target.value)}
                            placeholder="Optional description for this target"
                            size="sm"
                          />
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}

                <Button
                  leftIcon={<FiPlus />}
                  variant="outline"
                  onClick={addTarget}
                  size="sm"
                >
                  Add Another Target
                </Button>
              </VStack>
            </VStack>
          )}

          {/* Step 4: Options */}
          {step === 4 && (
            <VStack spacing={4} align="stretch">
              <Box>
                <Heading size="md" mb={2}>Scan Options</Heading>
                <Text color="gray.600">Configure additional options for your scan</Text>
              </Box>

              {formData.scan_type === 'compliance' && (
                <Box>
                  <Text mb={3} fontWeight="medium">Compliance Frameworks</Text>
                  <SimpleGrid columns={2} spacing={2}>
                    {COMPLIANCE_FRAMEWORKS.map(framework => (
                      <Checkbox
                        key={framework}
                        isChecked={formData.frameworks.includes(framework)}
                        onChange={() => handleFrameworkToggle(framework)}
                      >
                        {framework}
                      </Checkbox>
                    ))}
                  </SimpleGrid>
                </Box>
              )}

              <Box>
                <Text mb={3} fontWeight="medium">Schedule Options</Text>
                <Checkbox
                  isChecked={formData.scheduled}
                  onChange={(e) => handleInputChange('scheduled', e.target.checked)}
                >
                  Enable Scheduled Scanning (Coming Soon)
                </Checkbox>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  If disabled, this will be a one-time scan that runs immediately
                </Text>
              </Box>

              {/* Review Summary */}
              <Box>
                <Text mb={3} fontWeight="medium">Review Summary</Text>
                <Card>
                  <CardBody>
                    <VStack spacing={2} align="stretch">
                      <HStack justify="space-between">
                        <Text fontSize="sm" fontWeight="medium">Name:</Text>
                        <Text fontSize="sm">{formData.name}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm" fontWeight="medium">Type:</Text>
                        <Badge colorScheme="purple">{formData.scan_type}</Badge>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm" fontWeight="medium">Priority:</Text>
                        <Badge colorScheme={PRIORITY_OPTIONS.find(p => p.value === formData.priority)?.color}>
                          {formData.priority}
                        </Badge>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm" fontWeight="medium">Targets:</Text>
                        <Text fontSize="sm">{formData.targets.length} target(s)</Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </Box>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={step === 1 ? handleClose : () => setStep(step - 1)}>
              {step === 1 ? 'Cancel' : 'Previous'}
            </Button>
            
            {step < 4 ? (
              <Button 
                colorScheme="blue" 
                onClick={() => setStep(step + 1)}
                isDisabled={!isValidStep()}
              >
                Next
              </Button>
            ) : (
              <Button 
                colorScheme="green" 
                leftIcon={<FiPlay />}
                onClick={handleSubmit}
                isLoading={createScanMutation.isPending}
                loadingText="Creating..."
              >
                Create Scan
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 