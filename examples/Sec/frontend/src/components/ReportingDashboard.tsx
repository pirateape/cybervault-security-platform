import React, { useState, useMemo } from 'react';
import {
  Box,
  Text,
  Button,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Flex,
  Grid,
  GridItem,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useColorModeValue,
  Alert,
  AlertIcon,
  Spinner,
  Card,
  CardHeader,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Divider,
  HStack,
  VStack,
  useToast,
} from '@chakra-ui/react';
import {
  SearchIcon,
  DownloadIcon,
  CalendarIcon,
  SettingsIcon,
  ChevronDownIcon,
} from '@chakra-ui/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export interface ComplianceReport {
  id: string;
  title: string;
  framework: 'NIST' | 'ISO27001' | 'GDPR' | 'SOX' | 'HIPAA';
  status: 'compliant' | 'non-compliant' | 'partial';
  score: number;
  lastUpdated: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  findings: number;
  remediated: number;
  organizationalUnit: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  framework: string[];
  sections: string[];
  format: 'PDF' | 'Excel' | 'CSV';
}

interface ReportingDashboardProps {
  reports?: ComplianceReport[];
  templates?: ReportTemplate[];
  isLoading?: boolean;
  error?: string | null;
  onExportReport?: (reportId: string, format: string) => void;
  onGenerateReport?: (templateId: string, filters: any) => void;
}

