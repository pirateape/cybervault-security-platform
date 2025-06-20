import React from 'react';
import {
  Box,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
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

export interface HeatMapSector {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  count: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  services: string[];
}

interface HeatMapVisualizationProps {
  data: ComplianceDataPoint[];
  title?: string;
  isLoading?: boolean;
  error?: string | null;
  width?: number;
  height?: number;
  gridColumns?: number;
  gridRows?: number;
}

const HeatMapVisualization: React.FC<HeatMapVisualizationProps> = ({
  data = [],
  title = 'Compliance Risk Heat Map',
  isLoading = false,
  error = null,
  width = 800,
  height = 500,
  gridColumns = 10,
  gridRows = 8,
}) => {
  // Theme colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');

  // Risk level colors aligned with brand theme
  const riskColors = {
    low: '#00bcd4', // brand.500 - cyan
    medium: '#8c5af7', // accent.500 - purple
    high: '#ff7300', // orange
    critical: '#e53e3e', // red
  };

  // Transform data into heat map sectors
  const getHeatMapSectors = (
    dataPoints: ComplianceDataPoint[],
    cols: number,
    rows: number
  ): HeatMapSector[] => {
    const sectors: HeatMapSector[] = [];
    const maxX = Math.max(...dataPoints.map((d) => d.x), 100);
    const maxY = Math.max(...dataPoints.map((d) => d.y), 100);

    const sectorWidth = maxX / cols;
    const sectorHeight = maxY / rows;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x1 = col * sectorWidth;
        const x2 = (col + 1) * sectorWidth;
        const y1 = row * sectorHeight;
        const y2 = (row + 1) * sectorHeight;

        // Find data points in this sector
        const pointsInSector = dataPoints.filter(
          (point) =>
            point.x >= x1 && point.x < x2 && point.y >= y1 && point.y < y2
        );

        if (pointsInSector.length > 0) {
          // Calculate aggregated risk level
          const riskCounts = pointsInSector.reduce((acc, point) => {
            acc[point.riskLevel] = (acc[point.riskLevel] || 0) + point.count;
            return acc;
          }, {} as Record<string, number>);

          // Determine dominant risk level
          const dominantRisk = Object.entries(riskCounts).reduce((a, b) =>
            riskCounts[a[0]] > riskCounts[b[0]] ? a : b
          )[0] as 'low' | 'medium' | 'high' | 'critical';

          const totalCount = pointsInSector.reduce(
            (sum, point) => sum + point.count,
            0
          );
          const services = [
            ...new Set(pointsInSector.map((point) => point.service)),
          ];

          sectors.push({
            x1,
            x2,
            y1,
            y2,
            count: totalCount,
            riskLevel: dominantRisk,
            services,
          });
        }
      }
    }

    return sectors;
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <Box
          bg={bgColor}
          p={3}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="md"
          boxShadow="lg"
          maxW="250px"
        >
          <Text fontWeight="bold" color={textColor}>
            {data.service || 'Compliance Area'}
          </Text>
          <Text fontSize="sm" color={textColor}>
            Risk Level:{' '}
            <Text
              as="span"
              color={getRiskColor(data.riskLevel)}
              fontWeight="bold"
            >
              {data.riskLevel.toUpperCase()}
            </Text>
          </Text>
          <Text fontSize="sm" color={textColor}>
            Issues: {data.count}
          </Text>
          {data.category && (
            <Text fontSize="sm" color={textColor}>
              Category: {data.category}
            </Text>
          )}
        </Box>
      );
    }
    return null;
  };

  // Custom tooltip for heat map sectors
  const SectorTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const sector = payload[0].payload;
      return (
        <Box
          bg={bgColor}
          p={3}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="md"
          boxShadow="lg"
          maxW="300px"
        >
          <Text fontWeight="bold" color={textColor}>
            Compliance Sector
          </Text>
          <Text fontSize="sm" color={textColor}>
            Risk Level:{' '}
            <Text
              as="span"
              color={getRiskColor(sector.riskLevel)}
              fontWeight="bold"
            >
              {sector.riskLevel.toUpperCase()}
            </Text>
          </Text>
          <Text fontSize="sm" color={textColor}>
            Total Issues: {sector.count}
          </Text>
          <Text fontSize="sm" color={textColor}>
            Services: {sector.services.join(', ')}
          </Text>
        </Box>
      );
    }
    return null;
  };

  const getRiskColor = (level: string) => {
    if (
      level === 'low' ||
      level === 'medium' ||
      level === 'high' ||
      level === 'critical'
    ) {
      return riskColors[level];
    }
    return '#888';
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height={height}
        style={{ zIndex: 0, position: 'relative' }}
      >
        <Spinner size="xl" color="brand.500" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        No compliance data available for heat map visualization.
      </Alert>
    );
  }

  const heatMapSectors = getHeatMapSectors(data, gridColumns, gridRows);
  const maxX = Math.max(...data.map((d) => d.x), 100);
  const maxY = Math.max(...data.map((d) => d.y), 100);

  return (
    <Box
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      mb={4}
      style={{ zIndex: 0, position: 'relative' }}
    >
      {title && (
        <Text fontWeight="bold" fontSize="lg" mb={2} color={textColor}>
          {title}
        </Text>
      )}
      <Box
        bg={bgColor}
        p={4}
        borderRadius="lg"
        border="1px solid"
        borderColor={borderColor}
        zIndex="auto"
        position="relative"
      >
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            data={data}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, maxX]}
              tick={{ fill: textColor, fontSize: 12 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[0, maxY]}
              tick={{ fill: textColor, fontSize: 12 }}
            />

            {/* Render heat map sectors */}
            {heatMapSectors.map((sector, index) => (
              <ReferenceArea
                key={`sector-${index}`}
                x1={sector.x1}
                x2={sector.x2}
                y1={sector.y1}
                y2={sector.y2}
                fill={riskColors[sector.riskLevel]}
                fillOpacity={0.3 + (sector.count / 20) * 0.4} // Dynamic opacity based on count
                stroke={riskColors[sector.riskLevel]}
                strokeOpacity={0.8}
                strokeWidth={1}
              />
            ))}

            {/* Scatter plot for individual data points */}
            <Scatter dataKey="count" fill="#8884d8">
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={riskColors[entry.riskLevel]}
                />
              ))}
            </Scatter>

            <Tooltip content={<CustomTooltip />} />
          </ScatterChart>
        </ResponsiveContainer>

        {/* Legend */}
        <Box
          mt={4}
          display="flex"
          flexWrap="wrap"
          gap={4}
          justifyContent="center"
        >
          {Object.entries(riskColors).map(([level, color]) => (
            <Box key={level} display="flex" alignItems="center" gap={2}>
              <Box w={4} h={4} bg={color} borderRadius="sm" />
              <Text fontSize="sm" color={textColor} textTransform="capitalize">
                {level} Risk
              </Text>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default HeatMapVisualization;
