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
  Stat, 
  SimpleGrid,
  Tabs,
  HStack,
  VStack,
  Progress,
  Alert,
  Spinner,
  IconButton,
  Tooltip,
  Dialog,
  createToaster,
} from '@chakra-ui/react';
import { 
  FiRefreshCw, 
  FiShield, 
  FiActivity, 
  FiSettings, 
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiUsers,
  FiZap,
  FiDatabase,
  FiPlay,
  FiPause,
  FiEye,
  FiDownload,
} from 'react-icons/fi';
import { 
  usePowerPlatformStats, 
  usePowerApps, 
  usePowerFlows, 
  usePowerEnvironments,
  usePowerPlatformScanResults,
  useTriggerPowerPlatformScan 
} from '@data-access/powerPlatformApi';
import { formatDistanceToNow, format } from 'date-fns';
import { PowerAppsInventory } from './components/PowerAppsInventory';
import { FlowsMonitoring } from './components/FlowsMonitoring';
import { EnvironmentManagement } from './components/EnvironmentManagement';
import { PowerPlatformCompliance } from './components/PowerPlatformCompliance';
import { GovernanceRecommendations } from './components/GovernanceRecommendations';
import { PowerPlatformScanning } from './components/PowerPlatformScanning';

// Mock user data - replace with actual auth context
const mockUser = {
  id: '1',
  org_id: '1',
  role: 'admin',
};