const ReportingDashboard: React.FC<ReportingDashboardProps> = ({
  reports = [],
  templates = [],
  isLoading = false,
  error = null,
  onExportReport,
  onGenerateReport,
}) => {
  // Theme colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');
  const [selectedOrgUnit, setSelectedOrgUnit] = useState('all');
  const [dateRange, setDateRange] = useState('30');

  const toast = useToast();

  // Filter options
  const frameworks = ['all', 'NIST', 'ISO27001', 'GDPR', 'SOX', 'HIPAA'];
  const statuses = ['all', 'compliant', 'non-compliant', 'partial'];
  const riskLevels = ['all', 'low', 'medium', 'high', 'critical'];
  const dateRanges = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
    { value: '365', label: 'Last year' },
  ];

  // Get unique organizational units
  const orgUnits = useMemo(() => {
    const units = ['all', ...new Set(reports.map((r) => r.organizationalUnit))];
    return units;
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.framework.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFramework =
        selectedFramework === 'all' || report.framework === selectedFramework;
      const matchesStatus =
        selectedStatus === 'all' || report.status === selectedStatus;
      const matchesRiskLevel =
        selectedRiskLevel === 'all' || report.riskLevel === selectedRiskLevel;
      const matchesOrgUnit =
        selectedOrgUnit === 'all' ||
        report.organizationalUnit === selectedOrgUnit;

      // Date filtering (simplified - in real app would use proper date comparison)
      const reportDate = new Date(report.lastUpdated);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateRange));
      const matchesDate = reportDate >= cutoffDate;

      return (
        matchesSearch &&
        matchesFramework &&
        matchesStatus &&
        matchesRiskLevel &&
        matchesOrgUnit &&
        matchesDate
      );
    });
  }, [
    reports,
    searchTerm,
    selectedFramework,
    selectedStatus,
    selectedRiskLevel,
    selectedOrgUnit,
    dateRange,
  ]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const total = filteredReports.length;
    const compliant = filteredReports.filter(
      (r) => r.status === 'compliant'
    ).length;
    const nonCompliant = filteredReports.filter(
      (r) => r.status === 'non-compliant'
    ).length;
    const partial = filteredReports.filter(
      (r) => r.status === 'partial'
    ).length;
    const avgScore =
      total > 0
        ? Math.round(
            filteredReports.reduce((sum, r) => sum + r.score, 0) / total
          )
        : 0;
    const criticalIssues = filteredReports.filter(
      (r) => r.riskLevel === 'critical'
    ).length;

    return {
      total,
      compliant,
      nonCompliant,
      partial,
      avgScore,
      criticalIssues,
    };
  }, [filteredReports]);

  // Chart data
  const frameworkData = useMemo(() => {
    const data = frameworks.slice(1).map((framework) => {
      const frameworkReports = filteredReports.filter(
        (r) => r.framework === framework
      );
      const avgScore =
        frameworkReports.length > 0
          ? Math.round(
              frameworkReports.reduce((sum, r) => sum + r.score, 0) /
                frameworkReports.length
            )
          : 0;
      return {
        name: framework,
        score: avgScore,
        count: frameworkReports.length,
      };
    });
    return data;
  }, [filteredReports]);

  const statusData = useMemo(() => {
    return [
      { name: 'Compliant', value: summaryStats.compliant, color: '#48BB78' },
      {
        name: 'Non-Compliant',
        value: summaryStats.nonCompliant,
        color: '#F56565',
      },
      { name: 'Partial', value: summaryStats.partial, color: '#ED8936' },
    ];
  }, [summaryStats]);

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'green';
      case 'non-compliant':
        return 'red';
      case 'partial':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'green';
      case 'medium':
        return 'yellow';
      case 'high':
        return 'orange';
      case 'critical':
        return 'red';
      default:
        return 'gray';
    }
  };

  const handleExport = (reportId: string, format: string) => {
    if (onExportReport) {
      onExportReport(reportId, format);
      toast({
        title: 'Export Started',
        description: `Exporting report in ${format} format...`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleGenerateReport = (templateId: string) => {
    if (onGenerateReport) {
      const filters = {
        framework: selectedFramework,
        status: selectedStatus,
        riskLevel: selectedRiskLevel,
        orgUnit: selectedOrgUnit,
        dateRange,
      };
      onGenerateReport(templateId, filters);
      toast({
        title: 'Report Generation Started',
        description: 'Your custom report is being generated...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="400px"
      >
        <Spinner size="xl" color="brand.500" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Text fontSize="2xl" fontWeight="bold" mb={6} color={textColor}>
        Compliance Reporting Dashboard
      </Text>

      {/* Filters Section */}
      <Card mb={6}>
        <CardHeader>
          <Text fontSize="lg" fontWeight="semibold">
            Filters & Search
          </Text>
        </CardHeader>
        <CardBody>
          <Grid
            templateColumns={{
              base: '1fr',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            }}
            gap={4}
            mb={4}
          >
            <GridItem>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </GridItem>

            <GridItem>
              <Select
                value={selectedFramework}
                onChange={(e) => setSelectedFramework(e.target.value)}
              >
                {frameworks.map((framework) => (
                  <option key={framework} value={framework}>
                    {framework === 'all' ? 'All Frameworks' : framework}
                  </option>
                ))}
              </Select>
            </GridItem>

            <GridItem>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all'
                      ? 'All Statuses'
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </Select>
            </GridItem>

            <GridItem>
              <Select
                value={selectedRiskLevel}
                onChange={(e) => setSelectedRiskLevel(e.target.value)}
              >
                {riskLevels.map((risk) => (
                  <option key={risk} value={risk}>
                    {risk === 'all'
                      ? 'All Risk Levels'
                      : risk.charAt(0).toUpperCase() + risk.slice(1)}
                  </option>
                ))}
              </Select>
            </GridItem>
          </Grid>

          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
            <GridItem>
              <Select
                value={selectedOrgUnit}
                onChange={(e) => setSelectedOrgUnit(e.target.value)}
              >
                {orgUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit === 'all' ? 'All Organizational Units' : unit}
                  </option>
                ))}
              </Select>
            </GridItem>

            <GridItem>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                {dateRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </Select>
            </GridItem>
          </Grid>
        </CardBody>
      </Card>

      {/* Summary Statistics */}
      <Card mb={6}>
        <CardHeader>
          <Text fontSize="lg" fontWeight="semibold">
            Summary Statistics
          </Text>
        </CardHeader>
        <CardBody>
          <StatGroup>
            <Stat>
              <StatLabel>Total Reports</StatLabel>
              <StatNumber>{summaryStats.total}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Average Score</StatLabel>
              <StatNumber
                color={
                  summaryStats.avgScore >= 75
                    ? 'green.500'
                    : summaryStats.avgScore >= 50
                    ? 'yellow.500'
                    : 'red.500'
                }
              >
                {summaryStats.avgScore}%
              </StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Compliant</StatLabel>
              <StatNumber color="green.500">
                {summaryStats.compliant}
              </StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Critical Issues</StatLabel>
              <StatNumber color="red.500">
                {summaryStats.criticalIssues}
              </StatNumber>
            </Stat>
          </StatGroup>
        </CardBody>
      </Card>

      {/* Charts Section */}
      <Grid
        templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }}
        gap={6}
        mb={6}
      >
        <GridItem>
          <Card>
            <CardHeader>
              <Text fontSize="lg" fontWeight="semibold">
                Compliance Scores by Framework
              </Text>
            </CardHeader>
            <CardBody>
              <Box position="relative" zIndex={0} minH="260px">
                {frameworkData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={frameworkData}
                      margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fill: textColor }} />
                      <YAxis tick={{ fill: textColor }} />
                      <Tooltip />
                      <Bar
                        dataKey="score"
                        fill="#3182ce"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Text color={mutedTextColor} textAlign="center" mt={8}>
                    No data available
                  </Text>
                )}
              </Box>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem>
          <Card>
            <CardHeader>
              <Text fontSize="lg" fontWeight="semibold">
                Compliance Status Distribution
              </Text>
            </CardHeader>
            <CardBody>
              <Box position="relative" zIndex={0} minH="260px">
                {statusData.some((d) => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {statusData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Text color={mutedTextColor} textAlign="center" mt={8}>
                    No data available
                  </Text>
                )}
              </Box>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Report Templates */}
      {templates.length > 0 && (
        <Card mb={6}>
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="semibold">
                Report Templates
              </Text>
            </Flex>
          </CardHeader>
          <CardBody>
            <Grid
              templateColumns={{
                base: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              }}
              gap={4}
            >
              {templates.map((template) => (
                <Box
                  key={template.id}
                  p={4}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="md"
                  _hover={{ borderColor: 'brand.500' }}
                >
                  <Text fontWeight="semibold" mb={2}>
                    {template.name}
                  </Text>
                  <Text fontSize="sm" color={mutedTextColor} mb={3}>
                    {template.description}
                  </Text>
                  <HStack mb={3}>
                    {template.framework.map((fw) => (
                      <Badge key={fw} size="sm">
                        {fw}
                      </Badge>
                    ))}
                  </HStack>
                  <Button
                    size="sm"
                    colorScheme="brand"
                    onClick={() => handleGenerateReport(template.id)}
                  >
                    Generate Report
                  </Button>
                </Box>
              ))}
            </Grid>
          </CardBody>
        </Card>
      )}

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Text fontSize="lg" fontWeight="semibold">
              Compliance Reports ({filteredReports.length})
            </Text>
            <Button leftIcon={<DownloadIcon />} size="sm">
              Export All
            </Button>
          </Flex>
        </CardHeader>
        <CardBody>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Report Title</Th>
                  <Th>Framework</Th>
                  <Th>Status</Th>
                  <Th>Score</Th>
                  <Th>Risk Level</Th>
                  <Th>Last Updated</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredReports.map((report) => (
                  <Tr key={report.id}>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">{report.title}</Text>
                        <Text fontSize="sm" color={mutedTextColor}>
                          {report.organizationalUnit}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Badge>{report.framework}</Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Text
                        color={
                          report.score >= 75
                            ? 'green.500'
                            : report.score >= 50
                            ? 'yellow.500'
                            : 'red.500'
                        }
                      >
                        {report.score}%
                      </Text>
                    </Td>
                    <Td>
                      <Badge colorScheme={getRiskColor(report.riskLevel)}>
                        {report.riskLevel}
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontSize="sm">
                        {new Date(report.lastUpdated).toLocaleDateString()}
                      </Text>
                    </Td>
                    <Td>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<ChevronDownIcon />}
                          variant="ghost"
                          size="sm"
                        />
                        <MenuList>
                          <MenuItem
                            onClick={() => handleExport(report.id, 'PDF')}
                          >
                            Export as PDF
                          </MenuItem>
                          <MenuItem
                            onClick={() => handleExport(report.id, 'Excel')}
                          >
                            Export as Excel
                          </MenuItem>
                          <MenuItem
                            onClick={() => handleExport(report.id, 'CSV')}
                          >
                            Export as CSV
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>
    </Box>
  );
};

export default ReportingDashboard;
