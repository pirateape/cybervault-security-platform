// Phase 2 TypeScript Interfaces for Code Editor & Rule Builder

import { editor } from 'monaco-editor';

// Monaco Editor Types
export interface CodeAnalysisResult {
  id: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  code: string;
  source: 'ai' | 'syntax' | 'security';
  confidence: number;
  suggestions: RemediationSuggestion[];
}

export interface RemediationSuggestion {
  id: string;
  title: string;
  description: string;
  code: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  category: 'security' | 'performance' | 'compliance' | 'best-practice';
}

export interface PowerAutomateWorkflow {
  id: string;
  name: string;
  content: string;
  language: 'powerautomate' | 'json';
  lastModified: Date;
  version: string;
  metadata: {
    triggers: string[];
    actions: string[];
    connectors: string[];
    complexity: 'low' | 'medium' | 'high';
  };
}

export interface AIAnalysisContext {
  workflowId: string;
  analysisType: 'security' | 'compliance' | 'performance' | 'best-practice';
  framework: 'NIST' | 'ISO27001' | 'GDPR' | 'SOX' | 'HIPAA';
  customRules: ComplianceRule[];
}

// React DnD Types
export interface DragItem {
  id: string;
  type: string;
  data: any;
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: 'condition' | 'action' | 'validation' | 'transformation';
  framework: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  parameters: RuleParameter[];
  logic: RuleLogic;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleParameter {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

export interface RuleLogic {
  operator: 'AND' | 'OR' | 'NOT' | 'IF' | 'THEN' | 'ELSE';
  conditions: RuleCondition[];
  actions: RuleAction[];
}

export interface RuleCondition {
  id: string;
  field: string;
  operator:
    | 'equals'
    | 'contains'
    | 'startsWith'
    | 'endsWith'
    | 'regex'
    | 'exists';
  value: any;
  negate?: boolean;
}

export interface RuleAction {
  id: string;
  type: 'flag' | 'block' | 'warn' | 'log' | 'transform' | 'notify';
  parameters: Record<string, any>;
  message?: string;
}

export interface RuleBuilderState {
  rules: ComplianceRule[];
  selectedRule: ComplianceRule | null;
  draggedItem: DragItem | null;
  canvasItems: CanvasItem[];
  connections: RuleConnection[];
  validationErrors: ValidationError[];
}

export interface CanvasItem {
  id: string;
  ruleId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  type: 'rule' | 'condition' | 'action' | 'connector';
  data: any;
}

export interface RuleConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'flow' | 'data' | 'condition';
  label?: string;
}

export interface ValidationError {
  id: string;
  ruleId: string;
  type: 'syntax' | 'logic' | 'dependency' | 'security';
  message: string;
  severity: 'error' | 'warning';
  line?: number;
  column?: number;
}

// AI Integration Types
export interface AIInsight {
  id: string;
  type: 'vulnerability' | 'optimization' | 'compliance' | 'best-practice';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  framework: string;
  evidence: AIEvidence[];
  recommendations: RemediationSuggestion[];
  relatedInsights: string[];
}

export interface AIEvidence {
  id: string;
  type: 'code' | 'pattern' | 'configuration' | 'behavior';
  location: {
    file?: string;
    line?: number;
    column?: number;
    range?: { start: number; end: number };
  };
  content: string;
  explanation: string;
}

export interface AIAnalysisSession {
  id: string;
  workflowId: string;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  progress: number;
  insights: AIInsight[];
  metrics: {
    linesAnalyzed: number;
    issuesFound: number;
    securityScore: number;
    complianceScore: number;
    performanceScore: number;
  };
}

// Component Props Types
export interface CodeAnalysisEditorProps {
  workflow: PowerAutomateWorkflow;
  analysisResults: CodeAnalysisResult[];
  onCodeChange: (code: string) => void;
  onAnalysisRequest: (context: AIAnalysisContext) => void;
  isAnalyzing: boolean;
  theme?: 'light' | 'dark';
  readOnly?: boolean;
}

export interface AIFeedbackPanelProps {
  insights: AIInsight[];
  analysisSession: AIAnalysisSession | null;
  onInsightSelect: (insight: AIInsight) => void;
  onApplySuggestion: (suggestion: RemediationSuggestion) => void;
  isLoading: boolean;
}

export interface CodeComparisonViewProps {
  originalCode: string;
  suggestedCode: string;
  differences: CodeDifference[];
  onAcceptChange: (change: CodeDifference) => void;
  onRejectChange: (change: CodeDifference) => void;
}

export interface CodeDifference {
  id: string;
  type: 'addition' | 'deletion' | 'modification';
  lineNumber: number;
  originalText: string;
  suggestedText: string;
  reason: string;
  confidence: number;
}

export interface RuleBuilderCanvasProps {
  rules: ComplianceRule[];
  onRuleCreate: (rule: Partial<ComplianceRule>) => void;
  onRuleUpdate: (id: string, updates: Partial<ComplianceRule>) => void;
  onRuleDelete: (id: string) => void;
  onValidate: (rules: ComplianceRule[]) => ValidationError[];
}

export interface RuleComponentLibraryProps {
  categories: RuleCategory[];
  onDragStart: (item: DragItem) => void;
  onDragEnd: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export interface RuleCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  components: RuleComponent[];
}

export interface RuleComponent {
  id: string;
  name: string;
  description: string;
  type: 'condition' | 'action' | 'validation' | 'transformation';
  icon: string;
  template: Partial<ComplianceRule>;
  examples: string[];
}

// Monaco Editor Language Definition
export interface PowerAutomateLanguageDefinition {
  id: string;
  extensions: string[];
  aliases: string[];
  mimetypes: string[];
  tokenizer: {
    root: Array<[RegExp | string, string | string[]]>;
    keywords: string[];
    operators: string[];
    symbols: RegExp;
    escapes: RegExp;
  };
  theme: {
    base: 'vs' | 'vs-dark' | 'hc-black';
    inherit: boolean;
    rules: Array<{
      token: string;
      foreground?: string;
      background?: string;
      fontStyle?: string;
    }>;
    colors: Record<string, string>;
  };
}

// Export utility types
export type DragType = 'RULE' | 'CONDITION' | 'ACTION' | 'CONNECTOR';
export type DropResult = {
  dropEffect: string;
  item: DragItem;
  target: string;
};

export type MonacoEditorInstance = editor.IStandaloneCodeEditor;
export type MonacoModel = editor.ITextModel;
