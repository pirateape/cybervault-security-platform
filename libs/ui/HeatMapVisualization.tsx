import React from 'react';
import {
  Box,
  Text,
  Spinner,
  AlertRoot,
  AlertIndicator,
} from '@chakra-ui/react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  Cell,
} from 'recharts';

export interface ComplianceDataPoint {
  service: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  count: number;
  x: number;
  y: number;
}

export interface HeatMapVisualizationProps {
  data: ComplianceDataPoint[];
  isLoading?: boolean;
  error?: string | null;
}

const riskLevelColors: Record<ComplianceDataPoint['riskLevel'], string> = {
  critical: '#E53E3E', // red.500
  high: '#DD6B20', // orange.400
  medium: '#ECC94B', // yellow.400
  low: '#38A169', // green.500
};

const HeatMapVisualization: React.FC<HeatMapVisualizationProps> = ({
  data,
  isLoading = false,
  error = null,
}) => {
  if (isLoading) {
    return (
      <Box position="relative" zIndex={0}>
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box position="relative" zIndex={0}>
        <AlertRoot status="error" borderRadius="md">
          <AlertIndicator />
          <Text>{error}</Text>
        </AlertRoot>
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box position="relative" zIndex={0}>
        <AlertRoot status="info" borderRadius="md">
          <AlertIndicator />
          <Text>No heat map data available.</Text>
        </AlertRoot>
      </Box>
    );
  }

  return (
    <Box
      bg={{ base: 'white', _dark: 'gray.800' }}
      borderRadius="lg"
      borderWidth={1}
      borderColor={{ base: 'gray.200', _dark: 'gray.600' }}
      p={4}
      boxShadow="md"
    >
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        Risk Heat Map
      </Text>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" name="Service" />
          <YAxis dataKey="y" name="Category" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="Risks" data={data} fill="#3182ce">
            {data.map((entry, idx) => (
              <Cell
                key={`cell-${idx}`}
                fill={riskLevelColors[entry.riskLevel]}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default HeatMapVisualization;
