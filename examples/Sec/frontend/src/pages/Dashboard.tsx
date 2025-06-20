import {
  Box,
  Heading,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  Center,
  VStack,
  Image,
  Select,
} from '@chakra-ui/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { triggerScan } from '../api/scanApi';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  FormControl,
  FormLabel,
  useToast,
  useDisclosure,
} from '@chakra-ui/react';
import ResultsTable from '../components/ResultsTable';
import MetadataEditor from '../components/MetadataEditor';
import { InfoOutlineIcon } from '@chakra-ui/icons';
import ScanTriggerModal from '../components/ScanTriggerModal';
import { Tooltip, AlertTitle, AlertDescription } from '@chakra-ui/react';
import type { ScanResult } from '../types';
import DashboardLayoutProvider, {
  useDashboardLayout,
} from '../components/DashboardLayoutProvider';
import { mockDashboardData } from '../utils/mockData';

// Scan Trigger Modal Component (extracted for reusability)
// (This block is a leftover/incomplete fragment and has been removed)

// Main Dashboard Content (wrapped by DashboardLayoutProvider)
function DashboardContent() {
  const { currentLayout, userRole } = useDashboardLayout();

  return (
    <Box>
      {/* Header with role information */}
      <Box
        mb={6}
        p={4}
        bg="white"
        borderRadius="lg"
        border="1px solid"
        borderColor="gray.200"
      >
        <Heading size="lg" mb={2}>
          Security Compliance Dashboard
        </Heading>
        <Text color="gray.600">
          Welcome to your {userRole?.replace('_', ' ')} dashboard.
          {currentLayout &&
            ` This layout is optimized for ${currentLayout.role.replace(
              '_',
              ' '
            )} workflows.`}
        </Text>

        <Alert status="info" mt={4} borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Phase 1 Implementation Complete!</AlertTitle>
            <AlertDescription fontSize="sm">
              You're now viewing the new role-based dashboard with enhanced
              visualizations. The layout adapts based on your user role to show
              the most relevant information.
            </AlertDescription>
          </Box>
        </Alert>
      </Box>

      {/* The DashboardLayoutProvider will render the appropriate components based on user role */}
      {/* Components are automatically rendered by the provider based on the layout configuration */}
    </Box>
  );
}

// Main Dashboard Component
function Dashboard() {
  const { user, loading: authLoading } = useAuth();

  // Show loading state while authentication is being determined
  if (authLoading) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" />
          <Text>Loading dashboard...</Text>
        </VStack>
      </Center>
    );
  }

  // Show error if user is not authenticated
  if (!user) {
    return (
      <Center h="100vh">
        <Alert status="error" maxW="md" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              Please log in to access the dashboard.
            </AlertDescription>
          </Box>
        </Alert>
      </Center>
    );
  }

  return (
    <DashboardLayoutProvider mockData={mockDashboardData}>
      <DashboardContent />
    </DashboardLayoutProvider>
  );
}

export default Dashboard;
