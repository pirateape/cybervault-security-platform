'use client'

import React, { useId, useState, useRef, useCallback } from 'react'
import { handleKeyboardActivation, KeyCodes, createAriaProps, LiveAnnouncer } from '../lib/accessibility'

interface Column<T = any> {
  key: string
  title: string
  sortable?: boolean
  render?: (value: any, row: T, index: number) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
  ariaLabel?: string
}

interface AccessibleTableProps<T = any> {
  data: T[]
  columns: Column<T>[]
  caption?: string
  summary?: string
  sortable?: boolean
  selectable?: boolean
  selectedRows?: Set<string | number>
  onSelectionChange?: (selectedRows: Set<string | number>) => void
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  getRowId?: (row: T, index: number) => string | number
  onRowAction?: (row: T, action: string) => void
  loading?: boolean
  emptyMessage?: string
  className?: string
}

interface SortState {
  column: string | null
  direction: 'asc' | 'desc'
}

export function AccessibleTable<T = any>({
  data,
  columns,
  caption,
  summary,
  sortable = false,
  selectable = false,
  selectedRows = new Set(),
  onSelectionChange,
  onSort,
  getRowId = (_, index) => index,
  onRowAction,
  loading = false,
  emptyMessage = 'No data available',
  className = ''
}: AccessibleTableProps<T>) {
  const tableId = useId()
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: 'asc' })
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const announcer = LiveAnnouncer.getInstance()

  const handleSort = useCallback((column: Column<T>) => {
    if (!column.sortable || !sortable) return

    const newDirection = sortState.column === column.key && sortState.direction === 'asc' ? 'desc' : 'asc'
    setSortState({ column: column.key, direction: newDirection })
    
    onSort?.(column.key, newDirection)
    announcer.announce(
      `Table sorted by ${column.title} in ${newDirection}ending order`,
      'polite'
    )
  }, [sortState, sortable, onSort, announcer])

  const handleSelectAll = useCallback((checked: boolean) => {
    if (!selectable || !onSelectionChange) return

    const newSelection = new Set<string | number>()
    if (checked) {
      data.forEach((row, index) => {
        newSelection.add(getRowId(row, index))
      })
    }
    onSelectionChange(newSelection)
    
    announcer.announce(
      checked ? `All ${data.length} rows selected` : 'All rows deselected',
      'polite'
    )
  }, [data, selectable, onSelectionChange, getRowId, announcer])

  const handleSelectRow = useCallback((rowId: string | number, checked: boolean) => {
    if (!selectable || !onSelectionChange) return

    const newSelection = new Set(selectedRows)
    if (checked) {
      newSelection.add(rowId)
    } else {
      newSelection.delete(rowId)
    }
    onSelectionChange(newSelection)
    
    announcer.announce(
      checked ? 'Row selected' : 'Row deselected',
      'polite'
    )
  }, [selectedRows, selectable, onSelectionChange, announcer])

  const handleKeyDown = useCallback((e: React.KeyboardEvent, row: number, col: number) => {
    const maxRow = data.length - 1
    const maxCol = columns.length - 1 + (selectable ? 1 : 0)

    switch (e.key) {
      case KeyCodes.ARROW_UP:
        e.preventDefault()
        if (row > 0) {
          setFocusedCell({ row: row - 1, col })
        }
        break
      case KeyCodes.ARROW_DOWN:
        e.preventDefault()
        if (row < maxRow) {
          setFocusedCell({ row: row + 1, col })
        }
        break
      case KeyCodes.ARROW_LEFT:
        e.preventDefault()
        if (col > 0) {
          setFocusedCell({ row, col: col - 1 })
        }
        break
      case KeyCodes.ARROW_RIGHT:
        e.preventDefault()
        if (col < maxCol) {
          setFocusedCell({ row, col: col + 1 })
        }
        break
      case KeyCodes.HOME:
        e.preventDefault()
        if (e.ctrlKey) {
          setFocusedCell({ row: 0, col: 0 })
        } else {
          setFocusedCell({ row, col: 0 })
        }
        break
      case KeyCodes.END:
        e.preventDefault()
        if (e.ctrlKey) {
          setFocusedCell({ row: maxRow, col: maxCol })
        } else {
          setFocusedCell({ row, col: maxCol })
        }
        break
      case KeyCodes.SPACE:
        if (selectable && col === 0) {
          e.preventDefault()
          const rowId = getRowId(data[row], row)
          handleSelectRow(rowId, !selectedRows.has(rowId))
        }
        break
    }
  }, [data, columns, selectable, selectedRows, getRowId, handleSelectRow])

  // Focus management effect
  React.useEffect(() => {
    if (!focusedCell || !tableRef.current) return

    const { row, col } = focusedCell
    let selector = ''
    
    if (selectable && col === 0) {
      selector = `tbody tr:nth-child(${row + 1}) td:first-child input[type="checkbox"]`
    } else {
      const dataCol = selectable ? col - 1 : col
      selector = `tbody tr:nth-child(${row + 1}) td:nth-child(${col + 1})`
    }

    const cell = tableRef.current.querySelector(selector) as HTMLElement
    if (cell) {
      cell.focus()
    }
  }, [focusedCell, selectable])

  const allSelected = data.length > 0 && selectedRows.size === data.length
  const someSelected = selectedRows.size > 0 && selectedRows.size < data.length

  return (
    <div className={`accessible-table-container ${className}`}>
      {loading && (
        <div className="table-loading" role="status" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true"></span>
          Loading table data...
        </div>
      )}
      
      <table
        ref={tableRef}
        id={tableId}
        className="accessible-table"
        {...createAriaProps.table(
          caption || 'Data table',
          summary ? `${tableId}-summary` : undefined
        )}
      >
        {caption && <caption>{caption}</caption>}
        
        {summary && (
          <caption id={`${tableId}-summary`} className="sr-only">
            {summary}
          </caption>
        )}

        <thead>
          <tr role="row">
            {selectable && (
              <th scope="col" className="select-column">
                <label className="checkbox-label sr-only">
                  Select all rows
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = someSelected
                      }
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    aria-describedby={`${tableId}-selection-status`}
                  />
                </label>
                <span id={`${tableId}-selection-status`} className="sr-only">
                  {selectedRows.size} of {data.length} rows selected
                </span>
              </th>
            )}
            
            {columns.map((column, colIndex) => (
              <th
                key={column.key}
                scope="col"
                className={`column-${column.key} ${column.align ? `align-${column.align}` : ''}`}
                style={{ width: column.width }}
                aria-sort={
                  sortState.column === column.key
                    ? sortState.direction === 'asc' ? 'ascending' : 'descending'
                    : column.sortable && sortable ? 'none' : undefined
                }
              >
                {column.sortable && sortable ? (
                  <button
                    type="button"
                    className="sort-button"
                    onClick={() => handleSort(column)}
                    onKeyDown={(e) => handleKeyboardActivation(e, () => handleSort(column))}
                    aria-label={`Sort by ${column.title} ${
                      sortState.column === column.key
                        ? sortState.direction === 'asc' ? 'descending' : 'ascending'
                        : 'ascending'
                    }`}
                  >
                    {column.title}
                    <span className="sort-indicator" aria-hidden="true">
                      {sortState.column === column.key && (
                        sortState.direction === 'asc' ? ' ↑' : ' ↓'
                      )}
                    </span>
                  </button>
                ) : (
                  column.title
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="empty-message"
                role="cell"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const rowId = getRowId(row, rowIndex)
              const isSelected = selectedRows.has(rowId)
              
              return (
                <tr
                  key={rowId}
                  role="row"
                  className={isSelected ? 'selected' : ''}
                  aria-selected={selectable ? isSelected : undefined}
                >
                  {selectable && (
                    <td role="gridcell" className="select-cell">
                      <label className="checkbox-label sr-only">
                        Select row {rowIndex + 1}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(rowId, e.target.checked)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, 0)}
                          tabIndex={focusedCell?.row === rowIndex && focusedCell?.col === 0 ? 0 : -1}
                        />
                      </label>
                    </td>
                  )}
                  
                  {columns.map((column, colIndex) => {
                    const cellValue = (row as any)[column.key]
                    const adjustedColIndex = selectable ? colIndex + 1 : colIndex
                    const isFocused = focusedCell?.row === rowIndex && focusedCell?.col === adjustedColIndex
                    
                    return (
                      <td
                        key={column.key}
                        role="gridcell"
                        className={`column-${column.key} ${column.align ? `align-${column.align}` : ''}`}
                        tabIndex={isFocused ? 0 : -1}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, adjustedColIndex)}
                        onFocus={() => setFocusedCell({ row: rowIndex, col: adjustedColIndex })}
                        aria-label={column.ariaLabel ? `${column.ariaLabel}: ${cellValue}` : undefined}
                      >
                        {column.render ? column.render(cellValue, row, rowIndex) : cellValue}
                      </td>
                    )
                  })}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
      
      {selectable && data.length > 0 && (
        <div className="table-summary" role="status" aria-live="polite">
          {selectedRows.size} of {data.length} rows selected
        </div>
      )}
    </div>
  )
}

// Export utility function for creating table columns
export const createTableColumn = <T = any>(column: Column<T>): Column<T> => column

// Export utility for creating action buttons in table cells
export const createActionButton = (
  label: string,
  onClick: () => void,
  variant: 'primary' | 'secondary' | 'danger' = 'secondary'
) => (
  <button
    type="button"
    className={`btn btn-${variant} btn-sm`}
    onClick={onClick}
    aria-label={label}
  >
    {label}
  </button>
) 