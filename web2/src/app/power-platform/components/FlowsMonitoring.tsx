'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Badge,
  Card,
  SimpleGrid,
  HStack,
  VStack,
  Spinner,
  IconButton,
  Tooltip,
  Progress,
  Alert,
} from '@chakra-ui/react';
import {
  FiPlay,
  FiPause,
  FiZap,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiRefreshCw,
  FiSettings,
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { usePowerFlows } from '../../../../libs/data-access/powerPlatformApi';

interface FlowsMonitoringProps {
  orgId: string;
}

export function FlowsMonitoring({ orgId }: FlowsMonitoringProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'lastRun' | 'runCount'>('lastRun');

  const { data: flowsData, isLoading, error, refetch } = usePowerFlows(orgId);

  // Filter and sort flows
  const filteredFlows = useMemo(() => {
    if (!flowsData?.data) return [];

    let filtered = flowsData.data;

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(flow => {
        if (filterStatus === 'enabled') return flow.state === 'Started';
        if (filterStatus === 'disabled') return flow.state === 'Stopped';
        if (filterStatus === 'suspended') return flow.state === 'Suspended';
        return true;
      });
    }

    // Sort flows
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.displayName.localeCompare(b.displayName);
        case 'lastRun':
          const aLastRun = a.lastRunTime ? new Date(a.lastRunTime).getTime() : 0;
          const bLastRun = b.lastRunTime ? new Date(b.lastRunTime).getTime() : 0;
          return bLastRun - aLastRun;
        case 'runCount':
          return (b.runCount || 0) - (a.runCount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [flowsData?.data, filterStatus, sortBy]);

  // Calculate flow statistics
  const flowStats = useMemo(() => {
    if (!flowsData?.data) return { 
      total: 0, 
      enabled: 0, 
      disabled: 0, 
      suspended: 0,
      successRate: 0,
      totalRuns: 0
    };

    const total = flowsData.data.length;
    const enabled = flowsData.data.filter(flow => flow.state === 'Started').length;
    const disabled = flowsData.data.filter(flow => flow.state === 'Stopped').length;
    const suspended = flowsData.data.filter(flow => flow.state === 'Suspended').length;
    
    const totalRuns = flowsData.data.reduce((sum, flow) => sum + (flow.runCount || 0), 0);
    const successfulRuns = flowsData.data.reduce((sum, flow) => sum + (flow.successfulRuns || 0), 0);
    const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;

    return { total, enabled, disabled, suspended, successRate, totalRuns };
  }, [flowsData?.data]);

  const getFlowStatusColor = (state: string) => {
    switch (state) {
      case 'Started':
        return 'green';
      case 'Stopped':
        return 'gray';
      case 'Suspended':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getFlowStatusIcon = (state: string) => {
    switch (state) {
      case 'Started':
        return <FiPlay />;
      case 'Stopped':
        return <FiPause />;
      case 'Suspended':
        return <FiAlertTriangle />;
      default:
        return <FiClock />;
    }
  };

  const getRunStatusIcon = (status: string) => {
    switch (status) {
      case 'Succeeded':
        return <FiCheckCircle color="green" />;
      case 'Failed':
        return <FiXCircle color="red" />;
      case 'Running':
        return <Spinner size="sm" />;
      default:
        return <FiClock color="gray" />;
    }
  };

  if (error) {
    return (
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Error Loading Flows</Alert.Title>
          <Alert.Description>Failed to load Power Automate flows data. Please try again.</Alert.Description>
        </Alert.Content>
      </Alert.Root>
    );
  }

  return (
    <Box>
      <VStack gap={6} align="stretch">
        {/* Statistics Cards */}
        <SimpleGrid columns={{ base: 2, md: 6 }} gap={4}>
          <Card.Root>
            <Card.Body>
              <VStack gap={2}>
                <Text fontSize="sm" color="gray.600">Total Flows</Text>
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  {isLoading ? <Spinner size="sm" /> : flowStats.total}
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <VStack gap={2}>
                <Text fontSize="sm" color="gray.600">Enabled</Text>
                <Text fontSize="2xl" fontWeight="bold" color="green.600">
                  {isLoading ? <Spinner size="sm" /> : flowStats.enabled}
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <VStack gap={2}>
                <Text fontSize="sm" color="gray.600">Disabled</Text>
                <Text fontSize="2xl" fontWeight="bold" color="gray.600">
                  {isLoading ? <Spinner size="sm" /> : flowStats.disabled}
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <VStack gap={2}>
                <Text fontSize="sm" color="gray.600">Suspended</Text>
                <Text fontSize="2xl" fontWeight="bold" color="red.600">
                  {isLoading ? <Spinner size="sm" /> : flowStats.suspended}
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <VStack gap={2}>
                <Text fontSize="sm" color="gray.600">Success Rate</Text>
                <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                  {isLoading ? <Spinner size="sm" /> : `${flowStats.successRate.toFixed(1)}%`}
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <VStack gap={2}>
                <Text fontSize="sm" color="gray.600">Total Runs</Text>
                <Text fontSize="2xl" fontWeight="bold" color="teal.600">
                  {isLoading ? <Spinner size="sm" /> : flowStats.totalRuns.toLocaleString()}
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        {/* Filters and Controls */}
        <Card.Root>
          <Card.Body>
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <HStack gap={4}>
                <Text fontWeight="medium">Filter:</Text>
                <Button
                  size="sm"
                  variant={filterStatus === 'all' ? 'solid' : 'outline'}
                  onClick={() => setFilterStatus('all')}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === 'enabled' ? 'solid' : 'outline'}
                  colorScheme="green"
                  onClick={() => setFilterStatus('enabled')}
                >
                  Enabled
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === 'disabled' ? 'solid' : 'outline'}
                  colorScheme="gray"
                  onClick={() => setFilterStatus('disabled')}
                >
                  Disabled
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === 'suspended' ? 'solid' : 'outline'}
                  colorScheme="red"
                  onClick={() => setFilterStatus('suspended')}
                >
                  Suspended
                </Button>
              </HStack>

              <HStack gap={4}>
                <Text fontWeight="medium">Sort by:</Text>
                <Button
                  size="sm"
                  variant={sortBy === 'name' ? 'solid' : 'outline'}
                  onClick={() => setSortBy('name')}
                >
                  Name
                </Button>
                <Button
                  size="sm"
                  variant={sortBy === 'lastRun' ? 'solid' : 'outline'}
                  onClick={() => setSortBy('lastRun')}
                >
                  Last Run
                </Button>
                <Button
                  size="sm"
                  variant={sortBy === 'runCount' ? 'solid' : 'outline'}
                  onClick={() => setSortBy('runCount')}
                >
                  Run Count
                </Button>
              </HStack>
            </Flex>
          </Card.Body>
        </Card.Root>

        {/* Flows Grid */}
        {isLoading ? (
          <Flex justify="center" py={8}>
            <Spinner size="lg" />
          </Flex>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
            {filteredFlows.map((flow) => (
              <Card.Root key={flow.id} variant="outline">
                <Card.Body>
                  <VStack gap={3} align="stretch">
                    {/* Flow Header */}
                    <Flex justify="space-between" align="start">
                      <HStack gap={2}>
                        {getFlowStatusIcon(flow.state)}
                        <VStack gap={0} align="start" flex={1}>
                          <Text fontWeight="bold" fontSize="md" noOfLines={1}>
                            {flow.displayName}
                          </Text>
                          <Text fontSize="sm" color="gray.600" noOfLines={1}>
                            {flow.environment.name}
                          </Text>
                        </VStack>
                      </HStack>
                      <Badge colorScheme={getFlowStatusColor(flow.state)}>
                        {flow.state}
                      </Badge>
                    </Flex>

                    {/* Flow Description */}
                    {flow.description && (
                      <Text fontSize="sm" color="gray.700" noOfLines={2}>
                        {flow.description}
                      </Text>
                    )}

                    {/* Flow Metadata */}
                    <VStack gap={2} align="stretch">
                      <Flex justify="space-between" fontSize="sm">
                        <Text color="gray.600">Type:</Text>
                        <Badge variant="outline">{flow.triggerType}</Badge>
                      </Flex>
                      
                      <Flex justify="space-between" fontSize="sm">
                        <Text color="gray.600">Owner:</Text>
                        <Text>{flow.owner.displayName}</Text>
                      </Flex>
                      
                      <Flex justify="space-between" fontSize="sm">
                        <Text color="gray.600">Total Runs:</Text>
                        <Text>{flow.runCount || 0}</Text>
                      </Flex>
                      
                      <Flex justify="space-between" fontSize="sm">
                        <Text color="gray.600">Success Rate:</Text>
                        <HStack gap={1}>
                          {flow.successRate >= 80 ? <FiTrendingUp color="green" /> : <FiTrendingDown color="red" />}
                          <Text>{flow.successRate ? `${flow.successRate.toFixed(1)}%` : 'N/A'}</Text>
                        </HStack>
                      </Flex>
                      
                      {flow.lastRunTime && (
                        <Flex justify="space-between" fontSize="sm">
                          <Text color="gray.600">Last Run:</Text>
                          <HStack gap={1}>
                            {getRunStatusIcon(flow.lastRunStatus)}
                            <Text>{formatDistanceToNow(new Date(flow.lastRunTime), { addSuffix: true })}</Text>
                          </HStack>
                        </Flex>
                      )}
                    </VStack>

                    {/* Actions */}
                    <HStack gap={2} pt={2}>
                      <Tooltip label="View Flow Details">
                        <IconButton
                          aria-label="View flow details"
                          icon={<FiSettings />}
                          size="sm"
                          variant="outline"
                        />
                      </Tooltip>
                      <Tooltip label="Run History">
                        <IconButton
                          aria-label="View run history"
                          icon={<FiClock />}
                          size="sm"
                          variant="outline"
                          colorScheme="blue"
                        />
                      </Tooltip>
                      <Tooltip label="Trigger Flow">
                        <IconButton
                          aria-label="Trigger flow"
                          icon={<FiZap />}
                          size="sm"
                          variant="outline"
                          colorScheme="orange"
                          isDisabled={flow.state !== 'Started'}
                        />
                      </Tooltip>
                    </HStack>
                  </VStack>
                </Card.Body>
              </Card.Root>
            ))}
          </SimpleGrid>
        )}

        {/* Empty State */}
        {!isLoading && filteredFlows.length === 0 && (
          <Card.Root>
            <Card.Body>
              <VStack gap={4} py={8}>
                <FiZap size={48} color="gray.400" />
                <VStack gap={2}>
                  <Text fontSize="lg" fontWeight="medium" color="gray.600">
                    No Power Automate Flows Found
                  </Text>
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    {filterStatus !== 'all' 
                      ? 'Try adjusting your filters'
                      : 'No flows are available in this organization'
                    }
                  </Text>
                </VStack>
                <Button
                  leftIcon={<FiRefreshCw />}
                  onClick={() => refetch()}
                  variant="outline"
                >
                  Refresh Data
                </Button>
              </VStack>
            </Card.Body>
          </Card.Root>
        )}
      </VStack>
    </Box>
  );
}

export default FlowsMonitoring; 