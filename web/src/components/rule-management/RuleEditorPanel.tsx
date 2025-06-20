import React from 'react';
import RuleEditor from './RuleEditor';
import PresenceBar from './PresenceBar';

export interface RuleEditorPanelProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  theme?: 'vs-dark' | 'light';
  height?: string | number;
  readOnly?: boolean;
  collaborative?: boolean;
  documentId?: string;
  peers?: string[];
}

export const RuleEditorPanel: React.FC<RuleEditorPanelProps> = ({
  value,
  onChange,
  language = 'json',
  theme = 'vs-dark',
  height = 400,
  readOnly = false,
  collaborative = false,
  documentId = 'default-rule',
  peers = [],
}) => (
  <div className="flex-1 flex flex-col">
    {collaborative && <PresenceBar peers={peers} />}
    <RuleEditor
      value={value}
      onChange={onChange}
      language={language}
      theme={theme}
      height={height}
      readOnly={readOnly}
      collaborative={collaborative}
      documentId={documentId}
      presenceBar={false}
    />
  </div>
);

export default RuleEditorPanel;
