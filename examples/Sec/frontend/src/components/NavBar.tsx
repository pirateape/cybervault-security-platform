import { NavLink } from 'react-router-dom';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { FiLogOut } from 'react-icons/fi';
import { motion } from 'framer-motion';
import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Flex,
  Spacer,
  Link as ChakraLink,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Avatar,
  Text,
  Icon,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Portal,
} from '@chakra-ui/react';

const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/user-management', label: 'User Management' },
  { to: '/onboarding', label: 'Onboarding' },
];

// Removed keyframes usage due to import error
// Using a simpler animation approach in the component styling

function NavBar() {
  const { user, logout, loading } = useAuth();
  const [isLogoutAlertDialogOpen, setIsLogoutAlertDialogOpen] = useState(false);
  const cancelRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      setIsLogoutAlertDialogOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const openLogoutAlertDialog = () => {
    setIsLogoutAlertDialogOpen(true);
  };

  const closeLogoutAlertDialog = () => {
    setIsLogoutAlertDialogOpen(false);
  };

  return (
    <>
      <Box
        as="nav"
        bg="gray.800"
        px={6}
        py={3}
        boxShadow="0 4px 12px rgba(0, 0, 0, 0.7), 0 0 10px rgba(0, 188, 212, 0.3)"
        mb={4}
        role="navigation"
        aria-label="Main navigation"
        position="relative"
        _after={{
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '2px',
          bg: 'linear-gradient(90deg, transparent, brand.500, transparent)',
          animation: 'pulse 3s ease-in-out infinite',
        }}
      >
        <Flex align="center">
          {navLinks.map((link) => (
            <ChakraLink
              as={NavLink}
              key={link.to}
              to={link.to}
              px={4}
              py={2}
              fontWeight="bold"
              fontSize="md"
              color="gray.300"
              _activeLink={{
                color: 'brand.400',
                textDecoration: 'underline',
                transform: 'scale(1.05)',
              }}
              _hover={{ color: 'brand.300', transform: 'translateY(-2px)' }}
              _focus={{
                outline: '2px solid',
                outlineColor: 'brand.500',
                outlineOffset: '2px',
              }}
              transition="all 0.2s ease"
              end={link.to === '/'}
              aria-current={undefined}
            >
              {link.label}
            </ChakraLink>
          ))}
          <Spacer />

          {user && (
            <Menu>
              <MenuButton
                as={Button}
                variant="ghost"
                size="sm"
                rightIcon={<ChevronDownIcon />}
                isLoading={loading}
                aria-label="User menu"
                zIndex="dropdown"
                _hover={{ bg: 'gray.700', transform: 'translateY(-2px)' }}
                _focus={{
                  outline: '2px solid',
                  outlineColor: 'brand.500',
                  outlineOffset: '2px',
                }}
                transition="all 0.2s ease"
              >
                <Flex align="center" gap={2}>
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Avatar
                      size="sm"
                      name={user.email}
                      border="2px solid"
                      borderColor="brand.500"
                    />
                  </motion.div>
                  <Text fontSize="sm" fontWeight="medium" color="gray.200">
                    {user.email}
                  </Text>
                </Flex>
              </MenuButton>
              <Portal>
                <MenuList
                  bg="gray.800"
                  border="1px solid"
                  borderColor="gray.700"
                  borderRadius="md"
                  boxShadow="0 8px 16px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 188, 212, 0.2)"
                  py={2}
                  minW="200px"
                  zIndex="overlay"
                >
                  <MenuItem
                    onClick={openLogoutAlertDialog}
                    _hover={{ bg: 'gray.700' }}
                    _focus={{ bg: 'gray.700' }}
                    px={4}
                    py={2}
                    color="red.400"
                    fontWeight="medium"
                    aria-label="Sign out of your account"
                  >
                    <Flex align="center" gap={2}>
                      <Icon as={FiLogOut} />
                      Sign Out
                    </Flex>
                  </MenuItem>
                </MenuList>
              </Portal>
            </Menu>
          )}
        </Flex>
      </Box>

      {/* Logout Confirmation AlertDialog */}
      <AlertDialog
        isOpen={isLogoutAlertDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={closeLogoutAlertDialog}
      >
        <AlertDialogOverlay>
          <AlertDialogContent
            bg="gray.800"
            border="1px solid"
            borderColor="gray.700"
            boxShadow="0 8px 16px rgba(0, 0, 0, 0.5)"
          >
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
              Confirm Sign Out
            </AlertDialogHeader>

            <AlertDialogBody color="gray.200">
              Are you sure you want to sign out? You will need to log in again
              to access your account.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={closeLogoutAlertDialog}
                bg="gray.700"
                color="white"
                _hover={{ bg: 'gray.600' }}
              >
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleLogout}
                ml={3}
                isLoading={loading}
                loadingText="Signing out..."
              >
                Sign Out
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}

export default NavBar;
