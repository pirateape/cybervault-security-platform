import React, { useState } from 'react';
import { Button } from '@chakra-ui/react';
import ScanTriggerModal from './ScanTriggerModal';

// ScanTriggerWidget: Renders a button that opens the ScanTriggerModal
export default function ScanTriggerWidget() {
  // State to control modal visibility
  const [isOpen, setIsOpen] = useState(false);
  const handleOpen = () => {
    console.log('Trigger Scan button clicked');
    setIsOpen(true);
  };
  const handleClose = () => {
    console.log('ScanTriggerModal closed');
    setIsOpen(false);
  };
  React.useEffect(() => {
    console.log('ScanTriggerWidget isOpen state:', isOpen);
  }, [isOpen]);

  return (
    <>
      <Button colorScheme="blue" size="lg" w="100%" onClick={handleOpen}>
        Trigger Scan
      </Button>
      {/* Modal for scan configuration/confirmation */}
      <ScanTriggerModal isOpen={isOpen} onClose={handleClose} />
    </>
  );
}
