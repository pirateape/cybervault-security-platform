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
  Alert,
} from '@chakra-ui/react';
import {
  FiGlobe,
  FiShield,
  FiDatabase,
  FiUsers,
  FiSettings,
  FiRefreshCw,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { usePowerEnvironments } from '../../../../libs/data-access/powerPlatformApi';

interface EnvironmentManagementProps {
  orgId: string;
}

export function EnvironmentManagement({ orgId }: EnvironmentManagementProps) {
  const [filterType, setFilterType] = useState<string>('all');

  const { data: environmentsData, isLoading, error, refetch } = usePowerEnvironments(orgId);

  // Filter environments
  const filteredEnvironments = useMemo(() => {
    if (!environmentsData?.data) return [];

    let filtered = environmentsData.data;

    if (filterType !== 'all') {
      filtered = filtered.filter(env => {
        if (filterType === 'production') return env.type === 'Production';
        if (filterType === 'sandbox') return env.type === 'Sandbox';
        if (filterType === 'trial') return env.type === 'Trial';
        if (filterType === 'developer') return env.type === 'Developer';
        return true;
      });
    }

    return filtered.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [environmentsData?.data, filterType]);

  // Calculate environment statistics
  const envStats = useMemo(() => {
    if (!environmentsData?.data) return { 
      total: 0, 
      production: 0, 
      sandbox: 0, 
      trial: 0,
      developer: 0,
      healthy: 0
    };

    const total = environmentsData.data.length;
    const production = environmentsData.data.filter(env => env.type === 'Production').length;
    const sandbox = environmentsData.data.filter(env => env.type === 'Sandbox').length;
    const trial = environmentsData.data.filter(env => env.type === 'Trial').length;
    const developer = environmentsData.data.filter(env => env.type === 'Developer').length;
    const healthy = environmentsData.data.filter(env => env.state === 'Ready').length;

    return { total, production, sandbox, trial, developer, healthy };
  }, [environmentsData?.data]);

  const getEnvironmentTypeColor = (type: string) => {
    switch (type) {
      case 'Production':
        return 'red';
      case 'Sandbox':
        return 'blue';
      case 'Trial':
        return 'orange';
      case 'Developer':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getEnvironmentStateColor = (state: string) => {
    switch (state) {
      case 'Ready':
        return 'green';
      case 'NotReady':
        return 'red';
      case 'Preparing':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getEnvironmentStateIcon = (state: string) => {
    switch (state) {
      case 'Ready':
        return <FiCheckCircle />;
      case 'NotReady':
        return <FiAlertTriangle />;
      case 'Preparing':
        return <FiClock />;
      default:
        return <FiClock />;
    }
  };

  if (error) {
    return (
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Error Loading Environments</Alert.Title>
          <Alert.Description>Failed to load Power Platform environments data. Please try again.</Alert.Description>
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
                <Text fontSize="sm" color="gray.600">Total Environments</Text>
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  {isLoading ? <Spinner size="sm" /> : envStats.total}
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <VStack gap={2}>
                <Text fontSize="sm" color="gray.600">Production</Text>
                <Text fontSize="2xl" fontWeight="bold" color="red.600">
                  {isLoading ? <Spinner size="sm" /> : envStats.production}
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <VStack gap={2}>
                <Text fontSize="sm" color="gray.600">Sandbox</Text>
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  {isLoading ? <Spinner size="sm" /> : envStats.sandbox}
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <VStack gap={2}>
                <Text fontSize="sm" color="gray.600">Trial</Text>
                <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                  {isLoading ? <Spinner size="sm" /> : envStats.trial}
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <VStack gap={2}>
                <Text fontSize="sm" color="gray.600">Developer</Text>
                <Text fontSize="2xl" fontWeight="bold" color="green.600">
                  {isLoading ? <Spinner size="sm" /> : envStats.developer}
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <VStack gap={2}>
                <Text fontSize="sm" color="gray.600">Healthy</Text>
                <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                  {isLoading ? <Spinner size="sm" /> : envStats.healthy}
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        {/* Filters */}
        <Card.Root>
          <Card.Body>
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <HStack gap={4}>
                <Text fontWeight="medium">Filter by Type:</Text>
                <Button
                  size="sm"
                  variant={filterType === 'all' ? 'solid' : 'outline'}
                  onClick={() => setFilterType('all')}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={filterType === 'production' ? 'solid' : 'outline'}
                  colorScheme="red"
                  onClick={() => setFilterType('production')}
                >
                  Production
                </Button>
                <Button
                  size="sm"
                  variant={filterType === 'sandbox' ? 'solid' : 'outline'}
                  colorScheme="blue"
                  onClick={() => setFilterType('sandbox')}
                >
                  Sandbox
                </Button>
                <Button
                  size="sm"
                  variant={filterType === 'trial' ? 'solid' : 'outline'}
                  colorScheme="orange"
                  onClick={() => setFilterType('trial')}
                >
                  Trial
                </Button>
                <Button
                  size="sm"
                  variant={filterType === 'developer' ? 'solid' : 'outline'}
                  colorScheme="green"
                  onClick={() => setFilterType('developer')}
                >
                  Developer
                </Button>
              </HStack>

              <Button
                leftIcon={<FiRefreshCw />}
                onClick={() => refetch()}
                variant="outline"
                isLoading={isLoading}
              >
                Refresh
              </Button>
            </Flex>
          </Card.Body>
        </Card.Root>

        {/* Environments Grid */}
        {isLoading ? (
          <Flex justify="center" py={8}>
            <Spinner size="lg" />
          </Flex>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
            {filteredEnvironments.map((environment) => (
              <Card.Root key={environment.id} variant="outline">
                <Card.Body>
                  <VStack gap={3} align="stretch">
                    {/* Environment Header */}
                    <Flex justify="space-between" align="start">
                      <HStack gap={2}>
                        <FiGlobe />
                        <VStack gap={0} align="start" flex={1}>
                          <Text fontWeight="bold" fontSize="md" noOfLines={1}>
                            {environment.displayName}
                          </Text>
                          <Text fontSize="sm" color="gray.600" noOfLines={1}>
                            {environment.domainName}
                          </Text>
                        </VStack>
                      </HStack>
                      <VStack gap={1} align="end">
                        <Badge colorScheme={getEnvironmentTypeColor(environment.type)}>
                          {environment.type}
                        </Badge>
                        <HStack gap={1}>
                          {getEnvironmentStateIcon(environment.state)}
                          <Badge colorScheme={getEnvironmentStateColor(environment.state)} size="sm">
                            {environment.state}
                          </Badge>
                        </HStack>
                      </VStack>
                    </Flex>

                    {/* Environment Description */}
                    {environment.description && (
                      <Text fontSize="sm" color="gray.700" noOfLines={2}>
                        {environment.description}
                      </Text>
                    )}

                    {/* Environment Metadata */}
                    <VStack gap={2} align="stretch">
                      <Flex justify="space-between" fontSize="sm">
                        <Text color="gray.600">Region:</Text>
                        <Text>{environment.region || 'N/A'}</Text>
                      </Flex>
                      
                      <Flex justify="space-between" fontSize="sm">
                        <Text color="gray.600">Version:</Text>
                        <Text>{environment.version || 'N/A'}</Text>
                      </Flex>
                      
                      <Flex justify="space-between" fontSize="sm">
                        <Text color="gray.600">Security Group:</Text>
                        <Text>{environment.securityGroupId ? 'Enabled' : 'Disabled'}</Text>
                      </Flex>
                      
                      <Flex justify="space-between" fontSize="sm">
                        <Text color="gray.600">Created:</Text>
                        <Text>{formatDistanceToNow(new Date(environment.createdTime), { addSuffix: true })}</Text>
                      </Flex>
                    </VStack>

                    {/* Environment Features */}
                    <VStack gap={2} align="stretch">
                      <Text fontSize="sm" fontWeight="medium" color="gray.700">Features:</Text>
                      <HStack gap={2} wrap="wrap">
                        {environment.isDefault && (
                          <Badge colorScheme="purple" size="sm">Default</Badge>
                        )}
                        {environment.cdsDatabaseType && (
                          <Badge colorScheme="blue" size="sm">CDS</Badge>
                        )}
                        {environment.linkedEnvironmentMetadata && (
                          <Badge colorScheme="green" size="sm">Linked</Badge>
                        )}
                      </HStack>
                    </VStack>

                    {/* Actions */}
                    <HStack gap={2} pt={2}>
                      <Tooltip label="Environment Settings">
                        <IconButton
                          aria-label="Environment settings"
                          icon={<FiSettings />}
                          size="sm"
                          variant="outline"
                        />
                      </Tooltip>
                      <Tooltip label="Security Settings">
                        <IconButton
                          aria-label="Security settings"
                          icon={<FiShield />}
                          size="sm"
                          variant="outline"
                          colorScheme="orange"
                        />
                      </Tooltip>
                      <Tooltip label="Database Info">
                        <IconButton
                          aria-label="Database information"
                          icon={<FiDatabase />}
                          size="sm"
                          variant="outline"
                          colorScheme="blue"
                          isDisabled={!environment.cdsDatabaseType}
                        />
                      </Tooltip>
                      <Tooltip label="User Management">
                        <IconButton
                          aria-label="User management"
                          icon={<FiUsers />}
                          size="sm"
                          variant="outline"
                          colorScheme="green"
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
        {!isLoading && filteredEnvironments.length === 0 && (
          <Card.Root>
            <Card.Body>
              <VStack gap={4} py={8}>
                <FiGlobe size={48} color="gray.400" />
                <VStack gap={2}>
                  <Text fontSize="lg" fontWeight="medium" color="gray.600">
                    No Environments Found
                  </Text>
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    {filterType !== 'all' 
                      ? 'Try adjusting your filters'
                      : 'No environments are available in this organization'
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

export default EnvironmentManagement; 