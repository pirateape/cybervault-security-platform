'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { Button, Card, Modal } from '../../../../../libs/ui/primitives';

// Props for modular, accessible MonacoEditorWidget
export interface MonacoEditorWidgetProps {
  value: string;
  language?: string;
  theme?: 'light' | 'dark' | 'system';
  onChange?: (value: string) => void;
  onValidate?: (markers: monaco.editor.IMarker[]) => void;
  onFormat?: (value: string) => void;
  readOnly?: boolean;
  ariaLabel?: string;
  height?: string | number;
  width?: string | number;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
  localStorageKey?: string;
}

// Modular, accessible, theme-aware Monaco Editor React component
export const MonacoEditorWidget: React.FC<MonacoEditorWidgetProps> = ({
  value,
  language = 'typescript',
  theme = 'system',
  onChange,
  onValidate,
  onFormat,
  readOnly = false,
  ariaLabel = 'Rule Editor',
  height = 400,
  width = '100%',
  options = {},
  localStorageKey,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [editorValue, setEditorValue] = useState(value);
  const [showFormatDialog, setShowFormatDialog] = useState(false);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle theme (light/dark/system)
  const getMonacoTheme = useCallback(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'vs-dark' : 'vs';
    }
    return theme === 'dark' ? 'vs-dark' : 'vs';
  }, [theme]);

  // Persist draft to localStorage
  useEffect(() => {
    if (localStorageKey) {
      localStorage.setItem(localStorageKey, editorValue);
    }
  }, [editorValue, localStorageKey]);

  // Load draft from localStorage
  useEffect(() => {
    if (localStorageKey) {
      const draft = localStorage.getItem(localStorageKey);
      if (draft && draft !== value) {
        setEditorValue(draft);
      }
    }
  }, [localStorageKey, value]);

  // Initialize Monaco Editor
  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: editorValue,
        language,
        theme: getMonacoTheme(),
        readOnly,
        automaticLayout: true,
        ariaLabel,
        ...options,
      });
      setIsReady(true);
      // Listen for changes
      editorRef.current.onDidChangeModelContent(() => {
        const newValue = editorRef.current?.getValue() || '';
        setEditorValue(newValue);
        onChange?.(newValue);
      });
      // Listen for validation markers
      monaco.editor.onDidChangeMarkers(() => {
        if (onValidate && editorRef.current) {
          const model = editorRef.current.getModel();
          if (model) {
            const markers = monaco.editor.getModelMarkers({ resource: model.uri });
            onValidate(markers);
          }
        }
      });
    }
    // Cleanup
    return () => {
      editorRef.current?.dispose();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update theme dynamically
  useEffect(() => {
    if (editorRef.current) {
      monaco.editor.setTheme(getMonacoTheme());
    }
  }, [theme, getMonacoTheme]);

  // Update value from props
  useEffect(() => {
    if (editorRef.current && value !== editorValue) {
      editorRef.current.setValue(value);
      setEditorValue(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Format code (if supported)
  const handleFormat = async () => {
    try {
      await editorRef.current?.getAction('editor.action.formatDocument')?.run();
      setShowFormatDialog(false);
      onFormat?.(editorRef.current?.getValue() || '');
    } catch (err) {
      setError('Format failed.');
    }
  };

  // Keyboard navigation: focus editor on mount
  useEffect(() => {
    if (isReady && editorRef.current) {
      editorRef.current.focus();
    }
  }, [isReady]);

  return (
    <Card aria-label="Monaco Editor Widget" style={{ width: '100%', padding: 8, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 600 }}>Rule Editor</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={() => setShowFormatDialog(true)} aria-label="Format code" type="button" variant="outline" colorScheme="brand">Format</Button>
          <Button onClick={() => setShowValidateDialog(true)} aria-label="Validate code" type="button" variant="outline" colorScheme="brand">Validate</Button>
        </div>
      </div>
      <div
        ref={containerRef}
        style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', boxSizing: 'border-box', height, minHeight: 200 }}
        tabIndex={0}
        aria-label={ariaLabel}
        role="region"
      />
      {/* ARIA live region for loading */}
      {!isReady && (
        <div role="status" aria-live="polite" style={{ minHeight: 160, width: '100%', marginTop: 8, background: '#f3f4f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Loading editor...
        </div>
      )}
      {/* ARIA live region for error */}
      {error && (
        <Card variant="outline" colorScheme="danger" role="alert" aria-live="assertive" style={{ marginTop: 8, padding: 12 }}>
          {error}
        </Card>
      )}
      {/* Format Modal */}
      <Modal isOpen={showFormatDialog} onClose={() => setShowFormatDialog(false)} title="Format Code">
        <Card style={{ padding: 24 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Format Code</h2>
          <p style={{ marginBottom: 16 }}>Format the rule code for readability?</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={handleFormat} variant="solid" colorScheme="brand">Format</Button>
            <Button onClick={() => setShowFormatDialog(false)} type="button" variant="outline" colorScheme="secondary">Cancel</Button>
          </div>
        </Card>
      </Modal>
      {/* Validate Modal */}
      <Modal isOpen={showValidateDialog} onClose={() => setShowValidateDialog(false)} title="Validate Code">
        <Card style={{ padding: 24 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Validate Code</h2>
          <p style={{ marginBottom: 16 }}>Validation runs automatically as you type. See error markers in the editor.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => setShowValidateDialog(false)} type="button" variant="outline" colorScheme="secondary">Close</Button>
          </div>
        </Card>
      </Modal>
      {/* TODO: Add RBAC, audit logging, and collaborative editing extensibility */}
      {/* TODO: Expand Storybook stories and add automated a11y/visual regression tests */}
    </Card>
  );
};

// Best practices:
// - Modular, accessible, theme-aware, and extensible.
// - Use Headless UI for dialogs/menus.
// - Use DaisyUI/Tailwind for styling.
// - Persist drafts for user experience.
// - Expose all editor events as props for parent control.
// - Add ARIA and keyboard navigation for accessibility. 