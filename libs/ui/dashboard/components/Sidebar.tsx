import * as React from 'react';
import { cn } from '../utils/cn';
import { Box, Text } from '@chakra-ui/react';
import { Button, IconButton } from '../../primitives';
// Import Radix UI primitives for accessibility
// import * as Switch from '@radix-ui/react-switch';

interface SidebarProps {
  children?: React.ReactNode;
  className?: string;
  tenantBranding?: React.ReactNode;
}

export function Sidebar({ children, className, tenantBranding }: SidebarProps) {
  // Collapsible state for mobile
  const [collapsed, setCollapsed] = React.useState(false);
  // Dark mode toggle (simple, replace with Radix Switch for production)
  const [dark, setDark] = React.useState(false);
  React.useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  return (
    <Box as="aside" position="fixed" left={0} top={0} h="100vh" w={{ base: '16', md: '64' }} bg="bg.DEFAULT" borderRightWidth={1} borderColor="border.DEFAULT" zIndex={40} display="flex" flexDirection="column" transition="all 0.3s" boxShadow="xl" aria-label="Sidebar navigation">
      {/* Branding/logo */}
      <Box display="flex" alignItems="center" justifyContent="space-between" px={4} py={5} borderBottomWidth={1} borderColor="border.DEFAULT">
        {tenantBranding ? (
          <Box>{tenantBranding}</Box>
        ) : (
          <Text fontWeight="extrabold" fontSize="xl" letterSpacing="tight" color="brand.solid">
            SecComp
          </Text>
        )}
        <IconButton
          icon={collapsed ? '→' : '←'}
          ariaLabel={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed((c) => !c)}
          className="md:hidden"
        />
      </Box>
      {/* User avatar and quick actions */}
      <div className="flex items-center px-4 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center text-white font-bold mr-3">
          A
        </div>
        <div className="flex-1">
          <div className="font-semibold text-zinc-900 dark:text-white">
            Alex Admin
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Admin</div>
        </div>
        <IconButton
          icon={dark ? '🌙' : '☀️'}
          ariaLabel="Toggle dark mode"
          variant="ghost"
          size="sm"
          onClick={() => setDark((d) => !d)}
          className="ml-2"
        />
      </div>
      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
        <a href="#" className="block w-full text-left px-3 py-2 rounded-lg font-medium text-zinc-700 dark:text-zinc-200 hover:bg-blue-100 dark:hover:bg-blue-900 transition">
          Dashboard
        </a>
        <a href="#" className="block w-full text-left px-3 py-2 rounded-lg font-medium text-zinc-700 dark:text-zinc-200 hover:bg-blue-100 dark:hover:bg-blue-900 transition">
          Reports
        </a>
        <a href="#" className="block w-full text-left px-3 py-2 rounded-lg font-medium text-zinc-700 dark:text-zinc-200 hover:bg-blue-100 dark:hover:bg-blue-900 transition">
          Settings
        </a>
        <a href="#" className="block w-full text-left px-3 py-2 rounded-lg font-medium text-zinc-700 dark:text-zinc-200 hover:bg-blue-100 dark:hover:bg-blue-900 transition">
          Remediation
        </a>
      </nav>
      {/* Custom children (e.g., quick filters) */}
      {children && (
        <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800">
          {children}
        </div>
      )}
    </Box>
  );
}
