import React from 'react';
import {
  Box,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  Grid,
  GridItem,
  Icon,
  Flex,
  CircularProgress,
  CircularProgressLabel,
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, InfoIcon } from '@chakra-ui/icons';

export interface ComplianceScore {
  overall: number;
  nist: number;
  iso27001: number;
  gdpr: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  lastUpdated: string;
}

export interface ComplianceMetrics {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  criticalIssues: number;
  highRiskIssues: number;
  mediumRiskIssues: number;
  lowRiskIssues: number;
}

interface ComplianceScoreWidgetProps {
  score?: ComplianceScore;
  metrics?: ComplianceMetrics;
  isLoading?: boolean;
  error?: string | null;
  showDetailedMetrics?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'compact' | 'detailed';
}

const ComplianceScoreWidget: React.FC<ComplianceScoreWidgetProps> = ({
  score,
  metrics,
  isLoading = false,
  error = null,
  showDetailedMetrics = true,
  size = 'md',
  variant = 'detailed',
}) => {
  // Theme colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');

  // Score color mapping
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'green.500';
    if (score >= 75) return 'yellow.500';
    if (score >= 60) return 'orange.500';
    return 'red.500';
  };

  // Risk level colors
  const riskColors = {
    critical: 'red.500',
    high: 'orange.500',
    medium: 'yellow.500',
    low: 'green.500',
  };

  // Size configurations
  const sizeConfig = {
    sm: { padding: 3, fontSize: 'sm', statSize: 'sm' },
    md: { padding: 4, fontSize: 'md', statSize: 'md' },
    lg: { padding: 6, fontSize: 'lg', statSize: 'lg' },
  };

  const config = sizeConfig[size];

  if (isLoading) {
    return (
      <Box position="relative" zIndex={0}>
        <Spinner size="xl" color="brand.500" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box position="relative" zIndex={0}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  if (!score && !metrics) {
    return (
      <Box position="relative" zIndex={0}>
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          No compliance data available.
        </Alert>
      </Box>
    );
  }

  const renderCompactView = () => (
    <Box position="relative" zIndex={0}>
      <Flex align="center" justify="space-between">
        <Text fontSize="lg" fontWeight="bold" mb={4} color={textColor}>
          Compliance Dashboard
        </Text>
        {/* Overall Score */}
        {score && (
          <Box mb={6}>
            <Flex align="center" justify="space-between" mb={2}>
              <Text
                fontSize={config.fontSize}
                fontWeight="semibold"
                color={textColor}
              >
                Overall Compliance Score
              </Text>
              <Badge
                colorScheme={
                  score.overall >= 75
                    ? 'green'
                    : score.overall >= 50
                    ? 'yellow'
                    : 'red'
                }
              >
                {score.overall >= 75
                  ? 'Good'
                  : score.overall >= 50
                  ? 'Fair'
                  : 'Poor'}
              </Badge>
            </Flex>
            <Flex align="center" mb={3}>
              <CircularProgress
                value={score.overall}
                color={getScoreColor(score.overall)}
                size="80px"
                thickness="8px"
                mr={4}
              >
                <CircularProgressLabel fontSize="lg" fontWeight="bold">
                  {score.overall}%
                </CircularProgressLabel>
              </CircularProgress>
              <Box flex={1}>
                <Text fontSize="sm" color={mutedTextColor} mb={1}>
                  Last updated:{' '}
                  {new Date(score.lastUpdated).toLocaleDateString()}
                </Text>
                {score.trend && (
                  <Stat>
                    <StatHelpText>
                      <StatArrow
                        type={
                          score.trend === 'up'
                            ? 'increase'
                            : score.trend === 'down'
                            ? 'decrease'
                            : undefined
                        }
                      />
                      <Text
                        as="span"
                        fontSize="sm"
                        color={mutedTextColor}
                        ml={1}
                      >
                        {score.trendValue}% from last week
                      </Text>
                    </StatHelpText>
                  </Stat>
                )}
              </Box>
            </Flex>
            {/* Framework Scores */}
            <Grid templateColumns="repeat(3, 1fr)" gap={3} mt={4}>
              <GridItem>
                <Stat size={config.statSize}>
                  <StatLabel fontSize="xs">NIST SP 800-53</StatLabel>
                  <StatNumber fontSize="md" color={getScoreColor(score.nist)}>
                    {score.nist}%
                  </StatNumber>
                </Stat>
              </GridItem>
              <GridItem>
                <Stat size={config.statSize}>
                  <StatLabel fontSize="xs">ISO 27001</StatLabel>
                  <StatNumber
                    fontSize="md"
                    color={getScoreColor(score.iso27001)}
                  >
                    {score.iso27001}%
                  </StatNumber>
                </Stat>
              </GridItem>
              <GridItem>
                <Stat size={config.statSize}>
                  <StatLabel fontSize="xs">GDPR</StatLabel>
                  <StatNumber fontSize="md" color={getScoreColor(score.gdpr)}>
                    {score.gdpr}%
                  </StatNumber>
                </Stat>
              </GridItem>
            </Grid>
          </Box>
        )}
        {/* Detailed Metrics */}
        {metrics && showDetailedMetrics && (
          <Box>
            <Text
              fontSize={config.fontSize}
              fontWeight="semibold"
              mb={3}
              color={textColor}
            >
              Compliance Metrics
            </Text>
            {/* Pass/Fail Overview */}
            <Box mb={4}>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="sm" color={textColor}>
                  Checks Passed
                </Text>
                <Text fontSize="sm" fontWeight="bold" color="green.500">
                  {metrics.passedChecks} / {metrics.totalChecks}
                </Text>
              </Flex>
              <Progress
                value={(metrics.passedChecks / metrics.totalChecks) * 100}
                colorScheme="green"
                size="sm"
                borderRadius="md"
              />
            </Box>
            {/* Risk Breakdown */}
            <Grid templateColumns="repeat(2, 1fr)" gap={3}>
              <GridItem>
                <Flex
                  align="center"
                  justify="space-between"
                  p={2}
                  bg="red.50"
                  borderRadius="md"
                >
                  <Flex align="center">
                    <Icon as={WarningIcon} color="red.500" mr={2} />
                    <Text fontSize="sm" color="red.700">
                      Critical
                    </Text>
                  </Flex>
                  <Badge colorScheme="red">{metrics.criticalIssues}</Badge>
                </Flex>
              </GridItem>
              <GridItem>
                <Flex
                  align="center"
                  justify="space-between"
                  p={2}
                  bg="orange.50"
                  borderRadius="md"
                >
                  <Flex align="center">
                    <Icon as={WarningIcon} color="orange.500" mr={2} />
                    <Text fontSize="sm" color="orange.700">
                      High
                    </Text>
                  </Flex>
                  <Badge colorScheme="orange">{metrics.highRiskIssues}</Badge>
                </Flex>
              </GridItem>
              <GridItem>
                <Flex
                  align="center"
                  justify="space-between"
                  p={2}
                  bg="yellow.50"
                  borderRadius="md"
                >
                  <Flex align="center">
                    <Icon as={InfoIcon} color="yellow.500" mr={2} />
                    <Text fontSize="sm" color="yellow.700">
                      Medium
                    </Text>
                  </Flex>
                  <Badge colorScheme="yellow">{metrics.mediumRiskIssues}</Badge>
                </Flex>
              </GridItem>
              <GridItem>
                <Flex
                  align="center"
                  justify="space-between"
                  p={2}
                  bg="green.50"
                  borderRadius="md"
                >
                  <Flex align="center">
                    <Icon as={CheckCircleIcon} color="green.500" mr={2} />
                    <Text fontSize="sm" color="green.700">
                      Low
                    </Text>
                  </Flex>
                  <Badge colorScheme="green">{metrics.lowRiskIssues}</Badge>
                </Flex>
              </GridItem>
            </Grid>
          </Box>
        )}
      </Flex>
    </Box>
  );

  // Detailed view for compliance dashboard
  const renderDetailedView = () => (
    <Box
      position="relative"
      zIndex={0}
      p={config.padding}
      bg={bgColor}
      borderRadius="lg"
      boxShadow="md"
      border="1px solid"
      borderColor={borderColor}
    >
      <Text fontSize="xl" fontWeight="bold" mb={4} color={textColor}>
        Compliance Dashboard (Detailed)
      </Text>
      {/* Overall Score and Trend */}
      {score && (
        <Box mb={6}>
          <Flex align="center" justify="space-between" mb={2}>
            <Text
              fontSize={config.fontSize}
              fontWeight="semibold"
              color={textColor}
            >
              Overall Compliance Score
            </Text>
            <Badge
              colorScheme={
                score.overall >= 75
                  ? 'green'
                  : score.overall >= 50
                  ? 'yellow'
                  : 'red'
              }
            >
              {score.overall >= 75
                ? 'Good'
                : score.overall >= 50
                ? 'Fair'
                : 'Poor'}
            </Badge>
          </Flex>
          <Flex align="center" mb={3}>
            <CircularProgress
              value={score.overall}
              color={getScoreColor(score.overall)}
              size="100px"
              thickness="10px"
              mr={6}
            >
              <CircularProgressLabel fontSize="xl" fontWeight="bold">
                {score.overall}%
              </CircularProgressLabel>
            </CircularProgress>
            <Box flex={1}>
              <Text fontSize="sm" color={mutedTextColor} mb={1}>
                Last updated: {new Date(score.lastUpdated).toLocaleDateString()}
              </Text>
              {score.trend && (
                <Stat>
                  <StatHelpText>
                    <StatArrow
                      type={
                        score.trend === 'up'
                          ? 'increase'
                          : score.trend === 'down'
                          ? 'decrease'
                          : undefined
                      }
                    />
                    <Text as="span" fontSize="sm" color={mutedTextColor} ml={1}>
                      {score.trendValue}% from last week
                    </Text>
                  </StatHelpText>
                </Stat>
              )}
            </Box>
          </Flex>
          {/* Framework Scores */}
          <Grid templateColumns="repeat(3, 1fr)" gap={3} mt={4}>
            <GridItem>
              <Stat size={config.statSize}>
                <StatLabel fontSize="xs">NIST SP 800-53</StatLabel>
                <StatNumber fontSize="lg" color={getScoreColor(score.nist)}>
                  {score.nist}%
                </StatNumber>
              </Stat>
            </GridItem>
            <GridItem>
              <Stat size={config.statSize}>
                <StatLabel fontSize="xs">ISO 27001</StatLabel>
                <StatNumber fontSize="lg" color={getScoreColor(score.iso27001)}>
                  {score.iso27001}%
                </StatNumber>
              </Stat>
            </GridItem>
            <GridItem>
              <Stat size={config.statSize}>
                <StatLabel fontSize="xs">GDPR</StatLabel>
                <StatNumber fontSize="lg" color={getScoreColor(score.gdpr)}>
                  {score.gdpr}%
                </StatNumber>
              </Stat>
            </GridItem>
          </Grid>
        </Box>
      )}
      {/* Compliance Metrics and Risk Breakdown */}
      {metrics && (
        <Box>
          <Text
            fontSize={config.fontSize}
            fontWeight="semibold"
            mb={3}
            color={textColor}
          >
            Compliance Metrics
          </Text>
          {/* Pass/Fail Overview */}
          <Box mb={4}>
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontSize="sm" color={textColor}>
                Checks Passed
              </Text>
              <Text fontSize="sm" fontWeight="bold" color="green.500">
                {metrics.passedChecks} / {metrics.totalChecks}
              </Text>
            </Flex>
            <Progress
              value={(metrics.passedChecks / metrics.totalChecks) * 100}
              colorScheme="green"
              size="md"
              borderRadius="md"
            />
          </Box>
          {/* Risk Breakdown */}
          <Grid templateColumns="repeat(4, 1fr)" gap={3} mb={4}>
            <GridItem>
              <Flex
                align="center"
                justify="space-between"
                p={2}
                bg="red.50"
                borderRadius="md"
              >
                <Flex align="center">
                  <Icon as={WarningIcon} color="red.500" mr={2} />
                  <Text fontSize="sm" color="red.700">
                    Critical
                  </Text>
                </Flex>
                <Badge colorScheme="red">{metrics.criticalIssues}</Badge>
              </Flex>
            </GridItem>
            <GridItem>
              <Flex
                align="center"
                justify="space-between"
                p={2}
                bg="orange.50"
                borderRadius="md"
              >
                <Flex align="center">
                  <Icon as={WarningIcon} color="orange.500" mr={2} />
                  <Text fontSize="sm" color="orange.700">
                    High
                  </Text>
                </Flex>
                <Badge colorScheme="orange">{metrics.highRiskIssues}</Badge>
              </Flex>
            </GridItem>
            <GridItem>
              <Flex
                align="center"
                justify="space-between"
                p={2}
                bg="yellow.50"
                borderRadius="md"
              >
                <Flex align="center">
                  <Icon as={InfoIcon} color="yellow.500" mr={2} />
                  <Text fontSize="sm" color="yellow.700">
                    Medium
                  </Text>
                </Flex>
                <Badge colorScheme="yellow">{metrics.mediumRiskIssues}</Badge>
              </Flex>
            </GridItem>
            <GridItem>
              <Flex
                align="center"
                justify="space-between"
                p={2}
                bg="green.50"
                borderRadius="md"
              >
                <Flex align="center">
                  <Icon as={CheckCircleIcon} color="green.500" mr={2} />
                  <Text fontSize="sm" color="green.700">
                    Low
                  </Text>
                </Flex>
                <Badge colorScheme="green">{metrics.lowRiskIssues}</Badge>
              </Flex>
            </GridItem>
          </Grid>
          {/* Drill-down/Actionable Alerts Placeholder */}
          <Box mt={4}>
            <Text fontSize="md" fontWeight="semibold" mb={2} color={textColor}>
              Actionable Alerts & Drill-Down
            </Text>
            <Alert status="warning" borderRadius="md" mb={2}>
              <AlertIcon />
              Click on a flagged issue for remediation steps (feature coming
              soon).
            </Alert>
          </Box>
        </Box>
      )}
    </Box>
  );

  return variant === 'compact' ? renderCompactView() : renderDetailedView();
};

export default ComplianceScoreWidget;
