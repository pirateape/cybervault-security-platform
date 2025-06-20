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
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Progress,
  Spinner,
  useColorModeValue,
  Flex,
  IconButton,
  Tooltip,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  List,
  ListItem,
  ListIcon,
  useToast,
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
import type {
  AIFeedbackPanelProps,
  AIInsight,
  AIAnalysisSession,
  RemediationSuggestion,
} from '../types/phase2';
import { useAIFeedback } from '../api/analysisApi';
import type {
  AIFeedbackRequest,
  AIFeedbackResponse,
  APIError,
} from '../api/analysisApi';
import { useAuth } from '../context/AuthContext';

interface AIFeedbackPanelPropsFixed {
  code: string;
  language: string;
}

const AIFeedbackPanel: React.FC<AIFeedbackPanelPropsFixed> = ({
  code,
  language,
}) => {
  const { user } = useAuth();
  const toast = useToast();
  const aiFeedback = useAIFeedback();
  const [feedback, setFeedback] = useState<AIFeedbackResponse['feedback']>([]);

  const handleGetFeedback = useCallback(() => {
    if (!user) {
      toast({
        status: 'error',
        title: 'Not Authenticated',
        description: 'You must be logged in to get AI feedback.',
      });
      return;
    }
    const req: AIFeedbackRequest = {
      code,
      language,
      org_id: user.org_id,
      user_id: user.id,
      metadata: {},
    };
    aiFeedback.mutate(req, {
      onSuccess: (data) => {
        if ('feedback' in data && data.success) {
          setFeedback(data.feedback);
          toast({
            status: 'success',
            title: 'AI Feedback Received',
            description: data.summary,
          });
        } else if ('error' in data) {
          toast({
            status: 'error',
            title: 'AI Feedback Error',
            description: data.error.message,
          });
        }
      },
      onError: (err) => {
        toast({
          status: 'error',
          title: 'Network Error',
          description: err.message,
        });
      },
    });
  }, [code, language, user, aiFeedback, toast]);

  return (
    <div aria-busy={aiFeedback.isPending} aria-live="polite">
      <button
        onClick={handleGetFeedback}
        aria-label="Get AI Feedback"
        disabled={aiFeedback.isPending}
      >
        Get AI Feedback
      </button>
      {aiFeedback.isPending && <Skeleton height="20px" mt={2} />}
      {/* Display feedback results here */}
      {feedback.length > 0 && (
        <ul>
          {feedback.map((item, idx) => (
            <li key={idx}>
              <strong>Suggestion:</strong> {item.suggestion}
              <br />
              <strong>Explanation:</strong> {item.explanation}
              <br />
              <strong>Confidence:</strong> {item.confidence}
              <br />
              <strong>Line:</strong> {item.line}, <strong>Column:</strong>{' '}
              {item.column}
            </li>
          ))}
        </ul>
      )}
      {/* Accessibility: ARIA, keyboard, screen reader support */}
    </div>
  );
};

export default AIFeedbackPanel;
