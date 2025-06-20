import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
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
  Select,
  Button,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Portal,
} from '@chakra-ui/react';
import MetadataEditor from './MetadataEditor';
import { InfoOutlineIcon } from '@chakra-ui/icons';

// ScanTriggerModal: Modal for configuring and triggering a scan
// Props: isOpen (boolean), onClose (function)
export default function ScanTriggerModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [orgId, setOrgId] = useState<string | null>(null);
  const scanTypePresets = ['compliance', 'security', 'custom'];
  const [selectedPreset, setSelectedPreset] = useState('compliance');
  const [scanType, setScanType] = useState('');
  const [scanTarget, setScanTarget] = useState('');
  const [metadata, setMetadata] = useState('');
  const [metaError, setMetaError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!orgId && user && user.org_id) setOrgId(user.org_id);
  }, [user, orgId]);

  const hasValidOrg = user && user.org_id && orgId;

  const handleMetadataChange = (v: string) => {
    setMetadata(v);
    if (!v) {
      setMetaError(null);
      return;
    }
    try {
      JSON.parse(v);
      setMetaError(null);
    } catch {
      setMetaError('Metadata must be valid JSON');
    }
  };

  const handleFormatMetadata = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(metadata), null, 2);
      setMetadata(formatted);
      setMetaError(null);
    } catch {
      setMetaError('Metadata must be valid JSON');
    }
  };

  const scanMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error('You must be logged in to trigger a scan.');
      }
      if (!orgId || !user.org_id) {
        throw new Error(
          'Your account is not associated with an organization. Please contact your administrator.'
        );
      }
      if (!scanType.trim()) {
        throw new Error('Please select or enter a scan type.');
      }
      if (!scanTarget.trim()) {
        throw new Error('Please enter a scan target.');
      }
      let metaObj = undefined;
      if (metadata) {
        try {
          metaObj = JSON.parse(metadata);
          setMetaError(null);
        } catch {
          setMetaError('Metadata must be valid JSON');
          throw new Error('Metadata must be valid JSON');
        }
      }
      return triggerScan({
        orgId,
        userId: user.id,
        scanType,
        target: scanTarget,
        metadata: metaObj,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Scan triggered successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to trigger scan',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      {/*
        Wrapping ModalContent in Portal ensures it is rendered at the document body level,
        avoiding clipping or z-index issues from dashboard grid/layout containers.
      */}
      <Portal>
        <ModalContent>
          <ModalHeader>Trigger New Scan</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={3}>
              <FormLabel>
                Scan Type
                <Tooltip label="Select the type of scan you want to run. 'Compliance' checks for regulatory alignment, 'Security' checks for vulnerabilities, 'Custom' lets you define your own.">
                  <InfoOutlineIcon ml={2} color="blue.400" />
                </Tooltip>
              </FormLabel>
              <Select
                value={selectedPreset}
                onChange={(e) => {
                  setSelectedPreset(e.target.value);
                  if (e.target.value !== 'custom') setScanType(e.target.value);
                  else setScanType('');
                }}
              >
                {scanTypePresets.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </Select>
              {selectedPreset === 'custom' && (
                <Input
                  mt={2}
                  value={scanType}
                  onChange={(e) => setScanType(e.target.value)}
                  placeholder="Enter custom scan type"
                />
              )}
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>
                Scan Target
                <Tooltip label="Specify the resource, tenant, or user to scan.">
                  <InfoOutlineIcon ml={2} color="blue.400" />
                </Tooltip>
              </FormLabel>
              <Input
                value={scanTarget}
                onChange={(e) => setScanTarget(e.target.value)}
                placeholder="e.g. tenant-id or resource-name"
              />
            </FormControl>
            <MetadataEditor
              value={metadata}
              onChange={handleMetadataChange}
              error={metaError}
              onFormat={handleFormatMetadata}
            />
            {metaError && (
              <Alert status="error" borderRadius="md" mt={2}>
                <AlertIcon />
                <AlertTitle>Invalid Metadata</AlertTitle>
                <AlertDescription>{metaError}</AlertDescription>
              </Alert>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={() => scanMutation.mutate()}
              isLoading={scanMutation.isLoading}
              loadingText="Triggering Scan"
              isDisabled={
                !hasValidOrg ||
                !scanType.trim() ||
                !scanTarget.trim() ||
                !!metaError
              }
              title={
                !hasValidOrg
                  ? 'Account must be associated with an organization'
                  : 'Trigger scan'
              }
            >
              Trigger Scan
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Portal>
    </Modal>
  );
}
