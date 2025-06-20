import React from 'react';
import {
  Box,
  Text,
  StatRoot,
  StatLabel,
  StatValueText,
  StatHelpText,
  StatUpIndicator,
  StatDownIndicator,
  Progress,
  Badge,
  Spinner,
  AlertRoot,
  AlertIndicator,
  Flex,
  ProgressCircleRoot,
  ProgressCircleValueText,
} from '@chakra-ui/react';

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
  [framework: string]: number;
}

export interface ComplianceScoreWidgetProps {
  score?: ComplianceScore;
  metrics?: ComplianceMetrics;
  isLoading?: boolean;
  error?: string | null;
  showDetailedMetrics?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'detailed' | 'compact';
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
  // In Chakra UI v3, use _dark pseudo-prop for dark mode styles

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'green.500';
    if (score >= 75) return 'yellow.500';
    if (score >= 60) return 'orange.500';
    return 'red.500';
  };

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
        <AlertRoot status="error" borderRadius="md">
          <AlertIndicator />
          <Text>{error}</Text>
        </AlertRoot>
      </Box>
    );
  }

  if (!score && !metrics) {
    return (
      <Box position="relative" zIndex={0}>
        <AlertRoot status="info" borderRadius="md">
          <AlertIndicator />
          <Text>No compliance data available.</Text>
        </AlertRoot>
      </Box>
    );
  }

  const renderCompactView = () => (
    <Box position="relative" zIndex={0}>
      <Flex align="center" justify="space-between">
        <Text fontSize="lg" fontWeight="bold" mb={4}>
          Compliance Dashboard
        </Text>
        {/* Overall Score */}
        {score && (
          <Box mb={6}>
            <Flex align="center" justify="space-between" mb={2}>
              <Text fontSize={config.fontSize} fontWeight="semibold">
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
              <ProgressCircleRoot value={score.overall} size="lg" mr={4}>
                <ProgressCircleValueText>
                  {score.overall}%
                </ProgressCircleValueText>
              </ProgressCircleRoot>
              <Box flex={1}>
                <Text
                  fontSize="sm"
                  color="gray.600"
                  _dark={{ color: 'gray.400' }}
                  mb={1}
                >
                  Last updated:{' '}
                  {score.lastUpdated
                    ? new Date(score.lastUpdated).toLocaleDateString()
                    : 'N/A'}
                </Text>
                {score.trend && score.trend !== 'stable' && (
                  <StatRoot>
                    <StatHelpText>
                      {score.trend === 'up' ? (
                        <StatUpIndicator />
                      ) : score.trend === 'down' ? (
                        <StatDownIndicator />
                      ) : null}
                      <Text
                        as="span"
                        fontSize="sm"
                        color={{ base: 'gray.600', _dark: 'gray.400' }}
                        ml={1}
                      >
                        {score.trendValue}% from last week
                      </Text>
                    </StatHelpText>
                  </StatRoot>
                )}
              </Box>
            </Flex>
          </Box>
        )}
      </Flex>
    </Box>
  );

  // Detailed view can be expanded as needed
  return (
    <Box
      bg={{ base: 'white', _dark: 'gray.800' }}
      borderRadius="lg"
      borderWidth={1}
      borderColor={{ base: 'gray.200', _dark: 'gray.600' }}
      p={config.padding}
      boxShadow="md"
    >
      {variant === 'compact' ? (
        renderCompactView()
      ) : (
        <>
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            Compliance Dashboard
          </Text>
          {score && (
            <Box mb={6}>
              <Flex align="center" justify="space-between" mb={2}>
                <Text fontSize={config.fontSize} fontWeight="semibold">
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
                <ProgressCircleRoot value={score.overall} size="lg" mr={4}>
                  <ProgressCircleValueText>
                    {score.overall}%
                  </ProgressCircleValueText>
                </ProgressCircleRoot>
                <Box flex={1}>
                  <Text
                    fontSize="sm"
                    color="gray.600"
                    _dark={{ color: 'gray.400' }}
                    mb={1}
                  >
                    Last updated:{' '}
                    {score.lastUpdated
                      ? new Date(score.lastUpdated).toLocaleDateString()
                      : 'N/A'}
                  </Text>
                  {score.trend && score.trend !== 'stable' && (
                    <StatRoot>
                      <StatHelpText>
                        {score.trend === 'up' ? (
                          <StatUpIndicator />
                        ) : score.trend === 'down' ? (
                          <StatDownIndicator />
                        ) : null}
                        <Text
                          as="span"
                          fontSize="sm"
                          color={{ base: 'gray.600', _dark: 'gray.400' }}
                          ml={1}
                        >
                          {score.trendValue}% from last week
                        </Text>
                      </StatHelpText>
                    </StatRoot>
                  )}
                </Box>
              </Flex>
            </Box>
          )}
          {/* Detailed metrics can be added here */}
        </>
      )}
    </Box>
  );
};

export default ComplianceScoreWidget;
