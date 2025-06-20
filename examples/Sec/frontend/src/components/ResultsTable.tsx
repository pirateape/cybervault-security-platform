import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  IconButton,
  Image,
  VStack,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import type { ScanResult } from '../types';

interface ResultsTableProps {
  results: ScanResult[];
  sortable?: boolean;
}

export default function ResultsTable({
  results,
  sortable = false,
}: ResultsTableProps) {
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sortedResults = sortable
    ? [...results].sort((a, b) => {
        if (sortDir === 'asc') return a[sortBy] > b[sortBy] ? 1 : -1;
        return a[sortBy] < b[sortBy] ? 1 : -1;
      })
    : results;

  if (!results.length)
    return (
      <VStack spacing={4} mt={8}>
        <Image
          src="/assets/empty-state.png"
          alt="No scan results"
          boxSize="120px"
          opacity={0.7}
        />
        <Text color="gray.500">
          No scan results found. Trigger a scan to get started.
        </Text>
      </VStack>
    );

  const handleSort = (col: string) => {
    if (sortBy === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  return (
    <Table variant="simple" mt={4} role="table" aria-label="Scan results table">
      <Thead>
        <Tr role="row">
          <Th role="columnheader">
            <span>Scan ID</span>
            {sortable && (
              <IconButton
                aria-label={`Sort by Scan ID ${
                  sortBy === 'scan_id'
                    ? sortDir === 'asc'
                      ? 'descending'
                      : 'ascending'
                    : 'ascending'
                }`}
                size="xs"
                ml={1}
                icon={
                  sortBy === 'scan_id' && sortDir === 'asc' ? (
                    <TriangleUpIcon />
                  ) : (
                    <TriangleDownIcon />
                  )
                }
                onClick={() => handleSort('scan_id')}
                variant="ghost"
              />
            )}
          </Th>
          <Th role="columnheader">
            <span>Finding</span>
            {sortable && (
              <IconButton
                aria-label={`Sort by Finding ${
                  sortBy === 'finding'
                    ? sortDir === 'asc'
                      ? 'descending'
                      : 'ascending'
                    : 'ascending'
                }`}
                size="xs"
                ml={1}
                icon={
                  sortBy === 'finding' && sortDir === 'asc' ? (
                    <TriangleUpIcon />
                  ) : (
                    <TriangleDownIcon />
                  )
                }
                onClick={() => handleSort('finding')}
                variant="ghost"
              />
            )}
          </Th>
          <Th role="columnheader">
            <span>Severity</span>
            {sortable && (
              <IconButton
                aria-label={`Sort by Severity ${
                  sortBy === 'severity'
                    ? sortDir === 'asc'
                      ? 'descending'
                      : 'ascending'
                    : 'ascending'
                }`}
                size="xs"
                ml={1}
                icon={
                  sortBy === 'severity' && sortDir === 'asc' ? (
                    <TriangleUpIcon />
                  ) : (
                    <TriangleDownIcon />
                  )
                }
                onClick={() => handleSort('severity')}
                variant="ghost"
              />
            )}
          </Th>
          <Th role="columnheader">
            <span>Framework</span>
            {sortable && (
              <IconButton
                aria-label={`Sort by Framework ${
                  sortBy === 'compliance_framework'
                    ? sortDir === 'asc'
                      ? 'descending'
                      : 'ascending'
                    : 'ascending'
                }`}
                size="xs"
                ml={1}
                icon={
                  sortBy === 'compliance_framework' && sortDir === 'asc' ? (
                    <TriangleUpIcon />
                  ) : (
                    <TriangleDownIcon />
                  )
                }
                onClick={() => handleSort('compliance_framework')}
                variant="ghost"
              />
            )}
          </Th>
          <Th role="columnheader">
            <span>Created</span>
            {sortable && (
              <IconButton
                aria-label={`Sort by Created ${
                  sortBy === 'created_at'
                    ? sortDir === 'asc'
                      ? 'descending'
                      : 'ascending'
                    : 'ascending'
                }`}
                size="xs"
                ml={1}
                icon={
                  sortBy === 'created_at' && sortDir === 'asc' ? (
                    <TriangleUpIcon />
                  ) : (
                    <TriangleDownIcon />
                  )
                }
                onClick={() => handleSort('created_at')}
                variant="ghost"
              />
            )}
          </Th>
        </Tr>
      </Thead>
      <Tbody>
        {sortedResults.map((r) => (
          <Tr key={r.id} role="row">
            <Td role="cell">{r.scan_id}</Td>
            <Td role="cell">{r.finding}</Td>
            <Td role="cell">
              <Text
                color={
                  r.severity === 'high'
                    ? 'red.600'
                    : r.severity === 'medium'
                    ? 'orange.600'
                    : r.severity === 'low'
                    ? 'yellow.600'
                    : 'gray.600'
                }
                fontWeight={r.severity === 'high' ? 'bold' : 'normal'}
              >
                {r.severity}
              </Text>
            </Td>
            <Td role="cell">{r.compliance_framework}</Td>
            <Td role="cell">
              <time dateTime={r.created_at}>
                {new Date(r.created_at).toLocaleString()}
              </time>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
