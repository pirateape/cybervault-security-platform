'use client';

import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  Button, 
  Input, 
  Select, 
  Badge, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  Progress, 
  IconButton, 
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem, 
  Alert, 
  AlertIcon, 
  Spinner, 
  Card, 
  CardBody, 
  CardHeader, 
  Stat, 
  StatLabel, 
  StatNumber, 
  StatHelpText, 
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useToast,
  Tooltip,
  HStack,
  VStack,
  Divider,
} from '@chakra-ui/react';
import { 
  FiPlay, 
  FiPause, 
  FiStop, 
  FiRefreshCw, 
  FiTrash2, 
  FiEye, 
  FiMoreVertical, 
  FiPlus, 
  FiFilter, 
  FiDownload, 
  FiClock, 
  FiActivity, 
  FiShield, 
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';
import { useScans, useScanStats, useUpdateScanStatus, useDeleteScan, useRunningScanProgress, useCreateScan, useScanTemplates } from '@data-access/scanApi';
import { formatDistanceToNow, format } from 'date-fns';

// Mock user data - replace with actual auth context
const mockUser = {
  id: '1',
  org_id: '1',
  role: 'admin',
};

export default function ScansDashboard() {
  const [filters, setFilters] = useState({
    status: [] as string[],
    scan_type: [] as string[],
    priority: [] as string[],
    search: '',
  });
  
  const [selectedTab, setSelectedTab] = useState(0);
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [selectedScan, setSelectedScan] = useState<string | null>(null);
  const toast = useToast();

  // API hooks
  const { data: scansData, isLoading: scansLoading, error: scansError, refetch: refetchScans } = useScans(mockUser.org_id, {
    status: filters.status.length > 0 ? filters.status : undefined,
    scan_type: filters.scan_type.length > 0 ? filters.scan_type : undefined,
    priority: filters.priority.length > 0 ? filters.priority : undefined,
  });

  const { data: statsData, isLoading: statsLoading } = useScanStats(mockUser.org_id);
  const { data: progressData } = useRunningScanProgress(mockUser.org_id);
  
  const updateScanStatusMutation = useUpdateScanStatus();
  const deleteScanMutation = useDeleteScan();

  // Filter scans by search term
  const filteredScans = useMemo(() => {
    if (!scansData?.data) return [];
    
    let filtered = scansData.data;
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(scan => 
        scan.name.toLowerCase().includes(searchLower) ||
        scan.description?.toLowerCase().includes(searchLower) ||
        scan.scan_type.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [scansData?.data, filters.search]);

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'running': return 'blue';
      case 'pending': return 'yellow';
      case 'failed': return 'red';
      case 'cancelled': return 'gray';
      case 'paused': return 'orange';
      default: return 'gray';
    }
  };

  // Priority color mapping
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  // Handle scan actions
  const handleScanAction = async (scanId: string, action: string) => {
    try {
      let newStatus: string;
      switch (action) {
        case 'start':
          newStatus = 'running';
          break;
        case 'pause':
          newStatus = 'paused';
          break;
        case 'stop':
          newStatus = 'cancelled';
          break;
        case 'resume':
          newStatus = 'running';
          break;
        default:
          return;
      }

      await updateScanStatusMutation.mutateAsync({ scanId, status: newStatus as any });
      toast({
        title: 'Scan Updated',
        description: `Scan ${action} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} scan`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteScan = async () => {
    if (!selectedScan) return;
    
    try {
      await deleteScanMutation.mutateAsync(selectedScan);
      toast({
        title: 'Scan Deleted',
        description: 'Scan has been successfully deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onDeleteClose();
      setSelectedScan(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete scan',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType as keyof typeof prev].includes(value)
        ? prev[filterType as keyof typeof prev].filter((item: string) => item !== value)
        : [...prev[filterType as keyof typeof prev], value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      scan_type: [],
      priority: [],
      search: '',
    });
  };

  if (scansError) {
    return (
      <Alert status="error">
        <AlertIcon />
        Failed to load scans: {scansError.message}
      </Alert>
    );
  }

  // CreateScan Modal Component
  function CreateScanModalComponent({ isOpen, onClose, orgId, userId, onSuccess }: {
    isOpen: boolean;
    onClose: () => void;
    orgId: string;
    userId: string;
    onSuccess: () => void;
  }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      scan_type: 'compliance',
      priority: 'medium',
      targets: [{ type: 'domain', value: '', description: '' }],
      frameworks: [] as string[],
    });
    
    const createScanMutation = useCreateScan();
    const { data: templates } = useScanTemplates(orgId);

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

        const scanConfig = {
          scan_type: formData.scan_type as any,
          targets: formData.targets.filter(t => t.value.trim()),
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
      });
      onClose();
    };

    return (
      <Modal isOpen={isOpen} onClose={handleClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Scan - Step {step} of 3</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            {step === 1 && (
              <VStack spacing={4} align="stretch">
                <Heading size="md">Basic Information</Heading>
                
                <Box>
                  <Text mb={2} fontWeight="medium">Scan Name *</Text>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter a descriptive name for your scan"
                  />
                </Box>

                <Box>
                  <Text mb={2} fontWeight="medium">Description</Text>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                    rows={3}
                  />
                </Box>

                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text mb={2} fontWeight="medium">Scan Type *</Text>
                    <Select
                      value={formData.scan_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, scan_type: e.target.value }))}
                    >
                      <option value="compliance">Compliance Scan</option>
                      <option value="security">Security Scan</option>
                      <option value="vulnerability">Vulnerability Scan</option>
                      <option value="configuration">Configuration Scan</option>
                      <option value="custom">Custom Scan</option>
                    </Select>
                  </Box>

                  <Box>
                    <Text mb={2} fontWeight="medium">Priority *</Text>
                    <Select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </Select>
                  </Box>
                </SimpleGrid>
              </VStack>
            )}

            {step === 2 && (
              <VStack spacing={4} align="stretch">
                <Heading size="md">Scan Targets</Heading>
                
                {formData.targets.map((target, index) => (
                  <Card key={index}>
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <HStack spacing={3}>
                          <Box flex={1}>
                            <Text mb={1} fontSize="sm" fontWeight="medium">Type</Text>
                            <Select
                              value={target.type}
                              onChange={(e) => {
                                const newTargets = [...formData.targets];
                                newTargets[index] = { ...newTargets[index], type: e.target.value as any };
                                setFormData(prev => ({ ...prev, targets: newTargets }));
                              }}
                              size="sm"
                            >
                              <option value="domain">Domain</option>
                              <option value="ip_range">IP Range</option>
                              <option value="url">URL</option>
                              <option value="file">File</option>
                              <option value="repository">Repository</option>
                            </Select>
                          </Box>

                          <Box flex={2}>
                            <Text mb={1} fontSize="sm" fontWeight="medium">Target *</Text>
                            <Input
                              value={target.value}
                              onChange={(e) => {
                                const newTargets = [...formData.targets];
                                newTargets[index] = { ...newTargets[index], value: e.target.value };
                                setFormData(prev => ({ ...prev, targets: newTargets }));
                              }}
                              placeholder="Enter target value"
                              size="sm"
                            />
                          </Box>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}

                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      targets: [...prev.targets, { type: 'domain', value: '', description: '' }]
                    }));
                  }}
                  size="sm"
                >
                  Add Another Target
                </Button>
              </VStack>
            )}

            {step === 3 && (
              <VStack spacing={4} align="stretch">
                <Heading size="md">Review & Create</Heading>
                
                <Card>
                  <CardBody>
                    <VStack spacing={2} align="stretch">
                      <HStack justify="space-between">
                        <Text fontWeight="medium">Name:</Text>
                        <Text>{formData.name}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="medium">Type:</Text>
                        <Badge colorScheme="purple">{formData.scan_type}</Badge>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="medium">Priority:</Text>
                        <Badge>{formData.priority}</Badge>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="medium">Targets:</Text>
                        <Text>{formData.targets.filter(t => t.value.trim()).length} target(s)</Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={step === 1 ? handleClose : () => setStep(step - 1)}>
                {step === 1 ? 'Cancel' : 'Previous'}
              </Button>
              
              {step < 3 ? (
                <Button 
                  colorScheme="blue" 
                  onClick={() => setStep(step + 1)}
                  isDisabled={step === 1 && !formData.name.trim()}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  colorScheme="green" 
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

  return (
    <Box p={6} maxW="full">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" mb={2}>Scan Management</Heading>
          <Text color="gray.600">Monitor and manage security scans across your organization</Text>
        </Box>
        <Button 
          leftIcon={<FiPlus />} 
          colorScheme="blue" 
          onClick={onCreateOpen}
          size="lg"
        >
          New Scan
        </Button>
      </Flex>

      {/* Statistics Cards */}
      {statsData && (
        <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4} mb={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Scans</StatLabel>
                <StatNumber>{statsData.total}</StatNumber>
                <StatHelpText>All time</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Running</StatLabel>
                <StatNumber color="blue.500">{statsData.running}</StatNumber>
                <StatHelpText>Active scans</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Completed</StatLabel>
                <StatNumber color="green.500">{statsData.completed}</StatNumber>
                <StatHelpText>Successfully finished</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Failed</StatLabel>
                <StatNumber color="red.500">{statsData.failed}</StatNumber>
                <StatHelpText>Require attention</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Findings</StatLabel>
                <StatNumber>{statsData.totalFindings}</StatNumber>
                <StatHelpText>Security issues</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Critical Findings</StatLabel>
                <StatNumber color="red.500">{statsData.criticalFindings}</StatNumber>
                <StatHelpText>High priority</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>
      )}

      {/* Running Scans Progress */}
      {progressData && progressData.length > 0 && (
        <Card mb={6}>
          <CardHeader>
            <Flex align="center" gap={2}>
              <FiActivity />
              <Heading size="md">Active Scans</Heading>
            </Flex>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              {progressData.map((scan) => (
                <Box key={scan.id} p={4} bg="gray.50" borderRadius="md">
                  <Flex justify="space-between" align="center" mb={2}>
                    <Text fontWeight="medium">{scan.name}</Text>
                    <Badge colorScheme={getStatusColor(scan.status)}>{scan.status}</Badge>
                  </Flex>
                  <Progress value={scan.progress} colorScheme="blue" size="sm" mb={2} />
                  <Flex justify="space-between" fontSize="sm" color="gray.600">
                    <Text>{scan.progress}% complete</Text>
                    {scan.estimated_completion && (
                      <Text>ETA: {format(scan.estimated_completion, 'HH:mm')}</Text>
                    )}
                  </Flex>
                </Box>
              ))}
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Filters and Search */}
      <Card mb={6}>
        <CardBody>
          <Flex gap={4} wrap="wrap" align="center">
            <Input
              placeholder="Search scans..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              maxW="300px"
            />
            
            <Select
              placeholder="Filter by status"
              maxW="200px"
              onChange={(e) => e.target.value && handleFilterChange('status', e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="paused">Paused</option>
            </Select>
            
            <Select
              placeholder="Filter by type"
              maxW="200px"
              onChange={(e) => e.target.value && handleFilterChange('scan_type', e.target.value)}
            >
              <option value="compliance">Compliance</option>
              <option value="security">Security</option>
              <option value="vulnerability">Vulnerability</option>
              <option value="configuration">Configuration</option>
              <option value="custom">Custom</option>
            </Select>
            
            <Select
              placeholder="Filter by priority"
              maxW="200px"
              onChange={(e) => e.target.value && handleFilterChange('priority', e.target.value)}
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
            
            <Button leftIcon={<FiFilter />} onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
            
            <Button leftIcon={<FiRefreshCw />} onClick={() => refetchScans()} variant="outline">
              Refresh
            </Button>
          </Flex>
          
          {/* Active Filters Display */}
          {(filters.status.length > 0 || filters.scan_type.length > 0 || filters.priority.length > 0) && (
            <Box mt={4}>
              <Text fontSize="sm" color="gray.600" mb={2}>Active Filters:</Text>
              <Flex gap={2} wrap="wrap">
                {filters.status.map(status => (
                  <Badge key={status} colorScheme="blue" cursor="pointer" 
                        onClick={() => handleFilterChange('status', status)}>
                    Status: {status} ×
                  </Badge>
                ))}
                {filters.scan_type.map(type => (
                  <Badge key={type} colorScheme="green" cursor="pointer"
                        onClick={() => handleFilterChange('scan_type', type)}>
                    Type: {type} ×
                  </Badge>
                ))}
                {filters.priority.map(priority => (
                  <Badge key={priority} colorScheme="orange" cursor="pointer"
                        onClick={() => handleFilterChange('priority', priority)}>
                    Priority: {priority} ×
                  </Badge>
                ))}
              </Flex>
            </Box>
          )}
        </CardBody>
      </Card>

      {/* Scans Table */}
      <Card>
        <CardBody>
          {scansLoading ? (
            <Flex justify="center" align="center" h="200px">
              <Spinner size="xl" />
            </Flex>
          ) : filteredScans.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text fontSize="lg" color="gray.500">No scans found</Text>
              <Text color="gray.400" mt={2}>
                {filters.search || filters.status.length > 0 || filters.scan_type.length > 0 || filters.priority.length > 0
                  ? "Try adjusting your filters or search terms"
                  : "Create your first scan to get started"
                }
              </Text>
            </Box>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Type</Th>
                    <Th>Status</Th>
                    <Th>Priority</Th>
                    <Th>Progress</Th>
                    <Th>Findings</Th>
                    <Th>Duration</Th>
                    <Th>Created</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredScans.map((scan) => (
                    <Tr key={scan.id} _hover={{ bg: 'gray.50' }}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">{scan.name}</Text>
                          {scan.description && (
                            <Text fontSize="sm" color="gray.600" noOfLines={1}>
                              {scan.description}
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <Badge colorScheme="purple" textTransform="capitalize">
                          {scan.scan_type}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(scan.status)} textTransform="capitalize">
                          {scan.status}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={getPriorityColor(scan.priority)} textTransform="capitalize">
                          {scan.priority}
                        </Badge>
                      </Td>
                      <Td>
                        <Box minW="100px">
                          <Progress value={scan.progress} colorScheme="blue" size="sm" />
                          <Text fontSize="xs" color="gray.600" mt={1}>
                            {scan.progress}%
                          </Text>
                        </Box>
                      </Td>
                      <Td>
                        <VStack spacing={1} align="start">
                          <Text fontSize="sm">
                            {scan.findings_count} total
                          </Text>
                          {scan.critical_findings > 0 && (
                            <Text fontSize="xs" color="red.500">
                              {scan.critical_findings} critical
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        {scan.duration_seconds ? (
                          <Text fontSize="sm">
                            {Math.round(scan.duration_seconds / 60)}m
                          </Text>
                        ) : scan.started_at ? (
                          <Text fontSize="sm" color="blue.500">
                            Running for {formatDistanceToNow(new Date(scan.started_at))}
                          </Text>
                        ) : (
                          <Text fontSize="sm" color="gray.400">-</Text>
                        )}
                      </Td>
                      <Td>
                        <Tooltip label={format(new Date(scan.created_at), 'PPpp')}>
                          <Text fontSize="sm">
                            {formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}
                          </Text>
                        </Tooltip>
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          {scan.status === 'pending' && (
                            <Tooltip label="Start Scan">
                              <IconButton
                                aria-label="Start scan"
                                icon={<FiPlay />}
                                size="sm"
                                variant="ghost"
                                colorScheme="green"
                                onClick={() => handleScanAction(scan.id, 'start')}
                              />
                            </Tooltip>
                          )}
                          
                          {scan.status === 'running' && (
                            <>
                              <Tooltip label="Pause Scan">
                                <IconButton
                                  aria-label="Pause scan"
                                  icon={<FiPause />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="orange"
                                  onClick={() => handleScanAction(scan.id, 'pause')}
                                />
                              </Tooltip>
                              <Tooltip label="Stop Scan">
                                <IconButton
                                  aria-label="Stop scan"
                                  icon={<FiStop />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => handleScanAction(scan.id, 'stop')}
                                />
                              </Tooltip>
                            </>
                          )}
                          
                          {scan.status === 'paused' && (
                            <Tooltip label="Resume Scan">
                              <IconButton
                                aria-label="Resume scan"
                                icon={<FiPlay />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => handleScanAction(scan.id, 'resume')}
                              />
                            </Tooltip>
                          )}
                          
                          <Tooltip label="View Results">
                            <IconButton
                              aria-label="View results"
                              icon={<FiEye />}
                              size="sm"
                              variant="ghost"
                              as="a"
                              href={`/scans/${scan.id}/results`}
                            />
                          </Tooltip>
                          
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              aria-label="More actions"
                              icon={<FiMoreVertical />}
                              size="sm"
                              variant="ghost"
                            />
                            <MenuList>
                              <MenuItem icon={<FiDownload />}>
                                Export Results
                              </MenuItem>
                              <MenuItem icon={<FiRefreshCw />}>
                                Clone Scan
                              </MenuItem>
                              <Divider />
                              <MenuItem 
                                icon={<FiTrash2 />} 
                                color="red.500"
                                onClick={() => {
                                  setSelectedScan(scan.id);
                                  onDeleteOpen();
                                }}
                              >
                                Delete Scan
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </CardBody>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Scan</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Are you sure you want to delete this scan? This action cannot be undone.</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="red" 
              onClick={handleDeleteScan}
              isLoading={deleteScanMutation.isPending}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Create Scan Modal */}
      <CreateScanModalComponent 
        isOpen={isCreateOpen} 
        onClose={onCreateClose}
        orgId={mockUser.org_id}
        userId={mockUser.id}
        onSuccess={() => {
          refetchScans();
          onCreateClose();
        }}
      />
    </Box>
  );
} 