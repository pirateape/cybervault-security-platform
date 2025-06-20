import React, { useCallback } from 'react';
import { useDrop } from 'react-dnd';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import type {
  RuleBuilderCanvasProps,
  DragItem,
  ComplianceRule,
  CanvasItem,
} from '../types/phase2';

const RuleBuilderCanvas: React.FC<RuleBuilderCanvasProps> = ({
  rules,
  onRuleCreate,
  onRuleUpdate,
  onRuleDelete,
  onValidate,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Drop handler for new rules
  const [{ isOver, canDrop }, drop] = useDrop<
    DragItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >(
    () => ({
      accept: ['RULE', 'CONDITION', 'ACTION', 'CONNECTOR'],
      drop: (item, monitor) => {
        if (item.type === 'RULE') {
          onRuleCreate({ ...item.data });
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [onRuleCreate]
  );

  // Render a rule block
  const renderRuleBlock = useCallback(
    (rule: ComplianceRule) => (
      <Box
        key={rule.id}
        bg={bgColor}
        border="1px"
        borderColor={borderColor}
        borderRadius="md"
        p={3}
        mb={2}
        boxShadow="sm"
        cursor="pointer"
        _hover={{ borderColor: 'blue.400', boxShadow: 'md' }}
      >
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold" fontSize="md">
              {rule.name}
            </Text>
            <Text fontSize="sm" color="gray.600">
              {rule.description}
            </Text>
            <Badge colorScheme="blue" variant="subtle">
              {rule.category}
            </Badge>
          </VStack>
          <Badge colorScheme="green" variant="solid">
            {rule.severity}
          </Badge>
        </HStack>
      </Box>
    ),
    [bgColor, borderColor]
  );

  return (
    <Box
      ref={drop}
      bg={bgColor}
      border="2px dashed"
      borderColor={isOver && canDrop ? 'blue.400' : borderColor}
      borderRadius="lg"
      minH="300px"
      p={4}
      transition="border-color 0.2s"
      position="relative"
    >
      <Text fontWeight="bold" fontSize="lg" mb={4}>
        Drag and Drop Rule Builder
      </Text>
      {rules.length === 0 ? (
        <Text color="gray.500" textAlign="center" mt={8}>
          Drag rules here to start building your compliance logic.
        </Text>
      ) : (
        <VStack align="stretch" spacing={3}>
          {rules.map(renderRuleBlock)}
        </VStack>
      )}
      {isOver && canDrop && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blue.50"
          opacity={0.2}
          zIndex={1}
          borderRadius="lg"
        />
      )}
    </Box>
  );
};

export default RuleBuilderCanvas;
