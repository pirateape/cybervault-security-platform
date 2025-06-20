'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Flex,
  Heading,
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
  FiUsers,
  FiExternalLink,
  FiFilter,
  FiDownload,
  FiSearch,
  FiSettings,
  FiShield,
  FiActivity,
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { usePowerApps } from '../../../../libs/data-access/powerPlatformApi';

interface PowerAppsInventoryProps {
  orgId: string;
}

export function PowerAppsInventory({ orgId }: PowerAppsInventoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'lastModified' | 'connections'>('lastModified');

  const { data: appsData, isLoading, error, refetch } = usePowerApps(orgId);

  // Filter and sort apps
  const filteredApps = useMemo(() => {
    if (!appsData?.data) return [];

    let filtered = appsData.data;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(app => {
        if (filterStatus === 'active') return app.isActive;
        if (filterStatus === 'inactive') return !app.isActive;
        return true;
      });
    }

    // Sort apps
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.displayName.localeCompare(b.displayName);
        case 'lastModified':
          return new Date(b.lastModifiedTime).getTime() - new Date(a.lastModifiedTime).getTime();
        case 'connections':
          return (b.connectionReferences?.length || 0) - (a.connectionReferences?.length || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [appsData?.data, searchTerm, filterStatus, sortBy]);

  // Calculate app statistics
  const appStats = useMemo(() => {
    if (!appsData?.data) return { total: 0, active: 0, inactive: 0, canvas: 0, model: 0 };

    const total = appsData.data.length;
    const active = appsData.data.filter(app => app.isActive).length;
    const inactive = total - active;
    const canvas = appsData.data.filter(app => app.appType === 'Canvas').length;
    const model = appsData.data.filter(app => app.appType === 'Model').length;

    return { total, active, inactive, canvas, model };
  }, [appsData?.data]);

  const getAppStatusColor = (app: any) => {
    if (!app.isActive) return 'red';
    if (app.connectionReferences?.length > 5) return 'orange';
    return 'green';
  };

  const getAppTypeIcon = (appType: string) => {
    switch (appType) {
      case 'Canvas':
        return <FiActivity />;
      case 'Model':
        return <FiSettings />;
      default:
        return <FiPlay />;
    }
  };

  if (error) {
    return (
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Error Loading Apps</Alert.Title>
          <Alert.Description>Failed to load Power Apps data. Please try again.</Alert.Description>
        </Alert.Content>
      </Alert.Root>
    );
  }

  return (
    <Box>
      {/* Header with Stats */}
      <VStack spacing={6} align="stretch">
        {/* Statistics Cards */}
        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
          <Card.Root>
            <Card.Body>
              <VStack spacing={2}>
                <Text fontSize="sm" color="gray.600">Total Apps</Text>
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  {isLoading ? <Spinner size="sm" /> : appStats.total}
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <VStack spacing={2}>
                <Text fontSize="sm" color="gray.600">Active</Text>
                <Text fontSize="2xl" fontWeight="bold" color="green.600">
                  {isLoading ? <Spinner size="sm" /> : appStats.active}
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <VStack spacing={2}>
                <Text fontSize="sm" color="gray.600">Inactive</Text>
                <Text fontSize="2xl" fontWeight="bold" color="red.600">
                  {isLoading ? <Spinner size="sm" /> : appStats.inactive}
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <VStack spacing={2}>
                <Text fontSize="sm" color="gray.600">Canvas Apps</Text>
                <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                  {isLoading ? <Spinner size="sm" /> : appStats.canvas}
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <VStack spacing={2}>
                <Text fontSize="sm" color="gray.600">Model Apps</Text>
                <Text fontSize="2xl" fontWeight="bold" color="teal.600">
                  {isLoading ? <Spinner size="sm" /> : appStats.model}
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        {/* Filters and Controls */}
        <Card.Root>
          <Card.Body>
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <HStack spacing={4}>
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
                  variant={filterStatus === 'active' ? 'solid' : 'outline'}
                  colorScheme="green"
                  onClick={() => setFilterStatus('active')}
                >
                  Active
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === 'inactive' ? 'solid' : 'outline'}
                  colorScheme="red"
                  onClick={() => setFilterStatus('inactive')}
                >
                  Inactive
                </Button>
              </HStack>

              <HStack spacing={4}>
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
                  variant={sortBy === 'lastModified' ? 'solid' : 'outline'}
                  onClick={() => setSortBy('lastModified')}
                >
                  Modified
                </Button>
                <Button
                  size="sm"
                  variant={sortBy === 'connections' ? 'solid' : 'outline'}
                  onClick={() => setSortBy('connections')}
                >
                  Connections
                </Button>
              </HStack>
            </Flex>
          </Card.Body>
        </Card.Root>

        {/* Apps Grid */}
        {isLoading ? (
          <Flex justify="center" py={8}>
            <Spinner size="lg" />
          </Flex>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {filteredApps.map((app) => (
              <Card.Root key={app.id} variant="outline">
                <Card.Body>
                  <VStack spacing={3} align="stretch">
                    {/* App Header */}
                    <Flex justify="space-between" align="start">
                      <HStack spacing={2}>
                        {getAppTypeIcon(app.appType)}
                        <VStack spacing={0} align="start" flex={1}>
                          <Text fontWeight="bold" fontSize="md" noOfLines={1}>
                            {app.displayName}
                          </Text>
                          <Text fontSize="sm" color="gray.600" noOfLines={1}>
                            {app.environment.name}
                          </Text>
                        </VStack>
                      </HStack>
                      <Badge colorScheme={getAppStatusColor(app)}>
                        {app.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Flex>

                    {/* App Description */}
                    {app.description && (
                      <Text fontSize="sm" color="gray.700" noOfLines={2}>
                        {app.description}
                      </Text>
                    )}

                    {/* App Metadata */}
                    <VStack spacing={2} align="stretch">
                      <Flex justify="space-between" fontSize="sm">
                        <Text color="gray.600">Type:</Text>
                        <Badge variant="outline">{app.appType}</Badge>
                      </Flex>
                      
                      <Flex justify="space-between" fontSize="sm">
                        <Text color="gray.600">Owner:</Text>
                        <Text>{app.owner.displayName}</Text>
                      </Flex>
                      
                      <Flex justify="space-between" fontSize="sm">
                        <Text color="gray.600">Connections:</Text>
                        <Text>{app.connectionReferences?.length || 0}</Text>
                      </Flex>
                      
                      <Flex justify="space-between" fontSize="sm">
                        <Text color="gray.600">Modified:</Text>
                        <Text>{formatDistanceToNow(new Date(app.lastModifiedTime), { addSuffix: true })}</Text>
                      </Flex>
                    </VStack>

                    {/* Actions */}
                    <HStack spacing={2} pt={2}>
                      <Tooltip label="View Details">
                        <IconButton
                          aria-label="View app details"
                          icon={<FiExternalLink />}
                          size="sm"
                          variant="outline"
                        />
                      </Tooltip>
                      <Tooltip label="Security Analysis">
                        <IconButton
                          aria-label="Security analysis"
                          icon={<FiShield />}
                          size="sm"
                          variant="outline"
                          colorScheme="orange"
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
        {!isLoading && filteredApps.length === 0 && (
          <Card.Root>
            <Card.Body>
              <VStack spacing={4} py={8}>
                <FiSearch size={48} color="gray.400" />
                <VStack spacing={2}>
                  <Text fontSize="lg" fontWeight="medium" color="gray.600">
                    No Power Apps Found
                  </Text>
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Try adjusting your filters or search terms'
                      : 'No Power Apps are available in this organization'
                    }
                  </Text>
                </VStack>
                <Button
                  leftIcon={<FiDownload />}
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

export default PowerAppsInventory; 