export default function PowerPlatformDashboard() {
  const [selectedTab, setSelectedTab] = useState(0);
  const { isOpen: isScanOpen, onOpen: onScanOpen, onClose: onScanClose } = useDisclosure();
  const toast = useToast();

  // API hooks
  const { data: statsData, isLoading: statsLoading, error: statsError, refetch: refetchStats } = usePowerPlatformStats(mockUser.org_id);
  const { data: appsData, isLoading: appsLoading } = usePowerApps(mockUser.org_id);
  const { data: flowsData, isLoading: flowsLoading } = usePowerFlows(mockUser.org_id);
  const { data: environmentsData, isLoading: environmentsLoading } = usePowerEnvironments(mockUser.org_id);
  const { data: scanResultsData, isLoading: scanResultsLoading } = usePowerPlatformScanResults(mockUser.org_id);
  
  const triggerScanMutation = useTriggerPowerPlatformScan();

  // Calculate governance score color
  const getGovernanceScoreColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    if (score >= 40) return 'orange';
    return 'red';
  };

  // Calculate compliance status color
  const getComplianceColor = (percentage: number) => {
    if (percentage >= 90) return 'green';
    if (percentage >= 70) return 'yellow';
    if (percentage >= 50) return 'orange';
    return 'red';
  };

  // Environment health calculation
  const environmentHealth = useMemo(() => {
    if (!environmentsData?.data) return { healthy: 0, total: 0, percentage: 0 };
    
    const healthy = environmentsData.data.filter(env => env.state === 'Ready').length;
    const total = environmentsData.data.length;
    const percentage = total > 0 ? (healthy / total) * 100 : 0;
    
    return { healthy, total, percentage };
  }, [environmentsData]);

  // Recent activity calculation
  const recentActivity = useMemo(() => {
    if (!appsData?.data || !flowsData?.data) return [];
    
    const activities = [];
    
    // Add recent app activities
    appsData.data.forEach(app => {
      activities.push({
        id: `app-${app.id}`,
        type: 'app',
        name: app.displayName,
        action: 'modified',
        timestamp: app.lastModifiedTime,
        user: app.owner.displayName,
      });
    });
    
    // Add recent flow activities
    flowsData.data.forEach(flow => {
      activities.push({
        id: `flow-${flow.id}`,
        type: 'flow',
        name: flow.displayName,
        action: 'modified',
        timestamp: flow.lastModifiedTime,
        user: flow.owner.displayName,
      });
    });
    
    // Sort by timestamp and take the 5 most recent
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [appsData, flowsData]);

  // Handle scan trigger
  const handleTriggerScan = async () => {
    try {
      await triggerScanMutation.mutateAsync(mockUser.org_id);
      toast({
        title: 'Scan Initiated',
        description: 'Power Platform scan has been triggered successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onScanClose();
      // Refresh stats after scan
      setTimeout(() => refetchStats(), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to trigger Power Platform scan',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const isLoading = statsLoading || appsLoading || flowsLoading || environmentsLoading;

  if (statsError) {
    return (
      <Box p={6}>
        <Alert status="error">
          <AlertIcon />
          Failed to load Power Platform data. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={6} bg="gray.50" minH="100vh">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg" color="gray.800">Power Platform Dashboard</Heading>
          <Text color="gray.600">Monitor and manage your Power Platform resources</Text>
        </VStack>
        <HStack spacing={3}>
          <Tooltip label="Refresh Data">
            <IconButton
              aria-label="Refresh data"
              icon={<FiRefreshCw />}
              onClick={() => refetchStats()}
              isLoading={isLoading}
              variant="outline"
            />
          </Tooltip>
          <Button
            leftIcon={<FiActivity />}
            colorScheme="blue"
            onClick={onScanOpen}
            isLoading={triggerScanMutation.isPending}
          >
            Trigger Scan
          </Button>
        </HStack>
      </Flex>

      {/* Stats Overview */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        {/* Governance Score */}
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Governance Score</StatLabel>
              <HStack>
                <StatNumber color={`${getGovernanceScoreColor(statsData?.governance_score || 0)}.500`}>
                  {isLoading ? <Spinner size="sm" /> : `${statsData?.governance_score || 0}%`}
                </StatNumber>
                <FiShield color={getGovernanceScoreColor(statsData?.governance_score || 0)} />
              </HStack>
              <StatHelpText>
                {statsData?.governance_score >= 80 ? 'Excellent' : 
                 statsData?.governance_score >= 60 ? 'Good' : 
                 statsData?.governance_score >= 40 ? 'Needs Improvement' : 'Critical'}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        {/* Compliance Percentage */}
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Compliance Rate</StatLabel>
              <HStack>
                <StatNumber color={`${getComplianceColor(statsData?.compliance_percentage || 0)}.500`}>
                  {isLoading ? <Spinner size="sm" /> : `${statsData?.compliance_percentage || 0}%`}
                </StatNumber>
                <FiCheckCircle color={getComplianceColor(statsData?.compliance_percentage || 0)} />
              </HStack>
              <StatHelpText>
                {statsData?.compliance_percentage >= 90 ? 'Excellent compliance' : 'Room for improvement'}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        {/* Environment Health */}
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Environment Health</StatLabel>
              <HStack>
                <StatNumber color={environmentHealth.percentage >= 80 ? 'green.500' : 'orange.500'}>
                  {isLoading ? <Spinner size="sm" /> : `${environmentHealth.healthy}/${environmentHealth.total}`}
                </StatNumber>
                <FiDatabase color={environmentHealth.percentage >= 80 ? 'green' : 'orange'} />
              </HStack>
              <StatHelpText>
                {environmentHealth.percentage >= 80 ? 'All systems healthy' : 'Some issues detected'}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        {/* Active Resources */}
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Active Resources</StatLabel>
              <HStack>
                <StatNumber color="blue.500">
                  {isLoading ? <Spinner size="sm" /> : (statsData?.active_apps || 0) + (statsData?.active_flows || 0)}
                </StatNumber>
                <FiZap color="blue" />
              </HStack>
              <StatHelpText>
                {statsData?.active_apps || 0} apps, {statsData?.active_flows || 0} flows
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Risk Distribution */}
      <Card mb={8}>
        <CardHeader>
          <Heading size="md">Risk Distribution</Heading>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <Flex justify="center" p={8}>
              <Spinner size="lg" />
            </Flex>
          ) : (
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="red.500">
                  {statsData?.risk_distribution?.critical || 0}
                </Text>
                <Text fontSize="sm" color="gray.600">Critical</Text>
                <Progress
                  value={(statsData?.risk_distribution?.critical || 0) * 10}
                  colorScheme="red"
                  size="sm"
                  w="100%"
                />
              </VStack>
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  {statsData?.risk_distribution?.high || 0}
                </Text>
                <Text fontSize="sm" color="gray.600">High</Text>
                <Progress
                  value={(statsData?.risk_distribution?.high || 0) * 10}
                  colorScheme="orange"
                  size="sm"
                  w="100%"
                />
              </VStack>
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="yellow.500">
                  {statsData?.risk_distribution?.medium || 0}
                </Text>
                <Text fontSize="sm" color="gray.600">Medium</Text>
                <Progress
                  value={(statsData?.risk_distribution?.medium || 0) * 10}
                  colorScheme="yellow"
                  size="sm"
                  w="100%"
                />
              </VStack>
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {statsData?.risk_distribution?.low || 0}
                </Text>
                <Text fontSize="sm" color="gray.600">Low</Text>
                <Progress
                  value={(statsData?.risk_distribution?.low || 0) * 10}
                  colorScheme="green"
                  size="sm"
                  w="100%"
                />
              </VStack>
            </SimpleGrid>
          )}
        </CardBody>
      </Card>

      {/* Recent Activity */}
      <Card mb={8}>
        <CardHeader>
          <Heading size="md">Recent Activity</Heading>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <Flex justify="center" p={8}>
              <Spinner size="lg" />
            </Flex>
          ) : recentActivity.length > 0 ? (
            <VStack align="stretch" spacing={3}>
              {recentActivity.map((activity) => (
                <Flex key={activity.id} justify="space-between" align="center" p={3} bg="gray.50" rounded="md">
                  <HStack>
                    <Badge colorScheme={activity.type === 'app' ? 'blue' : 'green'}>
                      {activity.type.toUpperCase()}
                    </Badge>
                    <Text fontWeight="medium">{activity.name}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {activity.action} by {activity.user}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.500">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </Text>
                </Flex>
              ))}
            </VStack>
          ) : (
            <Text color="gray.500" textAlign="center" py={8}>
              No recent activity
            </Text>
          )}
        </CardBody>
      </Card>

      {/* Tabbed Content */}
      <Card>
        <CardBody>
          <Tabs index={selectedTab} onChange={setSelectedTab}>
            <TabList>
              <Tab>Apps Inventory</Tab>
              <Tab>Flows Monitoring</Tab>
              <Tab>Environment Management</Tab>
              <Tab>Compliance</Tab>
              <Tab>Governance</Tab>
              <Tab>Scanning</Tab>
            </TabList>

            <TabPanels>
              <TabPanel px={0}>
                <PowerAppsInventory orgId={mockUser.org_id} />
              </TabPanel>
              <TabPanel px={0}>
                <FlowsMonitoring orgId={mockUser.org_id} />
              </TabPanel>
              <TabPanel px={0}>
                <EnvironmentManagement orgId={mockUser.org_id} />
              </TabPanel>
              <TabPanel px={0}>
                <PowerPlatformCompliance orgId={mockUser.org_id} />
              </TabPanel>
              <TabPanel px={0}>
                <GovernanceRecommendations orgId={mockUser.org_id} />
              </TabPanel>
              <TabPanel px={0}>
                <PowerPlatformScanning orgId={mockUser.org_id} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>

      {/* Scan Confirmation Modal */}
      <Modal isOpen={isScanOpen} onClose={onScanClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Trigger Power Platform Scan</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="start" spacing={4}>
              <Text>
                This will initiate a comprehensive scan of your Power Platform environment to:
              </Text>
              <VStack align="start" spacing={2} pl={4}>
                <Text>• Analyze governance compliance</Text>
                <Text>• Identify security risks</Text>
                <Text>• Review sharing permissions</Text>
                <Text>• Check connection usage</Text>
                <Text>• Generate recommendations</Text>
              </VStack>
              <Alert status="info" size="sm">
                <AlertIcon />
                The scan may take several minutes to complete.
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onScanClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleTriggerScan}
              isLoading={triggerScanMutation.isPending}
            >
              Start Scan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 