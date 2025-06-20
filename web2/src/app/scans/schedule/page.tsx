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
  Switch,
  Textarea,
  Table,
  IconButton,
  Tooltip,
  Code,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiPlay,
  FiPause,
  FiCalendar,
  FiArrowLeft,
  FiCheck,
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { format, addDays, parseISO } from 'date-fns';

// Mock data for scheduled scans
const mockScheduledScans = [
  {
    id: 'sched-1',
    name: 'Weekly Security Compliance Scan',
    description: 'Comprehensive security compliance check for all production systems',
    template_name: 'Security Compliance Template',
    cron_expression: '0 2 * * 1', // Every Monday at 2 AM
    frequency: 'weekly',
    next_run: '2024-12-23T02:00:00Z',
    last_run: '2024-12-16T02:00:00Z',
    status: 'active',
    success_count: 15,
    failure_count: 1,
  },
  {
    id: 'sched-2',
    name: 'Monthly Infrastructure Audit',
    description: 'Monthly comprehensive infrastructure security audit',
    template_name: 'Infrastructure Audit Template',
    cron_expression: '0 3 1 * *', // First day of month at 3 AM
    frequency: 'monthly',
    next_run: '2025-01-01T03:00:00Z',
    last_run: '2024-12-01T03:00:00Z',
    status: 'active',
    success_count: 2,
    failure_count: 0,
  },
  {
    id: 'sched-3',
    name: 'Daily Quick Health Check',
    description: 'Quick daily health check for critical systems',
    template_name: 'Health Check Template',
    cron_expression: '0 6 * * *', // Every day at 6 AM
    frequency: 'daily',
    next_run: '2024-12-21T06:00:00Z',
    last_run: '2024-12-20T06:00:00Z',
    status: 'paused',
    success_count: 10,
    failure_count: 0,
  },
];

