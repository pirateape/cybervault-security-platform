import React from 'react';
import { useColorMode } from '@chakra-ui/react';

/**
 * ThemeToggle toggles between dark and light themes using Chakra UI's color mode context.
 */
export const ThemeToggle: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <button
      className="btn btn-ghost btn-sm"
      onClick={toggleColorMode}
      aria-label="Toggle Theme"
      type="button"
    >
      {colorMode === 'dark' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
};

export default ThemeToggle;
