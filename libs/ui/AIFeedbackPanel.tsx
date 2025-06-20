import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Accordion,
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  AccordionRoot,
  ProgressRoot,
  ProgressValueText,
  ProgressTrack,
  Spinner,
  Flex,
  IconButton,
  Tooltip,
  Select,
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  Input,
  InputGroup,
  InputElement,
  Separator,
  AlertRoot,
  AlertIndicator,
  Code,
  List,
  ListItem,
  createToaster,
  Skeleton,
} from '@chakra-ui/react';
import {
  FiAlertTriangle,
  FiShield,
  FiTrendingUp,
  FiCheckCircle,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiDownload,
  FiEye,
  FiCode,
  FiArrowRight,
} from 'react-icons/fi';

export interface AIInsight {
  id: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface RemediationSuggestion {
  id: string;
  message: string;
  confidence: number;
}

export interface AIFeedbackPanelProps {
  code: string;
  language: string;
  insights?: AIInsight[];
  suggestions?: RemediationSuggestion[];
  isLoading?: boolean;
  error?: string | null;
  onRequestFeedback?: (code: string, language: string) => void;
}

const severityColors: Record<AIInsight['severity'], string> = {
  info: 'blue.500',
  warning: 'yellow.500',
  critical: 'red.500',
};

const AIFeedbackPanel: React.FC<AIFeedbackPanelProps> = ({
  code,
  language,
  insights = [],
  suggestions = [],
  isLoading = false,
  error = null,
  onRequestFeedback,
}) => {
  const toaster = createToaster({
    placement: 'top',
  });

  const handleRequestFeedback = () => {
    if (onRequestFeedback) {
      onRequestFeedback(code, language);
    }
  };

  if (isLoading) {
    return (
      <Box position="relative" zIndex={0}>
        <Spinner size="xl" color="blue.500" />
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

  return (
    <Box
      bg={{ base: 'white', _dark: 'gray.800' }}
      borderRadius="lg"
      borderWidth={1}
      borderColor={{ base: 'gray.200', _dark: 'gray.600' }}
      p={4}
      boxShadow="md"
    >
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        AI Feedback Panel
      </Text>
      <Button colorScheme="blue" onClick={handleRequestFeedback} mb={4}>
        <FiArrowRight />
        Request AI Feedback
      </Button>
      <Separator my={4} />
      <VStack align="stretch" gap={4}>
        <Box>
          <Text fontWeight="semibold" mb={2}>
            Insights
          </Text>
          {insights.length === 0 ? (
            <Text color="gray.500">No insights available.</Text>
          ) : (
            <VStack align="stretch" gap={2}>
              {insights.map((insight) => (
                <Box
                  key={insight.id}
                  p={3}
                  borderRadius="md"
                  bg={severityColors[insight.severity]}
                  color="white"
                >
                  <Text fontWeight="medium">{insight.type}</Text>
                  <Text>{insight.message}</Text>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
        <Box>
          <Text fontWeight="semibold" mb={2}>
            Remediation Suggestions
          </Text>
          {suggestions.length === 0 ? (
            <Text color="gray.500">No suggestions available.</Text>
          ) : (
            <VStack align="stretch" gap={2}>
              {suggestions.map((suggestion) => (
                <Box key={suggestion.id} p={3} borderRadius="md" bg="gray.100">
                  <Text>{suggestion.message}</Text>
                  <ProgressRoot
                    value={suggestion.confidence}
                    size="xs"
                    colorPalette="blue"
                    mt={2}
                  >
                    <ProgressTrack />
                  </ProgressRoot>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default AIFeedbackPanel;
