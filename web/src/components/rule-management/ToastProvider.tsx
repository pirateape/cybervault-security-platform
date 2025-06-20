import React from 'react';
import { useToast as useChakraToast, UseToastOptions } from '@chakra-ui/react';

type ToastType = 'success' | 'error' | 'info';

/**
 * useToast returns the toast context function.
 */
export function useToast() {
  const toast = useChakraToast();
  return React.useCallback(
    (msg: string, type: ToastType = 'info') => {
      const options: UseToastOptions = {
        description: msg,
        status: type,
        duration: 4000,
        isClosable: true,
        position: 'top-right',
      };
      toast(options);
    },
    [toast]
  );
}

/**
 * ToastProvider provides the toast context to children.
 * This is now just a passthrough component since we're using Chakra UI's toast system.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <>{children}</>;
};

export default ToastProvider;
