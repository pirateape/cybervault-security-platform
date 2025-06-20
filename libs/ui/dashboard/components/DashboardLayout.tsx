import * as React from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Sidebar } from './Sidebar';
import { WidgetContainer } from './WidgetContainer';
import type { DashboardWidget } from '../types/widget';
import { useRequireRole } from '../../../hooks/authProvider';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Box, Button, Spinner, Link, Icon, useDisclosure } from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import { WidgetLibraryPanel } from './WidgetLibraryPanel';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Enhanced AccessDenied component with better accessibility
function AccessDenied() {
  return (
    <Box
      as="main"
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center justify-center h-full p-8 text-center"
    >
      <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
      <p className="text-zinc-700 dark:text-zinc-300">
        You do not have permission to view this dashboard.
      </p>
      <Link href="/" mt={4}>
        <Button
          colorScheme="blue"
          aria-label="Return to home page"
        >
          Return to Home
        </Button>
      </Link>
    </Box>
  );
}

interface DashboardLayoutProps {
  children?: React.ReactNode;
  sidebarContent?: React.ReactNode;
  onLayoutChange?: (layout: any) => void;
  tenantBranding?: React.ReactNode;
  onAddWidget?: (type: string) => void;
  isLoading?: boolean;
  error?: Error | null;
  layout: any[];
}

const allowedRoles = ['security_team', 'admin', 'compliance_officer'];

export function DashboardLayout({
  children,
  sidebarContent,
  onLayoutChange,
  tenantBranding,
  onAddWidget,
  isLoading,
  error,
  layout,
}: DashboardLayoutProps) {
  const hasAccess = useRequireRole(allowedRoles);
  const [libraryOpen, setLibraryOpen] = React.useState(false);

  if (!hasAccess) return <AccessDenied />;

  const handleAddWidgetClick = (type: string) => {
    if (onAddWidget) {
      onAddWidget(type);
    }
    setLibraryOpen(false);
  };

  return (
    <Box 
      as="main" 
      minH="100vh" 
      bg="bg.DEFAULT" 
      color="fg.DEFAULT" 
      role="main" 
      aria-label="Dashboard main area" 
      display="flex" 
      flexDirection={{ base: 'column', lg: 'row' }}
    >
      <Sidebar tenantBranding={tenantBranding}>{sidebarContent}</Sidebar>
      <Box 
        as="section" 
        flex="1" 
        display="flex" 
        flexDirection="column" 
        gap={6} 
        p={{ base: 4, md: 6, lg: 8 }}
        aria-live="polite"
      >
        {onAddWidget && (
          <WidgetLibraryPanel 
            isOpen={libraryOpen} 
            onClose={() => setLibraryOpen(false)} 
            onAddWidget={handleAddWidgetClick} 
          />
        )}
        <Box 
          mb={4} 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center"
          flexWrap="wrap"
          gap={4}
        >
          {onAddWidget && (
            <Button
              colorScheme="brand"
              onClick={() => setLibraryOpen(true)}
              aria-label="Add Widget"
            >
              <Icon as={FiPlus} mr={2} />
              Add Widget
            </Button>
          )}
          {isLoading && (
            <Box display="flex" alignItems="center" gap={2}>
              <Spinner size="sm" />
              <span>Loading dashboard...</span>
            </Box>
          )}
        </Box>
        
        {error ? (
          <Box
            role="alert"
            p={4}
            bg="red.50"
            color="red.900"
            borderRadius="md"
            borderLeft="4px"
            borderColor="red.500"
          >
            <strong>Error loading dashboard:</strong> {error.message}
          </Box>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 3, md: 2, sm: 1, xs: 1, xxs: 1 }}
            rowHeight={120}
            isResizable
            isDraggable
            onLayoutChange={onLayoutChange}
            style={{ width: '100%' }}
            margin={[16, 16]}
            containerPadding={[16, 16]}
          >
            {children}
          </ResponsiveGridLayout>
        )}
      </Box>
    </Box>
  );
}
