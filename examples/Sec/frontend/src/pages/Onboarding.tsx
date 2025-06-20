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
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';

const schema = z.object({
  orgName: z.string().min(2, 'Organization name is required'),
  msClientId: z.string().min(1, 'Client ID is required'),
  msClientSecret: z.string().min(1, 'Client Secret is required'),
  msTenantId: z.string().min(1, 'Tenant ID is required'),
});

type FormData = z.infer<typeof schema>;

function Onboarding() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      // Send org info and credentials to backend API (never store secrets in frontend state after this)
      const res = await fetch('/api/onboard_org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_name: data.orgName,
          ms_client_id: data.msClientId,
          ms_client_secret: data.msClientSecret,
          ms_tenant_id: data.msTenantId,
        }),
      });
      if (!res.ok) throw new Error('Failed to onboard organization');
      setSuccess(true);
    } catch (e: unknown) {
      const error = e as Error;
      setError(error.message || 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={8} maxW="md" mx="auto">
      <Heading mb={4}>Organization Onboarding</Heading>
      <Text mb={6}>
        Register your organization and securely manage credentials here.
      </Text>
      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={4} align="stretch">
          <FormControl isInvalid={!!errors.orgName}>
            <FormLabel>Organization Name</FormLabel>
            <Input {...register('orgName')} />
            <FormErrorMessage>{errors.orgName?.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.msClientId}>
            <FormLabel>Microsoft Client ID</FormLabel>
            <Input {...register('msClientId')} />
            <FormErrorMessage>{errors.msClientId?.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.msClientSecret}>
            <FormLabel>Microsoft Client Secret</FormLabel>
            <Input type="password" {...register('msClientSecret')} />
            <FormErrorMessage>
              {errors.msClientSecret?.message}
            </FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.msTenantId}>
            <FormLabel>Microsoft Tenant ID</FormLabel>
            <Input {...register('msTenantId')} />
            <FormErrorMessage>{errors.msTenantId?.message}</FormErrorMessage>
          </FormControl>
          {error && <Text color="red.500">{error}</Text>}
          {success && (
            <Text color="green.500">Organization onboarded successfully!</Text>
          )}
          <Button type="submit" colorScheme="blue" isLoading={loading}>
            Register Organization
          </Button>
        </VStack>
      </form>
      {loading && <Spinner mt={4} />}
    </Box>
  );
}

export default Onboarding;
