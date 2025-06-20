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
  Progress,
  Badge,
  Button,
  SimpleGrid,
  Flex,
  Select,
  Input,
  Switch,
  Alert,
  AlertIcon,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Tbody,
  Tr,
  Td,
  Th,
  Thead,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
} from '@chakra-ui/react';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart3,
  FiPieChart,
  FiActivity,
  FiClock,
  FiTarget,
  FiAlertTriangle,
  FiCheckCircle,
  FiRefreshCw,
  FiDownload,
  FiFilter,
  FiCalendar,
} from 'react-icons/fi';
import {
  useScanHistoryAnalytics,
  useScanTrendAnalysis,
  useScanOptimizationRecommendations,
} from '@data-access/scanApi';
import { formatDistanceToNow, format, subDays, subWeeks, subMonths } from 'date-fns';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ComposedChart,
  Legend,
} from 'recharts';

// Mock user data - in real app this would come from auth context
const mockUser = {
  id: 'user-123',
  org_id: 'org-456',
  name: 'John Doe',
  email: 'john@example.com'
};

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// Time range options
const TIME_RANGES = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 3 Months' },
  { value: '1y', label: 'Last Year' },
];

export default function ScanHistoryAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('completion_time');
  const [scanTypeFilter, setScanTypeFilter] = useState('all');
  const [showPredictions, setShowPredictions] = useState(true);

  // Calculate date range
  const dateRange = useMemo(() => {
    const end = new Date();
    let start: Date;
    
    switch (timeRange) {
      case '7d':
        start = subDays(end, 7);
        break;
      case '30d':
        start = subDays(end, 30);
        break;
      case '90d':
        start = subMonths(end, 3);
        break;
      case '1y':
        start = subMonths(end, 12);
        break;
      default:
        start = subDays(end, 30);
    }
    
    return { start, end };
  }, [timeRange]);

  // API hooks
  const { data: historyData, isLoading: historyLoading } = useScanHistoryAnalytics(
    mockUser.org_id,
    dateRange.start.toISOString(),
    dateRange.end.toISOString(),
    scanTypeFilter !== 'all' ? scanTypeFilter : undefined
  );

  const { data: trendData, isLoading: trendLoading } = useScanTrendAnalysis(
    mockUser.org_id,
    selectedMetric,
    timeRange
  );

  const { data: optimizationData, isLoading: optimizationLoading } = useScanOptimizationRecommendations(
    mockUser.org_id,
    dateRange.start.toISOString(),
    dateRange.end.toISOString()
  );

  // Process data for charts
  const performanceOverTime = useMemo(() => {
    if (!historyData?.performance_over_time) return [];
    
    return historyData.performance_over_time.map((item: any) => ({
      date: format(new Date(item.date), 'MMM dd'),
      avgDuration: item.avg_completion_time / 60, // Convert to minutes
      scanCount: item.scan_count,
      successRate: (item.success_count / item.scan_count) * 100,
      failureRate: (item.failure_count / item.scan_count) * 100,
    }));
  }, [historyData]);

  const scanTypeDistribution = useMemo(() => {
    if (!historyData?.scan_type_distribution) return [];
    
    return Object.entries(historyData.scan_type_distribution).map(([type, count]) => ({
      name: type,
      value: count as number,
      percentage: ((count as number) / historyData.total_scans) * 100,
    }));
  }, [historyData]);

  const efficiencyTrends = useMemo(() => {
    if (!trendData?.trend_points) return [];
    
    return trendData.trend_points.map((point: any, index: number) => ({
      period: `Period ${index + 1}`,
      value: point.value,
      predicted: point.is_predicted,
      trend: point.trend_direction,
    }));
  }, [trendData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'failed': return 'red';
      case 'cancelled': return 'gray';
      default: return 'blue';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing': return <FiTrendingUp color="green" />;
      case 'decreasing': return <FiTrendingDown color="red" />;
      default: return <FiActivity color="gray" />;
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  };

  if (historyLoading || trendLoading || optimizationLoading) {
    return (
      <Box p={6} bg="gray.50" minH="100vh">
        <VStack spacing={6} align="center" justify="center" minH="60vh">
          <FiBarChart3 size={48} color="gray" />
          <Text fontSize="lg" color="gray.600">Loading analytics data...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={6} bg="gray.50" minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Box>
            <Heading size="lg">Scan History & Analytics</Heading>
            <Text color="gray.600">
              Historical performance analysis, trend identification, and optimization insights
            </Text>
          </Box>
          <HStack spacing={3} wrap="wrap">
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              w="150px"
              size="sm"
            >
              {TIME_RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </Select>
            <Select
              value={scanTypeFilter}
              onChange={(e) => setScanTypeFilter(e.target.value)}
              w="150px"
              size="sm"
            >
              <option value="all">All Types</option>
              <option value="security">Security</option>
              <option value="compliance">Compliance</option>
              <option value="vulnerability">Vulnerability</option>
              <option value="configuration">Configuration</option>
            </Select>
            <Button leftIcon={<FiRefreshCw />} size="sm">
              Refresh
            </Button>
            <Button leftIcon={<FiDownload />} size="sm" variant="outline">
              Export
            </Button>
          </HStack>
        </Flex>

        {/* Key Metrics Overview */}
        {historyData && (
          <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Scans</StatLabel>
                  <StatNumber>{historyData.total_scans}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    {historyData.scan_count_change_percent?.toFixed(1)}%
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Success Rate</StatLabel>
                  <StatNumber>{historyData.success_rate?.toFixed(1)}%</StatNumber>
                  <StatHelpText>
                    <StatArrow 
                      type={historyData.success_rate_change > 0 ? "increase" : "decrease"} 
                    />
                    {Math.abs(historyData.success_rate_change)?.toFixed(1)}%
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Avg Duration</StatLabel>
                  <StatNumber fontSize="md">
                    {formatDuration(historyData.avg_completion_time)}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow 
                      type={historyData.avg_time_change < 0 ? "increase" : "decrease"} 
                    />
                    {Math.abs(historyData.avg_time_change)?.toFixed(1)}%
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Fastest Scan</StatLabel>
                  <StatNumber fontSize="md">
                    {formatDuration(historyData.fastest_completion_time)}
                  </StatNumber>
                  <StatHelpText>Best performance</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Peak Day</StatLabel>
                  <StatNumber fontSize="sm">
                    {historyData.peak_scan_day ? format(new Date(historyData.peak_scan_day), 'MMM dd') : 'N/A'}
                  </StatNumber>
                  <StatHelpText>Highest activity</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Efficiency Score</StatLabel>
                  <StatNumber>{historyData.efficiency_score?.toFixed(1)}</StatNumber>
                  <StatHelpText>
                    <StatArrow 
                      type={historyData.efficiency_trend === 'improving' ? "increase" : "decrease"} 
                    />
                    {historyData.efficiency_trend}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}

        <Tabs>
          <TabList>
            <Tab>Performance Trends</Tab>
            <Tab>Distribution Analysis</Tab>
            <Tab>Optimization Insights</Tab>
            <Tab>Predictive Analytics</Tab>
          </TabList>

          <TabPanels>
            {/* Performance Trends Tab */}
            <TabPanel p={0} pt={4}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                {/* Performance Over Time */}
                <Card>
                  <CardHeader>
                    <Heading size="md">Performance Over Time</Heading>
                  </CardHeader>
                  <CardBody>
                    <ResponsiveContainer width="100%" height={350}>
                      <ComposedChart data={performanceOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <RechartsTooltip />
                        <Legend />
                        <Bar 
                          yAxisId="right"
                          dataKey="scanCount" 
                          fill="#8884d8" 
                          name="Scan Count"
                        />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="avgDuration" 
                          stroke="#82ca9d" 
                          name="Avg Duration (min)"
                        />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="successRate" 
                          stroke="#ffc658" 
                          name="Success Rate (%)"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>

                {/* Efficiency Trends */}
                <Card>
                  <CardHeader>
                    <Flex justify="space-between" align="center">
                      <Heading size="md">Efficiency Trends</Heading>
                      <Select
                        value={selectedMetric}
                        onChange={(e) => setSelectedMetric(e.target.value)}
                        w="180px"
                        size="sm"
                      >
                        <option value="completion_time">Completion Time</option>
                        <option value="success_rate">Success Rate</option>
                        <option value="resource_usage">Resource Usage</option>
                        <option value="error_rate">Error Rate</option>
                      </Select>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={efficiencyTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <RechartsTooltip />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3182ce"
                          strokeDasharray={(item: any) => item.predicted ? "5 5" : "0"}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    
                    {trendData && (
                      <Box mt={4}>
                        <HStack spacing={4}>
                          <Flex align="center">
                            {getTrendIcon(trendData.overall_trend)}
                            <Text ml={2} fontSize="sm">
                              {trendData.overall_trend} trend
                            </Text>
                          </Flex>
                          <Badge colorScheme={trendData.trend_strength === 'strong' ? 'green' : 'yellow'}>
                            {trendData.trend_strength}
                          </Badge>
                        </HStack>
                      </Box>
                    )}
                  </CardBody>
                </Card>
              </SimpleGrid>
            </TabPanel>

            {/* Distribution Analysis Tab */}
            <TabPanel p={0} pt={4}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                {/* Scan Type Distribution */}
                <Card>
                  <CardHeader>
                    <Heading size="md">Scan Type Distribution</Heading>
                  </CardHeader>
                  <CardBody>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={scanTypeDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {scanTypeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>

                {/* Status Distribution */}
                <Card>
                  <CardHeader>
                    <Heading size="md">Status Distribution</Heading>
                  </CardHeader>
                  <CardBody>
                    {historyData?.status_distribution && (
                      <VStack spacing={3} align="stretch">
                        {Object.entries(historyData.status_distribution).map(([status, count]) => (
                          <Box key={status}>
                            <Flex justify="space-between" mb={1}>
                              <Text fontSize="sm" textTransform="capitalize">{status}</Text>
                              <Text fontSize="sm" fontWeight="bold">{count as number}</Text>
                            </Flex>
                            <Progress 
                              value={((count as number) / historyData.total_scans) * 100}
                              colorScheme={getStatusColor(status)}
                              size="sm"
                            />
                          </Box>
                        ))}
                      </VStack>
                    )}
                  </CardBody>
                </Card>

                {/* Peak Hours Analysis */}
                <Card>
                  <CardHeader>
                    <Heading size="md">Peak Hours Analysis</Heading>
                  </CardHeader>
                  <CardBody>
                    {historyData?.peak_hours && (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={historyData.peak_hours.map((hour: any) => ({
                          hour: `${hour.hour}:00`,
                          count: hour.scan_count,
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="count" fill="#3182ce" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardBody>
                </Card>

                {/* Duration Distribution */}
                <Card>
                  <CardHeader>
                    <Heading size="md">Duration Distribution</Heading>
                  </CardHeader>
                  <CardBody>
                    {historyData?.duration_distribution && (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={Object.entries(historyData.duration_distribution).map(([range, count]) => ({
                          range,
                          count: count as number,
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="range" />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="count" fill="#00C49F" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardBody>
                </Card>
              </SimpleGrid>
            </TabPanel>

            {/* Optimization Insights Tab */}
            <TabPanel p={0} pt={4}>
              <VStack spacing={6} align="stretch">
                {/* Optimization Recommendations */}
                {optimizationData?.recommendations && optimizationData.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <Heading size="md">Optimization Recommendations</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        {optimizationData.recommendations.map((rec: any, index: number) => (
                          <Alert key={index} status={rec.priority === 'high' ? 'warning' : 'info'}>
                            <AlertIcon />
                            <Box flex={1}>
                              <Text fontWeight="bold">{rec.title}</Text>
                              <AlertDescription>{rec.description}</AlertDescription>
                              <HStack mt={2} spacing={2}>
                                <Badge colorScheme={rec.priority === 'high' ? 'red' : rec.priority === 'medium' ? 'yellow' : 'green'}>
                                  {rec.priority}
                                </Badge>
                                <Badge variant="outline">
                                  Impact: {rec.estimated_improvement}%
                                </Badge>
                              </HStack>
                            </Box>
                          </Alert>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>
                )}

                {/* Performance Bottlenecks */}
                {optimizationData?.bottlenecks && (
                  <Card>
                    <CardHeader>
                      <Heading size="md">Performance Bottlenecks</Heading>
                    </CardHeader>
                    <CardBody>
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Component</Th>
                            <Th>Impact Level</Th>
                            <Th>Frequency</Th>
                            <Th>Avg Delay</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {optimizationData.bottlenecks.map((bottleneck: any, index: number) => (
                            <Tr key={index}>
                              <Td>{bottleneck.component}</Td>
                              <Td>
                                <Badge colorScheme={bottleneck.impact_level === 'high' ? 'red' : bottleneck.impact_level === 'medium' ? 'yellow' : 'green'}>
                                  {bottleneck.impact_level}
                                </Badge>
                              </Td>
                              <Td>{bottleneck.frequency}%</Td>
                              <Td>{formatDuration(bottleneck.avg_delay_seconds)}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </CardBody>
                  </Card>
                )}

                {/* Cost Analysis */}
                {optimizationData?.cost_analysis && (
                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                    <Card>
                      <CardHeader>
                        <Heading size="md">Resource Cost Analysis</Heading>
                      </CardHeader>
                      <CardBody>
                        <SimpleGrid columns={2} spacing={4}>
                          <Stat>
                            <StatLabel>Total Cost</StatLabel>
                            <StatNumber>${optimizationData.cost_analysis.total_cost.toFixed(2)}</StatNumber>
                            <StatHelpText>Current period</StatHelpText>
                          </Stat>
                          <Stat>
                            <StatLabel>Cost per Scan</StatLabel>
                            <StatNumber>${optimizationData.cost_analysis.cost_per_scan.toFixed(3)}</StatNumber>
                            <StatHelpText>Average</StatHelpText>
                          </Stat>
                          <Stat>
                            <StatLabel>Potential Savings</StatLabel>
                            <StatNumber color="green.500">
                              ${optimizationData.cost_analysis.potential_savings.toFixed(2)}
                            </StatNumber>
                            <StatHelpText>
                              <StatArrow type="decrease" />
                              With optimization
                            </StatHelpText>
                          </Stat>
                          <Stat>
                            <StatLabel>ROI Timeline</StatLabel>
                            <StatNumber fontSize="sm">
                              {optimizationData.cost_analysis.roi_timeline_months} months
                            </StatNumber>
                            <StatHelpText>Break-even</StatHelpText>
                          </Stat>
                        </SimpleGrid>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader>
                        <Heading size="md">Efficiency Opportunities</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={3} align="stretch">
                          {optimizationData.efficiency_opportunities?.map((opp: any, index: number) => (
                            <Box key={index} p={3} borderWidth={1} borderRadius="md">
                              <Text fontWeight="bold" fontSize="sm">{opp.area}</Text>
                              <Text fontSize="sm" color="gray.600" mt={1}>{opp.description}</Text>
                              <Flex justify="space-between" mt={2}>
                                <Badge colorScheme="blue">
                                  {opp.effort_level} effort
                                </Badge>
                                <Text fontSize="xs" color="green.500">
                                  +{opp.potential_improvement}% improvement
                                </Text>
                              </Flex>
                            </Box>
                          ))}
                        </VStack>
                      </CardBody>
                    </Card>
                  </SimpleGrid>
                )}
              </VStack>
            </TabPanel>

            {/* Predictive Analytics Tab */}
            <TabPanel p={0} pt={4}>
              <VStack spacing={6} align="stretch">
                <Flex justify="space-between" align="center">
                  <Heading size="md">Predictive Analytics & Forecasting</Heading>
                  <HStack>
                    <Text fontSize="sm">Show Predictions:</Text>
                    <Switch 
                      isChecked={showPredictions}
                      onChange={(e) => setShowPredictions(e.target.checked)}
                    />
                  </HStack>
                </Flex>

                {trendData?.forecasts && showPredictions && (
                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                    {/* Volume Forecast */}
                    <Card>
                      <CardHeader>
                        <Heading size="md">Scan Volume Forecast</Heading>
                      </CardHeader>
                      <CardBody>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={trendData.forecasts.volume_forecast?.map((point: any, index: number) => ({
                            period: `Week ${index + 1}`,
                            predicted: point.predicted_value,
                            confidence_upper: point.confidence_interval.upper,
                            confidence_lower: point.confidence_interval.lower,
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <RechartsTooltip />
                            <Area 
                              type="monotone" 
                              dataKey="confidence_upper" 
                              stackId="1"
                              stroke="none" 
                              fill="#3182ce" 
                              fillOpacity={0.1}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="confidence_lower" 
                              stackId="1"
                              stroke="none" 
                              fill="#3182ce" 
                              fillOpacity={0.1}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="predicted" 
                              stroke="#3182ce" 
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardBody>
                    </Card>

                    {/* Performance Forecast */}
                    <Card>
                      <CardHeader>
                        <Heading size="md">Performance Forecast</Heading>
                      </CardHeader>
                      <CardBody>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={trendData.forecasts.performance_forecast?.map((point: any, index: number) => ({
                            period: `Week ${index + 1}`,
                            predicted: point.predicted_value,
                            current_trend: point.current_trend_value,
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <RechartsTooltip />
                            <Line 
                              type="monotone" 
                              dataKey="current_trend" 
                              stroke="#82ca9d" 
                              strokeDasharray="5 5"
                              name="Current Trend"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="predicted" 
                              stroke="#ff7300" 
                              strokeWidth={2}
                              name="Predicted"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardBody>
                    </Card>
                  </SimpleGrid>
                )}

                {/* Predictive Insights */}
                {trendData?.insights && (
                  <Card>
                    <CardHeader>
                      <Heading size="md">Predictive Insights</Heading>
                    </CardHeader>
                    <CardBody>
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                        {trendData.insights.map((insight: any, index: number) => (
                          <Alert key={index} status={insight.severity === 'high' ? 'warning' : 'info'}>
                            <AlertIcon />
                            <Box>
                              <Text fontWeight="bold" fontSize="sm">{insight.title}</Text>
                              <AlertDescription fontSize="sm">{insight.description}</AlertDescription>
                              <Text fontSize="xs" color="gray.500" mt={1}>
                                Confidence: {insight.confidence}%
                              </Text>
                            </Box>
                          </Alert>
                        ))}
                      </SimpleGrid>
                    </CardBody>
                  </Card>
                )}

                {/* Capacity Planning */}
                {optimizationData?.capacity_planning && (
                  <Card>
                    <CardHeader>
                      <Heading size="md">Capacity Planning Recommendations</Heading>
                    </CardHeader>
                    <CardBody>
                      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
                        <Box>
                          <Text fontWeight="bold" mb={2}>Resource Utilization</Text>
                          <VStack spacing={2} align="stretch">
                            <Box>
                              <Flex justify="space-between" mb={1}>
                                <Text fontSize="sm">CPU</Text>
                                <Text fontSize="sm">{optimizationData.capacity_planning.current_utilization.cpu}%</Text>
                              </Flex>
                              <Progress value={optimizationData.capacity_planning.current_utilization.cpu} />
                            </Box>
                            <Box>
                              <Flex justify="space-between" mb={1}>
                                <Text fontSize="sm">Memory</Text>
                                <Text fontSize="sm">{optimizationData.capacity_planning.current_utilization.memory}%</Text>
                              </Flex>
                              <Progress value={optimizationData.capacity_planning.current_utilization.memory} />
                            </Box>
                            <Box>
                              <Flex justify="space-between" mb={1}>
                                <Text fontSize="sm">Storage</Text>
                                <Text fontSize="sm">{optimizationData.capacity_planning.current_utilization.storage}%</Text>
                              </Flex>
                              <Progress value={optimizationData.capacity_planning.current_utilization.storage} />
                            </Box>
                          </VStack>
                        </Box>

                        <Box>
                          <Text fontWeight="bold" mb={2}>Projected Needs</Text>
                          <VStack spacing={2} align="stretch">
                            {optimizationData.capacity_planning.projected_needs.map((need: any, index: number) => (
                              <Box key={index}>
                                <Text fontSize="sm" fontWeight="medium">{need.timeframe}</Text>
                                <Text fontSize="sm" color="gray.600">
                                  {need.resource}: +{need.additional_capacity}%
                                </Text>
                              </Box>
                            ))}
                          </VStack>
                        </Box>

                        <Box>
                          <Text fontWeight="bold" mb={2}>Scaling Recommendations</Text>
                          <VStack spacing={2} align="stretch">
                            {optimizationData.capacity_planning.scaling_recommendations.map((rec: any, index: number) => (
                              <Badge key={index} colorScheme={rec.urgency === 'high' ? 'red' : rec.urgency === 'medium' ? 'yellow' : 'green'}>
                                {rec.action}
                              </Badge>
                            ))}
                          </VStack>
                        </Box>
                      </SimpleGrid>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
} 