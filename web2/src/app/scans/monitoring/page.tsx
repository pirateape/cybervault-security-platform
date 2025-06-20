'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Progress,
  Badge,
  Button,
  SimpleGrid,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Table,
  Tbody,
  Tr,
  Td,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Tooltip,
  IconButton,
  Switch,
} from '@chakra-ui/react';
import {
  FiActivity,
  FiCpu,
  FiHardDrive,
  FiWifi,
  FiClock,
  FiPause,
  FiPlay,
  FiStop,
  FiRefreshCw,
  FiCheckCircle,
  FiMonitor,
  FiServer,
  FiDatabase,
} from 'react-icons/fi';
import { 
  useRunningScanProgress, 
  useUpdateScanStatus,
} from '@data-access/scanApi';
import { formatDistanceToNow, format } from 'date-fns';

// Mock user data - in real app this would come from auth context
const mockUser = {
  id: 'user-123',
  org_id: 'org-456',
  name: 'John Doe',
  email: 'john@example.com'
};

export default function ScanMonitoringDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const toast = useToast();

  // API hooks
  const { data: runningScans, refetch: refetchRunning } = useRunningScanProgress(mockUser.org_id);
  const updateScanStatus = useUpdateScanStatus();

  // Mock data for system health and resource utilization
  const [resourceMetrics, setResourceMetrics] = useState({
    cpu: { current: 45, average: 38, peak: 78 },
    memory: { current: 6.2, available: 9.8, total: 16 },
    disk: { used: 120, available: 380, total: 500 },
    network: { inbound: 2.4, outbound: 1.8 }
  });

  const [systemHealth] = useState({
    status: 'healthy' as const,
    services: [
      { name: 'Scan Engine', status: 'online' as const, uptime: 99.8, lastCheck: new Date() },
      { name: 'Queue Manager', status: 'online' as const, uptime: 99.9, lastCheck: new Date() },
      { name: 'Result Processor', status: 'degraded' as const, uptime: 97.2, lastCheck: new Date() },
      { name: 'Notification Service', status: 'online' as const, uptime: 99.5, lastCheck: new Date() },
    ],
    alerts: [
      {
        id: '1',
        level: 'warning' as const,
        message: 'Result Processor experiencing high latency',
        timestamp: new Date(Date.now() - 300000)
      },
      {
        id: '2',
        level: 'info' as const,
        message: 'Scheduled maintenance window in 2 hours',
        timestamp: new Date(Date.now() - 600000)
      }
    ]
  });

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchRunning();
      
      // Simulate resource metrics updates
      setResourceMetrics(prev => ({
        cpu: {
          ...prev.cpu,
          current: Math.max(10, Math.min(90, prev.cpu.current + (Math.random() - 0.5) * 10))
        },
        memory: {
          ...prev.memory,
          current: Math.max(2, Math.min(14, prev.memory.current + (Math.random() - 0.5) * 0.5))
        },
        disk: {
          ...prev.disk,
          used: Math.max(100, Math.min(200, prev.disk.used + (Math.random() - 0.5) * 5))
        },
        network: {
          inbound: Math.max(0, prev.network.inbound + (Math.random() - 0.5) * 1),
          outbound: Math.max(0, prev.network.outbound + (Math.random() - 0.5) * 0.8)
        }
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, refetchRunning]);

  const handleScanAction = async (scanId: string, action: 'pause' | 'resume' | 'stop') => {
    try {
      await updateScanStatus.mutateAsync({ 
        scanId, 
        status: action === 'pause' ? 'paused' : action === 'resume' ? 'running' : 'cancelled'
      });
      
      toast({
        title: 'Action Completed',
        description: `Scan ${action} request sent successfully`,
        status: 'success',
        duration: 3000,
      });
      
      refetchRunning();
    } catch (error) {
      toast({
        title: 'Action Failed',
        description: `Failed to ${action} scan`,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'green';
      case 'paused': return 'yellow';
      case 'completed': return 'blue';
      case 'failed': return 'red';
      case 'cancelled': return 'gray';
      default: return 'gray';
    }
  };

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'green';
      case 'degraded': return 'yellow';
      case 'offline': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box p={6} bg="gray.50" minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Heading size="lg">Scan Monitoring Dashboard</Heading>
          <HStack spacing={3}>
            <HStack>
              <Text fontSize="sm">Auto-refresh:</Text>
              <Switch 
                isChecked={autoRefresh} 
                onChange={(e) => setAutoRefresh(e.target.checked)}
                colorScheme="blue"
              />
            </HStack>
            <Button 
              leftIcon={<FiRefreshCw />} 
              onClick={() => refetchRunning()}
              variant="outline"
              size="sm"
            >
              Refresh Now
            </Button>
          </HStack>
        </Flex>

        {/* System Health Overview */}
        <Card>
          <CardHeader>
            <Flex align="center" gap={2}>
              <FiMonitor />
              <Heading size="md">System Health</Heading>
              <Badge 
                colorScheme={systemHealth.status === 'healthy' ? 'green' : systemHealth.status === 'warning' ? 'yellow' : 'red'}
                ml={2}
              >
                {systemHealth.status.toUpperCase()}
              </Badge>
            </Flex>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
              {systemHealth.services.map((service) => (
                <Card key={service.name} size="sm">
                  <CardBody>
                    <VStack spacing={2} align="stretch">
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="medium" fontSize="sm">{service.name}</Text>
                        <Badge colorScheme={getServiceStatusColor(service.status)} size="sm">
                          {service.status}
                        </Badge>
                      </Flex>
                      <Text fontSize="xs" color="gray.600">
                        Uptime: {service.uptime}%
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Last check: {format(service.lastCheck, 'HH:mm:ss')}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>

            {/* System Alerts */}
            {systemHealth.alerts.length > 0 && (
              <Box mt={4}>
                <Text fontWeight="medium" mb={2}>Recent Alerts</Text>
                <VStack spacing={2} align="stretch">
                  {systemHealth.alerts.slice(0, 3).map((alert) => (
                    <Alert key={alert.id} status={alert.level === 'error' ? 'error' : alert.level === 'warning' ? 'warning' : 'info'} size="sm">
                      <AlertIcon />
                      <Box flex="1">
                        <AlertDescription fontSize="sm">
                          {alert.message}
                        </AlertDescription>
                      </Box>
                      <Text fontSize="xs" color="gray.500">
                        {formatDistanceToNow(alert.timestamp)} ago
                      </Text>
                    </Alert>
                  ))}
                </VStack>
              </Box>
            )}
          </CardBody>
        </Card>

        {/* Resource Utilization */}
        <Card>
          <CardHeader>
            <Flex align="center" gap={2}>
              <FiServer />
              <Heading size="md">Resource Utilization</Heading>
            </Flex>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              {/* CPU Usage */}
              <Box>
                <Flex align="center" gap={2} mb={2}>
                  <FiCpu />
                  <Text fontWeight="medium">CPU Usage</Text>
                </Flex>
                <Progress 
                  value={resourceMetrics.cpu.current} 
                  colorScheme={resourceMetrics.cpu.current > 80 ? 'red' : resourceMetrics.cpu.current > 60 ? 'yellow' : 'green'}
                  mb={2}
                />
                <VStack spacing={1} align="stretch" fontSize="sm">
                  <Flex justify="space-between">
                    <Text color="gray.600">Current:</Text>
                    <Text fontWeight="medium">{resourceMetrics.cpu.current.toFixed(1)}%</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text color="gray.600">Average:</Text>
                    <Text>{resourceMetrics.cpu.average}%</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text color="gray.600">Peak:</Text>
                    <Text>{resourceMetrics.cpu.peak}%</Text>
                  </Flex>
                </VStack>
              </Box>

              {/* Memory Usage */}
              <Box>
                <Flex align="center" gap={2} mb={2}>
                  <FiHardDrive />
                  <Text fontWeight="medium">Memory Usage</Text>
                </Flex>
                <Progress 
                  value={(resourceMetrics.memory.current / resourceMetrics.memory.total) * 100} 
                  colorScheme={(resourceMetrics.memory.current / resourceMetrics.memory.total) > 0.8 ? 'red' : (resourceMetrics.memory.current / resourceMetrics.memory.total) > 0.6 ? 'yellow' : 'green'}
                  mb={2}
                />
                <VStack spacing={1} align="stretch" fontSize="sm">
                  <Flex justify="space-between">
                    <Text color="gray.600">Used:</Text>
                    <Text fontWeight="medium">{resourceMetrics.memory.current.toFixed(1)} GB</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text color="gray.600">Available:</Text>
                    <Text>{resourceMetrics.memory.available.toFixed(1)} GB</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text color="gray.600">Total:</Text>
                    <Text>{resourceMetrics.memory.total} GB</Text>
                  </Flex>
                </VStack>
              </Box>

              {/* Disk Usage */}
              <Box>
                <Flex align="center" gap={2} mb={2}>
                  <FiDatabase />
                  <Text fontWeight="medium">Disk Usage</Text>
                </Flex>
                <Progress 
                  value={(resourceMetrics.disk.used / resourceMetrics.disk.total) * 100} 
                  colorScheme={(resourceMetrics.disk.used / resourceMetrics.disk.total) > 0.8 ? 'red' : (resourceMetrics.disk.used / resourceMetrics.disk.total) > 0.6 ? 'yellow' : 'green'}
                  mb={2}
                />
                <VStack spacing={1} align="stretch" fontSize="sm">
                  <Flex justify="space-between">
                    <Text color="gray.600">Used:</Text>
                    <Text fontWeight="medium">{resourceMetrics.disk.used} GB</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text color="gray.600">Available:</Text>
                    <Text>{resourceMetrics.disk.available} GB</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text color="gray.600">Total:</Text>
                    <Text>{resourceMetrics.disk.total} GB</Text>
                  </Flex>
                </VStack>
              </Box>

              {/* Network Usage */}
              <Box>
                <Flex align="center" gap={2} mb={2}>
                  <FiWifi />
                  <Text fontWeight="medium">Network Usage</Text>
                </Flex>
                <VStack spacing={3} align="stretch" fontSize="sm">
                  <Box>
                    <Flex justify="space-between" mb={1}>
                      <Text color="gray.600">Inbound:</Text>
                      <Text fontWeight="medium">{resourceMetrics.network.inbound.toFixed(1)} MB/s</Text>
                    </Flex>
                    <Progress value={Math.min(100, (resourceMetrics.network.inbound / 10) * 100)} colorScheme="blue" size="sm" />
                  </Box>
                  <Box>
                    <Flex justify="space-between" mb={1}>
                      <Text color="gray.600">Outbound:</Text>
                      <Text fontWeight="medium">{resourceMetrics.network.outbound.toFixed(1)} MB/s</Text>
                    </Flex>
                    <Progress value={Math.min(100, (resourceMetrics.network.outbound / 10) * 100)} colorScheme="green" size="sm" />
                  </Box>
                </VStack>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>

        <Tabs>
          <TabList>
            <Tab>Active Scans</Tab>
            <Tab>Performance Metrics</Tab>
          </TabList>

          <TabPanels>
            {/* Active Scans Tab */}
            <TabPanel p={0} pt={4}>
              <Card>
                <CardHeader>
                  <Flex align="center" gap={2}>
                    <FiActivity />
                    <Heading size="md">Active Scans</Heading>
                    <Badge colorScheme="blue" ml={2}>
                      {runningScans?.length || 0} running
                    </Badge>
                  </Flex>
                </CardHeader>
                <CardBody>
                  {!runningScans || runningScans.length === 0 ? (
                    <Box textAlign="center" py={8}>
                      <FiCheckCircle size={48} style={{ margin: '0 auto 16px', color: '#68D391' }} />
                      <Text fontSize="lg" color="gray.500">No active scans</Text>
                      <Text color="gray.400" mt={2}>All scans are completed or in queue</Text>
                    </Box>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {runningScans.map((scan) => (
                        <Card key={scan.id} variant="outline">
                          <CardBody>
                            <VStack spacing={4} align="stretch">
                              <Flex justify="space-between" align="center">
                                <VStack align="start" spacing={1}>
                                  <Text fontWeight="medium" fontSize="lg">{scan.name}</Text>
                                  <HStack spacing={2}>
                                    <Badge colorScheme="purple">{scan.scan_type}</Badge>
                                    <Badge colorScheme={getStatusColor(scan.status)}>{scan.status}</Badge>
                                    <Badge colorScheme="orange">{scan.priority}</Badge>
                                  </HStack>
                                </VStack>
                                
                                <HStack spacing={2}>
                                  {scan.status === 'running' && (
                                    <Tooltip label="Pause Scan">
                                      <IconButton
                                        aria-label="Pause"
                                        icon={<FiPause />}
                                        size="sm"
                                        colorScheme="yellow"
                                        variant="outline"
                                        onClick={() => handleScanAction(scan.id, 'pause')}
                                      />
                                    </Tooltip>
                                  )}
                                  {scan.status === 'paused' && (
                                    <Tooltip label="Resume Scan">
                                      <IconButton
                                        aria-label="Resume"
                                        icon={<FiPlay />}
                                        size="sm"
                                        colorScheme="green"
                                        variant="outline"
                                        onClick={() => handleScanAction(scan.id, 'resume')}
                                      />
                                    </Tooltip>
                                  )}
                                  <Tooltip label="Stop Scan">
                                    <IconButton
                                      aria-label="Stop"
                                      icon={<FiStop />}
                                      size="sm"
                                      colorScheme="red"
                                      variant="outline"
                                      onClick={() => handleScanAction(scan.id, 'stop')}
                                    />
                                  </Tooltip>
                                </HStack>
                              </Flex>

                              <Box>
                                <Flex justify="space-between" mb={2}>
                                  <Text fontSize="sm" color="gray.600">Progress</Text>
                                  <Text fontSize="sm" fontWeight="medium">{scan.progress}% complete</Text>
                                </Flex>
                                <Progress value={scan.progress} colorScheme="blue" size="lg" />
                              </Box>

                              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                                <Stat size="sm">
                                  <StatLabel>Started</StatLabel>
                                  <StatNumber fontSize="md">
                                    {scan.started_at ? formatDistanceToNow(new Date(scan.started_at)) + ' ago' : 'N/A'}
                                  </StatNumber>
                                </Stat>
                                
                                <Stat size="sm">
                                  <StatLabel>ETA</StatLabel>
                                  <StatNumber fontSize="md">
                                    {scan.estimated_completion ? format(scan.estimated_completion, 'HH:mm') : 'Calculating...'}
                                  </StatNumber>
                                </Stat>
                                
                                <Stat size="sm">
                                  <StatLabel>Targets</StatLabel>
                                  <StatNumber fontSize="md">{scan.targets_count || 1}</StatNumber>
                                </Stat>
                                
                                <Stat size="sm">
                                  <StatLabel>Findings</StatLabel>
                                  <StatNumber fontSize="md">{scan.findings_count || 0}</StatNumber>
                                  {scan.critical_findings > 0 && (
                                    <StatHelpText color="red.500">
                                      {scan.critical_findings} critical
                                    </StatHelpText>
                                  )}
                                </Stat>
                              </SimpleGrid>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  )}
                </CardBody>
              </Card>
            </TabPanel>

            {/* Performance Metrics Tab */}
            <TabPanel p={0} pt={4}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                <Card>
                  <CardHeader>
                    <Heading size="md">Scan Performance</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Stat>
                        <StatLabel>Average Scan Duration</StatLabel>
                        <StatNumber>24 minutes</StatNumber>
                        <StatHelpText>
                          <StatArrow type="decrease" />
                          12% faster than last week
                        </StatHelpText>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>Success Rate</StatLabel>
                        <StatNumber>98.5%</StatNumber>
                        <StatHelpText>
                          <StatArrow type="increase" />
                          2.1% improvement
                        </StatHelpText>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>Queue Wait Time</StatLabel>
                        <StatNumber>3.2 minutes</StatNumber>
                        <StatHelpText>
                          <StatArrow type="decrease" />
                          15% reduction
                        </StatHelpText>
                      </Stat>
                    </VStack>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <Heading size="md">System Performance</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Stat>
                        <StatLabel>Throughput</StatLabel>
                        <StatNumber>156 scans/hour</StatNumber>
                        <StatHelpText>
                          <StatArrow type="increase" />
                          8% increase
                        </StatHelpText>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>Resource Efficiency</StatLabel>
                        <StatNumber>87%</StatNumber>
                        <StatHelpText>
                          <StatArrow type="increase" />
                          5% improvement
                        </StatHelpText>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>Error Rate</StatLabel>
                        <StatNumber>0.8%</StatNumber>
                        <StatHelpText>
                          <StatArrow type="decrease" />
                          0.3% reduction
                        </StatHelpText>
                      </Stat>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
} 