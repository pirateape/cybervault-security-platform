'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Badge,
  Button,
  SimpleGrid,
  Flex,
  Input,
  Select,
  Table,
  Tbody,
  Tr,
  Td,
  Th,
  Thead,
  Progress,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tooltip,
  IconButton,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
  Code,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Link,
} from '@chakra-ui/react';
import {
  FiArrowLeft,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiEye,
  FiExternalLink,
  FiAlertTriangle,
  FiShield,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart3,
  FiPieChart,
  FiSettings,
  FiBookOpen,
  FiTarget,
} from 'react-icons/fi';
import { useScan, useScanResults } from '@data-access/scanApi';
import { formatDistanceToNow, format } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';

// Mock user data - in real app this would come from auth context
const mockUser = {
  id: 'user-123',
  org_id: 'org-456',
  name: 'John Doe',
  email: 'john@example.com'
};

export default function ScanResultsPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = params.scanId as string;
  const toast = useToast();

  // State for filters and pagination
  const [filters, setFilters] = useState({
    severity: [] as string[],
    status: [] as string[],
    category: '',
    search: '',
  });
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();

  // API hooks
  const { data: scan, isLoading: scanLoading } = useScan(scanId);
  const { data: resultsData, isLoading: resultsLoading, refetch: refetchResults } = useScanResults(scanId, {
    severity: filters.severity.length > 0 ? filters.severity : undefined,
    status: filters.status.length > 0 ? filters.status : undefined,
    category: filters.category || undefined,
  });

  const results = resultsData?.data || [];
  const totalResults = resultsData?.total || 0;

  // Filter results by search term
  const filteredResults = useMemo(() => {
    if (!filters.search.trim()) return results;
    
    const searchTerm = filters.search.toLowerCase();
    return results.filter(result => 
      result.title.toLowerCase().includes(searchTerm) ||
      result.description.toLowerCase().includes(searchTerm) ||
      result.finding_id.toLowerCase().includes(searchTerm) ||
      result.category.toLowerCase().includes(searchTerm)
    );
  }, [results, filters.search]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const severityCount = {
      critical: results.filter(r => r.severity === 'critical').length,
      high: results.filter(r => r.severity === 'high').length,
      medium: results.filter(r => r.severity === 'medium').length,
      low: results.filter(r => r.severity === 'low').length,
      info: results.filter(r => r.severity === 'info').length,
    };

    const statusCount = {
      open: results.filter(r => r.status === 'open').length,
      acknowledged: results.filter(r => r.status === 'acknowledged').length,
      resolved: results.filter(r => r.status === 'resolved').length,
      false_positive: results.filter(r => r.status === 'false_positive').length,
    };

    const categories = [...new Set(results.map(r => r.category))];
    const frameworks = [...new Set(results.flatMap(r => r.compliance_frameworks))];

    return {
      total: results.length,
      severityCount,
      statusCount,
      categories: categories.length,
      frameworks: frameworks.length,
      riskScore: Math.round(
        (severityCount.critical * 10 + severityCount.high * 7 + severityCount.medium * 4 + severityCount.low * 1) / 
        Math.max(results.length, 1)
      ),
    };
  }, [results]);

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => {
      const currentValues = prev[filterType as keyof typeof prev] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return { ...prev, [filterType]: newValues };
    });
  };

  const clearFilters = () => {
    setFilters({
      severity: [],
      status: [],
      category: '',
      search: '',
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'blue';
      case 'info': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'red';
      case 'acknowledged': return 'yellow';
      case 'resolved': return 'green';
      case 'false_positive': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return FiAlertTriangle;
      case 'acknowledged': return FiClock;
      case 'resolved': return FiCheckCircle;
      case 'false_positive': return FiXCircle;
      default: return FiAlertTriangle;
    }
  };

  const handleViewDetails = (result: any) => {
    setSelectedResult(result);
    onDetailOpen();
  };

  const exportResults = () => {
    const csvContent = [
      ['Finding ID', 'Title', 'Severity', 'Category', 'Status', 'Target', 'Created'],
      ...filteredResults.map(result => [
        result.finding_id,
        result.title,
        result.severity,
        result.category,
        result.status,
        result.target,
        format(new Date(result.created_at), 'yyyy-MM-dd HH:mm:ss')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-results-${scanId}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Scan results exported successfully',
      status: 'success',
      duration: 3000,
    });
  };

  if (scanLoading) {
    return (
      <Box p={6} bg="gray.50" minH="100vh">
        <Flex justify="center" align="center" h="400px">
          <Spinner size="xl" />
        </Flex>
      </Box>
    );
  }

  if (!scan) {
    return (
      <Box p={6} bg="gray.50" minH="100vh">
        <Alert status="error">
          <AlertIcon />
          <AlertDescription>Scan not found</AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={6} bg="gray.50" minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <HStack spacing={4}>
            <Button
              leftIcon={<FiArrowLeft />}
              onClick={() => router.push('/scans')}
              variant="ghost"
            >
              Back to Scans
            </Button>
            <VStack align="start" spacing={1}>
              <Heading size="lg">{scan.name} - Results</Heading>
              <HStack spacing={2}>
                <Badge colorScheme="purple">{scan.scan_type}</Badge>
                <Badge colorScheme={scan.status === 'completed' ? 'green' : 'blue'}>{scan.status}</Badge>
                <Text fontSize="sm" color="gray.600">
                  Completed {scan.completed_at ? formatDistanceToNow(new Date(scan.completed_at)) + ' ago' : 'N/A'}
                </Text>
              </HStack>
            </VStack>
          </HStack>
          
          <HStack spacing={3}>
            <Button 
              leftIcon={<FiDownload />} 
              onClick={exportResults}
              variant="outline"
              size="sm"
            >
              Export CSV
            </Button>
            <Button 
              leftIcon={<FiRefreshCw />} 
              onClick={() => refetchResults()}
              variant="outline"
              size="sm"
            >
              Refresh
            </Button>
          </HStack>
        </Flex>

        {/* Summary Statistics */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Findings</StatLabel>
                <StatNumber>{stats.total}</StatNumber>
                <StatHelpText>{stats.categories} categories</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Risk Score</StatLabel>
                <StatNumber color={stats.riskScore > 7 ? 'red.500' : stats.riskScore > 4 ? 'orange.500' : 'green.500'}>
                  {stats.riskScore}/10
                </StatNumber>
                <StatHelpText>
                  {stats.riskScore > 7 ? 'High Risk' : stats.riskScore > 4 ? 'Medium Risk' : 'Low Risk'}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Critical + High</StatLabel>
                <StatNumber color="red.500">
                  {stats.severityCount.critical + stats.severityCount.high}
                </StatNumber>
                <StatHelpText>Requires immediate attention</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Resolution Rate</StatLabel>
                <StatNumber color="green.500">
                  {stats.total > 0 ? Math.round((stats.statusCount.resolved / stats.total) * 100) : 0}%
                </StatNumber>
                <StatHelpText>{stats.statusCount.resolved} resolved</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Tabs>
          <TabList>
            <Tab>Findings Overview</Tab>
            <Tab>Severity Analysis</Tab>
            <Tab>Category Breakdown</Tab>
            <Tab>Compliance Mapping</Tab>
          </TabList>

          <TabPanels>
            {/* Findings Overview Tab */}
            <TabPanel p={0} pt={4}>
              {/* Filters */}
              <Card mb={6}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Flex gap={4} wrap="wrap" align="center">
                      <Input
                        placeholder="Search findings..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        maxW="300px"
                      />
                      
                      <Select
                        placeholder="Filter by severity"
                        maxW="200px"
                        onChange={(e) => e.target.value && handleFilterChange('severity', e.target.value)}
                      >
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                        <option value="info">Info</option>
                      </Select>
                      
                      <Select
                        placeholder="Filter by status"
                        maxW="200px"
                        onChange={(e) => e.target.value && handleFilterChange('status', e.target.value)}
                      >
                        <option value="open">Open</option>
                        <option value="acknowledged">Acknowledged</option>
                        <option value="resolved">Resolved</option>
                        <option value="false_positive">False Positive</option>
                      </Select>

                      <Input
                        placeholder="Filter by category"
                        value={filters.category}
                        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                        maxW="200px"
                      />
                      
                      <Button leftIcon={<FiFilter />} onClick={clearFilters} variant="outline">
                        Clear Filters
                      </Button>
                    </Flex>

                    {/* Active Filters Display */}
                    {(filters.severity.length > 0 || filters.status.length > 0 || filters.category) && (
                      <Box>
                        <Text fontSize="sm" color="gray.600" mb={2}>Active Filters:</Text>
                        <Flex gap={2} wrap="wrap">
                          {filters.severity.map(severity => (
                            <Badge key={severity} colorScheme={getSeverityColor(severity)} cursor="pointer" 
                                  onClick={() => handleFilterChange('severity', severity)}>
                              Severity: {severity} ×
                            </Badge>
                          ))}
                          {filters.status.map(status => (
                            <Badge key={status} colorScheme={getStatusColor(status)} cursor="pointer"
                                  onClick={() => handleFilterChange('status', status)}>
                              Status: {status} ×
                            </Badge>
                          ))}
                          {filters.category && (
                            <Badge colorScheme="blue" cursor="pointer"
                                  onClick={() => setFilters(prev => ({ ...prev, category: '' }))}>
                              Category: {filters.category} ×
                            </Badge>
                          )}
                        </Flex>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>

              {/* Results Table */}
              <Card>
                <CardBody>
                  {resultsLoading ? (
                    <Flex justify="center" align="center" h="200px">
                      <Spinner size="xl" />
                    </Flex>
                  ) : filteredResults.length === 0 ? (
                    <Box textAlign="center" py={8}>
                      <Text fontSize="lg" color="gray.500">No findings found</Text>
                      <Text color="gray.400" mt={2}>
                        {filters.search || filters.severity.length > 0 || filters.status.length > 0 || filters.category
                          ? "Try adjusting your filters"
                          : "This scan completed without any findings"
                        }
                      </Text>
                    </Box>
                  ) : (
                    <Box overflowX="auto">
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Finding</Th>
                            <Th>Severity</Th>
                            <Th>Category</Th>
                            <Th>Status</Th>
                            <Th>Target</Th>
                            <Th>Created</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {filteredResults.map((result) => {
                            const StatusIcon = getStatusIcon(result.status);
                            return (
                              <Tr key={result.id} _hover={{ bg: 'gray.50' }}>
                                <Td>
                                  <VStack align="start" spacing={1}>
                                    <Text fontWeight="medium">{result.title}</Text>
                                    <HStack spacing={2}>
                                      <Code fontSize="xs">{result.finding_id}</Code>
                                      {result.compliance_frameworks.length > 0 && (
                                        <Badge size="sm" colorScheme="blue">
                                          {result.compliance_frameworks[0]}
                                        </Badge>
                                      )}
                                    </HStack>
                                  </VStack>
                                </Td>
                                <Td>
                                  <Badge colorScheme={getSeverityColor(result.severity)} textTransform="capitalize">
                                    {result.severity}
                                  </Badge>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">{result.category}</Text>
                                </Td>
                                <Td>
                                  <HStack spacing={2}>
                                    <StatusIcon size={16} color={`var(--chakra-colors-${getStatusColor(result.status)}-500)`} />
                                    <Badge colorScheme={getStatusColor(result.status)} textTransform="capitalize">
                                      {result.status.replace('_', ' ')}
                                    </Badge>
                                  </HStack>
                                </Td>
                                <Td>
                                  <Text fontSize="sm" color="gray.600" maxW="200px" noOfLines={1}>
                                    {result.target}
                                  </Text>
                                </Td>
                                <Td>
                                  <Text fontSize="sm" color="gray.600">
                                    {formatDistanceToNow(new Date(result.created_at))} ago
                                  </Text>
                                </Td>
                                <Td>
                                  <Tooltip label="View Details">
                                    <IconButton
                                      aria-label="View Details"
                                      icon={<FiEye />}
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleViewDetails(result)}
                                    />
                                  </Tooltip>
                                </Td>
                              </Tr>
                            );
                          })}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </CardBody>
              </Card>
            </TabPanel>

            {/* Severity Analysis Tab */}
            <TabPanel p={0} pt={4}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                <Card>
                  <CardHeader>
                    <Heading size="md">Severity Distribution</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {Object.entries(stats.severityCount).map(([severity, count]) => (
                        <Box key={severity}>
                          <Flex justify="space-between" mb={2}>
                            <HStack>
                              <Badge colorScheme={getSeverityColor(severity)} textTransform="capitalize">
                                {severity}
                              </Badge>
                              <Text fontSize="sm">{count} findings</Text>
                            </HStack>
                            <Text fontSize="sm" color="gray.600">
                              {stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%
                            </Text>
                          </Flex>
                          <Progress 
                            value={stats.total > 0 ? (count / stats.total) * 100 : 0} 
                            colorScheme={getSeverityColor(severity)} 
                            size="sm" 
                          />
                        </Box>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <Heading size="md">Status Distribution</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {Object.entries(stats.statusCount).map(([status, count]) => (
                        <Box key={status}>
                          <Flex justify="space-between" mb={2}>
                            <HStack>
                              <Badge colorScheme={getStatusColor(status)} textTransform="capitalize">
                                {status.replace('_', ' ')}
                              </Badge>
                              <Text fontSize="sm">{count} findings</Text>
                            </HStack>
                            <Text fontSize="sm" color="gray.600">
                              {stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%
                            </Text>
                          </Flex>
                          <Progress 
                            value={stats.total > 0 ? (count / stats.total) * 100 : 0} 
                            colorScheme={getStatusColor(status)} 
                            size="sm" 
                          />
                        </Box>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </TabPanel>

            {/* Category Breakdown Tab */}
            <TabPanel p={0} pt={4}>
              <Card>
                <CardHeader>
                  <Heading size="md">Findings by Category</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    {[...new Set(results.map(r => r.category))].map(category => {
                      const categoryResults = results.filter(r => r.category === category);
                      const criticalCount = categoryResults.filter(r => r.severity === 'critical').length;
                      const highCount = categoryResults.filter(r => r.severity === 'high').length;
                      
                      return (
                        <Card key={category} variant="outline">
                          <CardBody>
                            <Flex justify="space-between" align="center" mb={3}>
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium">{category}</Text>
                                <Text fontSize="sm" color="gray.600">
                                  {categoryResults.length} findings
                                </Text>
                              </VStack>
                              <HStack spacing={2}>
                                {criticalCount > 0 && (
                                  <Badge colorScheme="red">{criticalCount} critical</Badge>
                                )}
                                {highCount > 0 && (
                                  <Badge colorScheme="orange">{highCount} high</Badge>
                                )}
                              </HStack>
                            </Flex>
                            
                            <Progress 
                              value={(categoryResults.length / stats.total) * 100} 
                              colorScheme="blue" 
                              size="sm" 
                            />
                          </CardBody>
                        </Card>
                      );
                    })}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Compliance Mapping Tab */}
            <TabPanel p={0} pt={4}>
              <Card>
                <CardHeader>
                  <Heading size="md">Compliance Framework Mapping</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    {[...new Set(results.flatMap(r => r.compliance_frameworks))].map(framework => {
                      const frameworkResults = results.filter(r => r.compliance_frameworks.includes(framework));
                      const openCount = frameworkResults.filter(r => r.status === 'open').length;
                      
                      return (
                        <Card key={framework} variant="outline">
                          <CardBody>
                            <Flex justify="space-between" align="center" mb={3}>
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium">{framework}</Text>
                                <Text fontSize="sm" color="gray.600">
                                  {frameworkResults.length} related findings
                                </Text>
                              </VStack>
                              <HStack spacing={2}>
                                <Badge colorScheme={openCount > 0 ? 'red' : 'green'}>
                                  {openCount} open
                                </Badge>
                                <Badge colorScheme="blue">
                                  {Math.round(((frameworkResults.length - openCount) / frameworkResults.length) * 100)}% compliant
                                </Badge>
                              </HStack>
                            </Flex>
                            
                            <Progress 
                              value={((frameworkResults.length - openCount) / frameworkResults.length) * 100} 
                              colorScheme={openCount > 0 ? 'red' : 'green'} 
                              size="sm" 
                            />
                          </CardBody>
                        </Card>
                      );
                    })}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Finding Detail Modal */}
        <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <VStack align="start" spacing={1}>
                <Text>{selectedResult?.title}</Text>
                <HStack spacing={2}>
                  <Code fontSize="sm">{selectedResult?.finding_id}</Code>
                  <Badge colorScheme={getSeverityColor(selectedResult?.severity)}>
                    {selectedResult?.severity}
                  </Badge>
                  <Badge colorScheme={getStatusColor(selectedResult?.status)}>
                    {selectedResult?.status?.replace('_', ' ')}
                  </Badge>
                </HStack>
              </VStack>
            </ModalHeader>
            <ModalCloseButton />
            
            <ModalBody>
              {selectedResult && (
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontWeight="medium" mb={2}>Description</Text>
                    <Text fontSize="sm" color="gray.700">{selectedResult.description}</Text>
                  </Box>

                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text fontWeight="medium" mb={1}>Category</Text>
                      <Text fontSize="sm">{selectedResult.category}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="medium" mb={1}>Target</Text>
                      <Text fontSize="sm" wordBreak="break-all">{selectedResult.target}</Text>
                    </Box>
                  </SimpleGrid>

                  {selectedResult.evidence && (
                    <Box>
                      <Text fontWeight="medium" mb={2}>Evidence</Text>
                      <Code fontSize="xs" p={3} display="block" whiteSpace="pre-wrap">
                        {JSON.stringify(selectedResult.evidence, null, 2)}
                      </Code>
                    </Box>
                  )}

                  {selectedResult.remediation && (
                    <Box>
                      <Text fontWeight="medium" mb={2}>Remediation</Text>
                      <Text fontSize="sm" color="gray.700">{selectedResult.remediation}</Text>
                    </Box>
                  )}

                  {selectedResult.references?.length > 0 && (
                    <Box>
                      <Text fontWeight="medium" mb={2}>References</Text>
                      <VStack spacing={1} align="stretch">
                        {selectedResult.references.map((ref: string, index: number) => (
                          <Link key={index} href={ref} isExternal color="blue.500" fontSize="sm">
                            {ref} <FiExternalLink style={{ display: 'inline', marginLeft: '4px' }} />
                          </Link>
                        ))}
                      </VStack>
                    </Box>
                  )}

                  {selectedResult.compliance_frameworks?.length > 0 && (
                    <Box>
                      <Text fontWeight="medium" mb={2}>Compliance Frameworks</Text>
                      <HStack spacing={2} wrap="wrap">
                        {selectedResult.compliance_frameworks.map((framework: string) => (
                          <Badge key={framework} colorScheme="blue">{framework}</Badge>
                        ))}
                      </HStack>
                    </Box>
                  )}
                </VStack>
              )}
            </ModalBody>

            <ModalFooter>
              <Button onClick={onDetailClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
} 