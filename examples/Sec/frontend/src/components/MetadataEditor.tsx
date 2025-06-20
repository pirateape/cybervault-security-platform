import {
  FormControl,
  FormLabel,
  Textarea,
  Button as ChakraButton,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import React from 'react';

interface MetadataEditorProps {
  value: string;
  onChange: (v: string) => void;
  error: string | null;
  onFormat: () => void;
}

export default function MetadataEditor({
  value,
  onChange,
  error,
  onFormat,
}: MetadataEditorProps) {
  return (
    <FormControl mb={3} isInvalid={!!error}>
      <FormLabel htmlFor="metadata-editor">Metadata (JSON, optional)</FormLabel>
      <Textarea
        id="metadata-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='{"key": "value"}'
        rows={5}
        fontFamily="mono"
        aria-describedby={error ? 'metadata-error' : undefined}
        aria-invalid={!!error}
      />
      <ChakraButton
        mt={2}
        size="sm"
        onClick={onFormat}
        isDisabled={!value || !!error}
        aria-label="Format JSON metadata"
      >
        Format JSON
      </ChakraButton>
      {error && (
        <Alert status="error" mt={2} id="metadata-error" role="alert">
          <AlertIcon />
          {error}
        </Alert>
      )}
    </FormControl>
  );
}