export default function ScanSchedulePage() {
  const router = useRouter();
  const [scheduledScans, setScheduledScans] = useState(mockScheduledScans);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for creating schedules
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_id: '',
    frequency: 'weekly',
    cron_expression: '',
    targets: '',
    maintenance_enabled: false,
    maintenance_start: '02:00',
    maintenance_end: '06:00',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateCronExpression = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return '0 2 * * *'; // 2 AM daily
      case 'weekly':
        return '0 2 * * 1'; // 2 AM every Monday
      case 'monthly':
        return '0 2 1 * *'; // 2 AM first day of month
      default:
        return '0 2 * * *';
    }
  };

  const handleCreateSchedule = async () => {
    setIsLoading(true);
    try {
      const cronExpr = generateCronExpression(formData.frequency);
      const nextRun = addDays(new Date(), 1).toISOString();

      const newSchedule = {
        id: `sched-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        template_name: 'Custom Template',
        cron_expression: cronExpr,
        frequency: formData.frequency,
        next_run: nextRun,
        last_run: '',
        status: 'active',
        success_count: 0,
        failure_count: 0,
      };

      setScheduledScans(prev => [...prev, newSchedule]);
      setShowCreateForm(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSchedule = async (scheduleId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    setScheduledScans(prev => prev.map(schedule => 
      schedule.id === scheduleId
        ? { ...schedule, status: newStatus }
        : schedule
    ));
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      setScheduledScans(prev => prev.filter(schedule => schedule.id !== scheduleId));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      template_id: '',
      frequency: 'weekly',
      cron_expression: '',
      targets: '',
      maintenance_enabled: false,
      maintenance_start: '02:00',
      maintenance_end: '06:00',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'paused': return 'yellow';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const activeCount = scheduledScans.filter(s => s.status === 'active').length;
    const pausedCount = scheduledScans.filter(s => s.status === 'paused').length;
    const totalRuns = scheduledScans.reduce((sum, s) => sum + s.success_count + s.failure_count, 0);
    const successRate = totalRuns > 0 
      ? Math.round((scheduledScans.reduce((sum, s) => sum + s.success_count, 0) / totalRuns) * 100)
      : 100;

    return {
      total: scheduledScans.length,
      active: activeCount,
      paused: pausedCount,
      successRate,
    };
  }, [scheduledScans]);

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <HStack spacing={4}>
            <IconButton
              aria-label="Back to scans"
              icon={<FiArrowLeft />}
              variant="ghost"
              onClick={() => router.push('/scans')}
            />
            <VStack align="start" spacing={0}>
              <Heading size="lg">Scan Scheduling</Heading>
              <Text color="gray.600">Manage recurring scans and automated scheduling</Text>
            </VStack>
          </HStack>
          <Button 
            leftIcon={<FiPlus />} 
            colorScheme="blue" 
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : 'Create Schedule'}
          </Button>
        </Flex>

        {/* Statistics Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          <Card>
            <CardBody>
              <VStack spacing={2}>
                <HStack>
                  <FiCalendar color="var(--chakra-colors-blue-500)" />
                  <Text fontSize="sm" color="gray.600">Total Schedules</Text>
                </HStack>
                <Text fontSize="2xl" fontWeight="bold">{stats.total}</Text>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <VStack spacing={2}>
                <HStack>
                  <FiPlay color="var(--chakra-colors-green-500)" />
                  <Text fontSize="sm" color="gray.600">Active</Text>
                </HStack>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">{stats.active}</Text>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <VStack spacing={2}>
                <HStack>
                  <FiPause color="var(--chakra-colors-yellow-500)" />
                  <Text fontSize="sm" color="gray.600">Paused</Text>
                </HStack>
                <Text fontSize="2xl" fontWeight="bold" color="yellow.500">{stats.paused}</Text>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <VStack spacing={2}>
                <HStack>
                  <FiCheck color="var(--chakra-colors-green-500)" />
                  <Text fontSize="sm" color="gray.600">Success Rate</Text>
                </HStack>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">{stats.successRate}%</Text>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Create Schedule Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <Heading size="md">Create New Schedule</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Text mb={2} fontWeight="medium">Schedule Name *</Text>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter schedule name"
                    />
                  </Box>
                  <Box>
                    <Text mb={2} fontWeight="medium">Frequency *</Text>
                    <Select
                      value={formData.frequency}
                      onChange={(e) => handleInputChange('frequency', e.target.value)}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </Select>
                  </Box>
                </SimpleGrid>

                <Box>
                  <Text mb={2} fontWeight="medium">Description</Text>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter schedule description"
                    rows={3}
                  />
                </Box>

                <Box>
                  <Text mb={2} fontWeight="medium">Target Systems</Text>
                  <Input
                    value={formData.targets}
                    onChange={(e) => handleInputChange('targets', e.target.value)}
                    placeholder="Enter target systems (comma-separated)"
                  />
                </Box>

                <Box>
                  <HStack spacing={4}>
                    <Switch
                      isChecked={formData.maintenance_enabled}
                      onChange={(e) => handleInputChange('maintenance_enabled', e.target.checked)}
                    />
                    <Text>Enable Maintenance Window</Text>
                  </HStack>
                </Box>

                {formData.maintenance_enabled && (
                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text mb={2} fontWeight="medium">Start Time</Text>
                      <Input
                        type="time"
                        value={formData.maintenance_start}
                        onChange={(e) => handleInputChange('maintenance_start', e.target.value)}
                      />
                    </Box>
                    <Box>
                      <Text mb={2} fontWeight="medium">End Time</Text>
                      <Input
                        type="time"
                        value={formData.maintenance_end}
                        onChange={(e) => handleInputChange('maintenance_end', e.target.value)}
                      />
                    </Box>
                  </SimpleGrid>
                )}

                <HStack spacing={3}>
                  <Button
                    colorScheme="blue"
                    onClick={handleCreateSchedule}
                    isLoading={isLoading}
                    isDisabled={!formData.name}
                  >
                    Create Schedule
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Scheduled Scans Table */}
        <Card>
          <CardHeader>
            <Heading size="md">Scheduled Scans</Heading>
          </CardHeader>
          <CardBody>
            <Box overflowX="auto">
              <Table variant="simple">
                <thead>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Schedule Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Template</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Frequency</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Next Run</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Success Rate</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledScans.map((schedule) => {
                    const successRate = schedule.success_count + schedule.failure_count > 0
                      ? Math.round((schedule.success_count / (schedule.success_count + schedule.failure_count)) * 100)
                      : 100;

                    return (
                      <tr key={schedule.id} style={{ borderBottom: '1px solid #f7fafc' }}>
                        <td style={{ padding: '12px' }}>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="medium">{schedule.name}</Text>
                            <Text fontSize="sm" color="gray.600">
                              {schedule.description}
                            </Text>
                          </VStack>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <Text fontSize="sm">{schedule.template_name}</Text>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="sm" textTransform="capitalize">
                              {schedule.frequency}
                            </Text>
                            <Code fontSize="xs">{schedule.cron_expression}</Code>
                          </VStack>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <Text fontSize="sm">
                            {format(parseISO(schedule.next_run), 'MMM dd, yyyy HH:mm')}
                          </Text>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <Badge colorScheme={getStatusColor(schedule.status)} textTransform="capitalize">
                            {schedule.status}
                          </Badge>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="sm" color={successRate >= 90 ? 'green.600' : successRate >= 70 ? 'yellow.600' : 'red.600'}>
                              {successRate}%
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {schedule.success_count}✓ {schedule.failure_count}✗
                            </Text>
                          </VStack>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <HStack spacing={1}>
                            <Tooltip label={schedule.status === 'active' ? 'Pause Schedule' : 'Activate Schedule'}>
                              <IconButton
                                aria-label={schedule.status === 'active' ? 'Pause' : 'Activate'}
                                icon={schedule.status === 'active' ? <FiPause /> : <FiPlay />}
                                size="sm"
                                variant="ghost"
                                colorScheme={schedule.status === 'active' ? 'yellow' : 'green'}
                                onClick={() => handleToggleSchedule(schedule.id, schedule.status)}
                              />
                            </Tooltip>
                            <Tooltip label="Edit Schedule">
                              <IconButton
                                aria-label="Edit"
                                icon={<FiEdit />}
                                size="sm"
                                variant="ghost"
                                onClick={() => {}}
                              />
                            </Tooltip>
                            <Tooltip label="Delete Schedule">
                              <IconButton
                                aria-label="Delete"
                                icon={<FiTrash2 />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => handleDeleteSchedule(schedule.id)}
                              />
                            </Tooltip>
                          </HStack>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
} 