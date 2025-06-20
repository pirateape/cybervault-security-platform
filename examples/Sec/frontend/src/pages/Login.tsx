import {
  Box,
  Heading,
  Text,
  Input,
  Button,
  VStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Spinner,
  Image,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import { FaMicrosoft } from 'react-icons/fa';
import { Icon } from '@chakra-ui/react';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

function Login() {
  const { login, loginWithMicrosoft, loading, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const navigate = useNavigate();

  // Best practice: Only navigate after user is set in context to avoid race conditions
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await login(data.email, data.password);
      // Do not navigate here; wait for user to be set
    } catch (e: unknown) {
      const error = e as Error;
      setError(error.message || 'Login failed');
    }
  };

  const handleMicrosoftLogin = async () => {
    setError(null);
    try {
      await loginWithMicrosoft();
    } catch (e: unknown) {
      const error = e as Error;
      setError(error.message || 'Microsoft login failed');
    }
  };

  return (
    <Box p={8} maxW="md" mx="auto">
      <VStack spacing={6}>
        <Image
          src="/assets/org-logo.png"
          alt="Organization Logo"
          boxSize="80px"
          mx="auto"
          mb={2}
        />
        <Heading mb={2}>Login</Heading>
        <Text mb={2}>Sign in with your organization account.</Text>
        <Alert status="info" mb={4} borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Why do I need to log in?</AlertTitle>
            <AlertDescription fontSize="sm">
              Access to compliance scanning and reporting is restricted to
              authorized users. Please use your organization credentials.
            </AlertDescription>
          </Box>
        </Alert>
        {error && (
          <Alert status="error" mb={2} borderRadius="md" aria-live="assertive">
            <AlertIcon />
            <AlertTitle>Login failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit(onSubmit)} aria-label="Login form">
          <VStack spacing={4} align="stretch">
            <FormControl isInvalid={!!errors.email}>
              <FormLabel htmlFor="email">Email</FormLabel>
              <Input
                id="email"
                type="email"
                {...register('email')}
                aria-required="true"
                aria-invalid={!!errors.email}
              />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.password}>
              <FormLabel htmlFor="password">Password</FormLabel>
              <Input
                id="password"
                type="password"
                {...register('password')}
                aria-required="true"
                aria-invalid={!!errors.password}
              />
              <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
            </FormControl>
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={loading}
              loadingText="Signing in"
              aria-busy={loading}
              width="full"
            >
              Login
            </Button>
            <Button
              onClick={handleMicrosoftLogin}
              colorScheme="gray"
              width="full"
              isDisabled={loading}
              leftIcon={<Icon as={FaMicrosoft} />}
              aria-label="Sign in with Microsoft"
            >
              Sign in with Microsoft
            </Button>
          </VStack>
        </form>
      </VStack>
      {loading && <Spinner mt={4} />}
    </Box>
  );
}

export default Login;
