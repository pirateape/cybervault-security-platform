import React, { useRef, useEffect } from 'react';
import Editor, { useMonaco, loader, DiffEditor } from '@monaco-editor/react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { WebsocketProvider } from 'y-websocket';

export interface RuleEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  theme?: 'vs-dark' | 'light';
  height?: string | number;
  options?: any;
  readOnly?: boolean;
  ariaLabel?: string;
  collaborative?: boolean;
  documentId?: string; // Unique session or rule id for Yjs doc
  presenceBar?: boolean; // Show presence indicator
  diffView?: boolean;
  originalValue?: string;
}

export const RuleEditor: React.FC<RuleEditorProps> = ({
  value,
  onChange,
  language = 'json',
  theme = 'vs-dark',
  height = 400,
  options = {},
  readOnly = false,
  ariaLabel = 'Rule Editor',
  collaborative = false,
  documentId = 'default-rule',
  presenceBar = true,
  diffView = false,
  originalValue = '',
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const [peers, setPeers] = React.useState<string[]>([]);
  const monaco = useMonaco();

  // Collaborative editing setup
  useEffect(() => {
    if (!collaborative || !editorRef.current) return;
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    const provider = new WebsocketProvider(
      'wss://demos.yjs.dev', // TODO: Replace with your own y-websocket server
      documentId,
      ydoc
    );
    providerRef.current = provider;
    const ytext = ydoc.getText('monaco');
    ytextRef.current = ytext;
    const binding = new MonacoBinding(
      ytext,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      provider.awareness
    );
    // Presence indicator
    const awareness = provider.awareness;
    const updatePeers = () => {
      const states = Array.from(awareness.getStates().values());
      setPeers(states.map((s) => s.user?.name || 'Anonymous'));
    };
    awareness.on('change', updatePeers);
    updatePeers();
    // Clean up
    return () => {
      binding.destroy();
      provider.destroy();
      ydoc.destroy();
    };
  }, [collaborative, documentId, editorRef.current]);

  // Inline help for rule syntax
  const renderHelp = () => (
    <div className="text-xs text-base-content/60 mt-2" aria-live="polite">
      <strong>Rule Syntax Help:</strong> JSON format. Use valid keys and values.{' '}
      <br />
      <span>
        Press <kbd>Ctrl+Space</kbd> for suggestions. <kbd>Ctrl+F</kbd> to
        search. <kbd>Ctrl+K</kbd> for command palette.
      </span>
    </div>
  );

  // Keyboard shortcuts info
  const renderShortcuts = () => (
    <div className="text-xs text-base-content/60 mt-1" aria-live="polite">
      <strong>Shortcuts:</strong> <kbd>Ctrl+S</kbd> Save, <kbd>Ctrl+Z</kbd>{' '}
      Undo, <kbd>Ctrl+Y</kbd> Redo, <kbd>Ctrl+F</kbd> Find
    </div>
  );

  // Validation handler
  function handleValidate(markers: any[]) {
    // Optionally surface validation errors to parent or UI
    // markers.forEach(marker => ...)
  }

  // Editor mount handler
  function handleEditorDidMount(editor: any, monacoInstance: any) {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;
    // Accessibility: set ARIA label
    editor.updateOptions({ ariaLabel });
    // Example: add custom command
    editor.addCommand(
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyK,
      () => {
        // Open command palette or custom action
      }
    );
  }

  // Editor before mount handler (for custom themes, languages, etc.)
  function handleEditorWillMount(monacoInstance: any) {
    // Example: custom theme
    monacoInstance.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#18181b',
      },
    });
    // Example: custom validation (JSON schema)
    if (language === 'json') {
      monacoInstance.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [
          // Add your JSON schema here for rule validation
        ],
      });
    }
  }

  // Editor change handler
  function handleChange(value: string | undefined) {
    if (typeof value === 'string') onChange(value);
  }

  // Diff view support
  if (diffView) {
    return (
      <div style={{ width: '100%' }}>
        <DiffEditor
          height={height}
          language={language}
          theme={theme === 'vs-dark' ? 'vs-dark' : 'light'}
          original={originalValue}
          modified={value}
          options={{
            readOnly,
            renderSideBySide: true,
            ...options,
            ariaLabel,
            automaticLayout: true,
          }}
          onMount={handleEditorDidMount}
          beforeMount={handleEditorWillMount}
        />
        {renderHelp()}
        {renderShortcuts()}
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {presenceBar && collaborative && (
        <div className="mb-2 flex items-center gap-2 text-xs text-base-content/60">
          <span>Live:</span>
          {peers.length === 0 ? (
            <span>Just you</span>
          ) : (
            peers.map((p, i) => <span key={i}>{p}</span>)
          )}
        </div>
      )}
      <Editor
        height={height}
        language={language}
        theme={theme === 'vs-dark' ? 'vs-dark' : 'light'}
        value={value}
        options={{
          readOnly,
          ...options,
          ariaLabel,
          automaticLayout: true,
        }}
        onChange={handleChange}
        onValidate={handleValidate}
        onMount={handleEditorDidMount}
        beforeMount={handleEditorWillMount}
      />
      {renderHelp()}
      {renderShortcuts()}
    </div>
  );
};

export default RuleEditor;
