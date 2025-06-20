import React from 'react';

export interface RuleSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * RuleSearch provides a search input for filtering rules.
 * @param value Current search value
 * @param onChange Callback for value change
 * @param placeholder Input placeholder
 */
export const RuleSearch: React.FC<RuleSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search rules...',
}) => (
  <input
    className="input input-bordered w-full mb-2"
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    aria-label="Search Rules"
    type="search"
  />
);

export default RuleSearch;
