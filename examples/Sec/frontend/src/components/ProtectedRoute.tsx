import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Spinner, Center } from '@chakra-ui/react';

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
