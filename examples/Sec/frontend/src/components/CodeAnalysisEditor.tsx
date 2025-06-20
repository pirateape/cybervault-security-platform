import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  lazy,
  Suspense,
} from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Badge,
  Spinner,
  useColorModeValue,
  Flex,
  IconButton,
  Tooltip,
  Select,
  Switch,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  List,
  ListItem,
  ListIcon,
  useToast,
  Skeleton,
} from '@chakra-ui/react';
import {
  FiPlay,
  FiRefreshCw,
  FiDownload,
  FiSettings,
  FiEye,
  FiCode,
} from 'react-icons/fi';
import { InfoOutlineIcon } from '@chakra-ui/icons';
import type { editor } from 'monaco-editor';
import type {
  CodeAnalysisEditorProps,
  PowerAutomateWorkflow,
  CodeAnalysisResult,
  AIAnalysisContext,
  MonacoEditorInstance,
} from '../types/phase2';
import { debounce } from 'lodash';
import { useCodeAnalysis } from '../api/analysisApi';
import type {
  CodeAnalysisRequest,
  CodeAnalysisResponse,
  APIError,
} from '../api/analysisApi';
import { useAuth } from '../context/AuthContext';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

const CodeAnalysisEditor: React.FC<CodeAnalysisEditorProps> = ({
  workflow,
  analysisResults = [],
  onCodeChange,
  onAnalysisRequest,
  isAnalyzing = false,
  theme = 'dark',
  readOnly = false,
}) => {
  const editorRef = useRef<MonacoEditorInstance | null>(null);
  const [editorTheme, setEditorTheme] = useState(
    theme === 'dark' ? 'vs-dark' : 'vs'
  );
  const [language, setLanguage] = useState<'json' | 'javascript'>('json');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on');
  const [fontSize, setFontSize] = useState(14);
  const [analysisFramework, setAnalysisFramework] = useState<
    'NIST' | 'ISO27001' | 'GDPR'
  >('NIST');
  const [pendingCode, setPendingCode] = useState(workflow.content);
  const toast = useToast();
  const codeAnalysis = useCodeAnalysis();
  const { user } = useAuth();

  // Chakra UI theme colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  // Debounced analysis trigger
  const debouncedAnalyze = useRef(
    debounce((code: string) => {
      if (!isAnalyzing && editorRef.current) {
        const context: AIAnalysisContext = {
          workflowId: workflow.id,
          analysisType: 'security',
          framework: analysisFramework,
          customRules: [],
        };
        onAnalysisRequest(context);
      }
    }, 500)
  ).current;

  // Listen to code changes for real-time analysis
  useEffect(() => {
    setPendingCode(workflow.content);
    debouncedAnalyze(workflow.content);
    return () => {
      debouncedAnalyze.cancel();
    };
  }, [workflow.content, analysisFramework]);

  // Handle editor mount
  const handleEditorDidMount = useCallback(
    (editor: MonacoEditorInstance, monaco: any) => {
      editorRef.current = editor;

      // Configure editor options
      editor.updateOptions({
        fontSize: fontSize,
        wordWrap: wordWrap,
        lineNumbers: showLineNumbers ? 'on' : 'off',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        readOnly: readOnly,
      });

      // Add markers for analysis results
      updateEditorMarkers(editor, monaco);

      // Add keyboard shortcuts
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => {
        handleAnalyzeCode();
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        handleSaveWorkflow();
      });

      // Format code: Ctrl+Shift+F
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
        () => {
          handleFormatCode();
        }
      );

      // Command palette: Ctrl+Shift+P (Monaco built-in)
      // Note: Monaco's command palette is accessible by default, but you can trigger it programmatically if needed.
      // Example: editor.trigger('keyboard', 'editor.action.quickCommand', null);
    },
    [fontSize, wordWrap, showLineNumbers, readOnly, analysisResults]
  );

  // Update editor markers when analysis results change
  const updateEditorMarkers = useCallback(
    (editor: MonacoEditorInstance, monaco: any) => {
      if (!editor || !monaco) return;

      const model = editor.getModel();
      if (!model) return;

      const markers = analysisResults.map((result: CodeAnalysisResult) => ({
        startLineNumber: result.line,
        startColumn: result.column,
        endLineNumber: result.line,
        endColumn: result.column + 10, // Approximate end column
        message: result.message,
        severity: getSeverityLevel(result.severity, monaco),
        source: result.source,
        code: result.code,
      }));

      monaco.editor.setModelMarkers(model, 'powerautomate-analysis', markers);
    },
    [analysisResults]
  );

  // Get Monaco severity level
  const getSeverityLevel = (
    severity: 'error' | 'warning' | 'info',
    monaco: any
  ) => {
    switch (severity) {
      case 'error':
        return monaco.MarkerSeverity.Error;
      case 'warning':
        return monaco.MarkerSeverity.Warning;
      case 'info':
        return monaco.MarkerSeverity.Info;
      default:
        return monaco.MarkerSeverity.Info;
    }
  };

  // Handle code changes
  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        onCodeChange(value);
      }
    },
    [onCodeChange]
  );

  // Handle analysis request
  const handleAnalyzeCode = useCallback(() => {
    if (!user) {
      toast({
        status: 'error',
        title: 'Not Authenticated',
        description: 'You must be logged in to analyze code.',
      });
      return;
    }
    const req: CodeAnalysisRequest = {
      code: workflow.content,
      language,
      org_id: user.org_id,
      user_id: user.id,
      metadata: {},
    };
    codeAnalysis.mutate(req, {
      onSuccess: (data) => {
        if ('diagnostics' in data && data.success) {
          // Optionally: call onAnalysisRequest or update parent state with new diagnostics
          // For now, just show a toast for success
          toast({
            status: 'success',
            title: 'Analysis Complete',
            description: data.summary,
          });
          // Optionally: onAnalysisRequest({ ... }) or set local state
        } else if ('error' in data) {
          toast({
            status: 'error',
            title: 'Analysis Error',
            description: data.error.message,
          });
        }
      },
      onError: (err) => {
        toast({
          status: 'error',
          title: 'Network Error',
          description: err.message,
        });
      },
    });
  }, [workflow.content, language, user, codeAnalysis, toast]);

  // Handle workflow save
  const handleSaveWorkflow = useCallback(() => {
    if (!editorRef.current) return;

    const code = editorRef.current.getValue();
    // Trigger save logic here
    console.log('Saving workflow:', { ...workflow, content: code });
  }, [workflow]);

  // Handle format code
  const handleFormatCode = useCallback(() => {
    if (!editorRef.current) return;

    editorRef.current.getAction('editor.action.formatDocument')?.run();
  }, []);

  // Handle download workflow
  const handleDownloadWorkflow = useCallback(() => {
    if (!editorRef.current) return;

    const code = editorRef.current.getValue();
    const blob = new Blob([code], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [workflow.name]);

  // Update editor theme when prop changes
  useEffect(() => {
    setEditorTheme(theme === 'dark' ? 'vs-dark' : 'vs');
  }, [theme]);

  // Update editor options when settings change
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize: fontSize,
        wordWrap: wordWrap,
        lineNumbers: showLineNumbers ? 'on' : 'off',
      });
    }
  }, [fontSize, wordWrap, showLineNumbers]);

  // Get analysis summary
  const getAnalysisSummary = () => {
    const errors = analysisResults.filter((r) => r.severity === 'error').length;
    const warnings = analysisResults.filter(
      (r) => r.severity === 'warning'
    ).length;
    const info = analysisResults.filter((r) => r.severity === 'info').length;

    return { errors, warnings, info, total: analysisResults.length };
  };

  const summary = getAnalysisSummary();

  const {
    isOpen: isHelpOpen,
    onOpen: onHelpOpen,
    onClose: onHelpClose,
  } = useDisclosure();

  return (
    <Box
      bg={bgColor}
      border="1px"
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
      h="600px"
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Box
        bg={headerBg}
        px={4}
        py={3}
        borderBottom="1px"
        borderColor={borderColor}
      >
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold" fontSize="lg">
              {workflow.name}
            </Text>
            <HStack spacing={2}>
              <Badge colorScheme="blue" variant="subtle">
                {workflow.language.toUpperCase()}
              </Badge>
              <Badge colorScheme="green" variant="subtle">
                v{workflow.version}
              </Badge>
              {summary.total > 0 && (
                <HStack spacing={1}>
                  {summary.errors > 0 && (
                    <Badge colorScheme="red" variant="solid">
                      {summary.errors} errors
                    </Badge>
                  )}
                  {summary.warnings > 0 && (
                    <Badge colorScheme="orange" variant="solid">
                      {summary.warnings} warnings
                    </Badge>
                  )}
                  {summary.info > 0 && (
                    <Badge colorScheme="blue" variant="solid">
                      {summary.info} info
                    </Badge>
                  )}
                </HStack>
              )}
            </HStack>
          </VStack>

          <HStack spacing={2}>
            {/* Analysis Framework Selector */}
            <Select
              size="sm"
              w="120px"
              value={analysisFramework}
              onChange={(e) => setAnalysisFramework(e.target.value as any)}
            >
              <option value="NIST">NIST</option>
              <option value="ISO27001">ISO 27001</option>
              <option value="GDPR">GDPR</option>
            </Select>

            {/* Action Buttons */}
            <Tooltip label="Analyze Code (Ctrl+R)">
              <Button
                size="sm"
                leftIcon={isAnalyzing ? <Spinner size="xs" /> : <FiPlay />}
                colorScheme="blue"
                onClick={handleAnalyzeCode}
                isLoading={codeAnalysis.isPending}
                loadingText="Analyzing"
                disabled={codeAnalysis.isPending}
              >
                Analyze
              </Button>
            </Tooltip>

            <Tooltip label="Format Code">
              <IconButton
                size="sm"
                icon={<FiCode />}
                onClick={handleFormatCode}
                aria-label="Format code"
              />
            </Tooltip>

            <Tooltip label="Download Workflow">
              <IconButton
                size="sm"
                icon={<FiDownload />}
                onClick={handleDownloadWorkflow}
                aria-label="Download workflow"
              />
            </Tooltip>

            <Tooltip label="Refresh">
              <IconButton
                size="sm"
                icon={<FiRefreshCw />}
                onClick={() => window.location.reload()}
                aria-label="Refresh"
              />
            </Tooltip>

            <Tooltip label="Editor Help & Shortcuts">
              <IconButton
                size="sm"
                icon={<InfoOutlineIcon />}
                aria-label="Editor Help & Shortcuts"
                onClick={onHelpOpen}
              />
            </Tooltip>
          </HStack>
        </Flex>

        {/* Editor Settings */}
        <HStack spacing={4} mt={3}>
          <FormControl display="flex" alignItems="center" w="auto">
            <FormLabel htmlFor="language-select" mb="0" fontSize="sm">
              Language:
            </FormLabel>
            <Select
              id="language-select"
              size="xs"
              w="100px"
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
            >
              <option value="json">JSON</option>
              <option value="javascript">JavaScript</option>
            </Select>
          </FormControl>

          <FormControl display="flex" alignItems="center" w="auto">
            <FormLabel htmlFor="font-size" mb="0" fontSize="sm">
              Font Size:
            </FormLabel>
            <Select
              id="font-size"
              size="xs"
              w="80px"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            >
              <option value={12}>12px</option>
              <option value={14}>14px</option>
              <option value={16}>16px</option>
              <option value={18}>18px</option>
            </Select>
          </FormControl>

          <FormControl display="flex" alignItems="center" w="auto">
            <FormLabel htmlFor="line-numbers" mb="0" fontSize="sm">
              Line Numbers
            </FormLabel>
            <Switch
              id="line-numbers"
              size="sm"
              isChecked={showLineNumbers}
              onChange={(e) => setShowLineNumbers(e.target.checked)}
            />
          </FormControl>

          <FormControl display="flex" alignItems="center" w="auto">
            <FormLabel htmlFor="word-wrap" mb="0" fontSize="sm">
              Word Wrap
            </FormLabel>
            <Switch
              id="word-wrap"
              size="sm"
              isChecked={wordWrap === 'on'}
              onChange={(e) => setWordWrap(e.target.checked ? 'on' : 'off')}
            />
          </FormControl>
        </HStack>
      </Box>

      {/* Monaco Editor */}
      <Box flex="1" position="relative">
        <Suspense
          fallback={
            <Box
              w="100%"
              h="100%"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Spinner size="xl" color="blue.500" thickness="4px" />
              <Text ml={4}>Loading code editor...</Text>
            </Box>
          }
        >
          <MonacoEditor
            height="100%"
            language={language}
            theme={editorTheme}
            value={workflow.content}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            options={{
              fontSize: fontSize,
              wordWrap: wordWrap,
              lineNumbers: showLineNumbers ? 'on' : 'off',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              readOnly: readOnly,
              contextmenu: true,
              selectOnLineNumbers: true,
              roundedSelection: false,
              cursorStyle: 'line',
              glyphMargin: true,
              folding: true,
              foldingStrategy: 'auto',
              showFoldingControls: 'always',
              unfoldOnClickAfterEndOfLine: false,
              bracketPairColorization: { enabled: true },
            }}
          />
        </Suspense>

        {/* Analysis Loading Overlay */}
        {codeAnalysis.isPending && (
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg="blackAlpha.300"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex="overlay"
          >
            <VStack spacing={3}>
              <Spinner size="xl" color="blue.500" thickness="4px" />
              <Text color="white" fontWeight="bold">
                Analyzing workflow with AI...
              </Text>
              <Text color="gray.300" fontSize="sm">
                Framework: {analysisFramework}
              </Text>
            </VStack>
          </Box>
        )}
      </Box>

      {/* Status Bar */}
      <Box
        bg={headerBg}
        px={4}
        py={2}
        borderTop="1px"
        borderColor={borderColor}
      >
        <HStack justify="space-between" fontSize="sm">
          <HStack spacing={4}>
            <Text>Lines: {workflow.content.split('\n').length}</Text>
            <Text>Characters: {workflow.content.length}</Text>
            <Text>Language: {language.toUpperCase()}</Text>
          </HStack>

          <HStack spacing={4}>
            {summary.total > 0 && (
              <Text>
                Issues: {summary.total} ({summary.errors} errors,{' '}
                {summary.warnings} warnings)
              </Text>
            )}
            <Text color="green.500">Ready</Text>
          </HStack>
        </HStack>
      </Box>

      {/* Help Modal for Shortcuts & Settings */}
      <Modal isOpen={isHelpOpen} onClose={onHelpClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editor Shortcuts & Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontWeight="bold" mb={2}>
              Keyboard Shortcuts
            </Text>
            <List spacing={1} mb={3} fontSize="sm">
              <ListItem>
                <ListIcon as={FiPlay} color="blue.400" />
                Ctrl+R: Analyze code
              </ListItem>
              <ListItem>
                <ListIcon as={FiCode} color="purple.400" />
                Ctrl+Shift+F: Format code
              </ListItem>
              <ListItem>
                <ListIcon as={FiDownload} color="green.400" />
                Ctrl+S: Save workflow
              </ListItem>
              <ListItem>
                <ListIcon as={FiRefreshCw} color="gray.400" />
                Ctrl+Shift+P: Command palette (Monaco built-in)
              </ListItem>
              <ListItem>
                F8/Shift+F8: Next/previous error/warning (Monaco built-in)
              </ListItem>
              <ListItem>Alt+F1: Accessibility help (Monaco built-in)</ListItem>
            </List>
            <Text fontWeight="bold" mb={2}>
              User-Configurable Settings
            </Text>
            <List spacing={1} mb={3} fontSize="sm">
              <ListItem>Font size (12px, 14px, 16px, 18px)</ListItem>
              <ListItem>Theme (light/dark, follows app theme)</ListItem>
              <ListItem>Word wrap (on/off)</ListItem>
              <ListItem>Line numbers (on/off)</ListItem>
              <ListItem>Language (JSON/JavaScript)</ListItem>
            </List>
            <Text fontWeight="bold" mb={2}>
              Coming Soon
            </Text>
            <List spacing={1} fontSize="sm">
              <ListItem>User-configurable keyboard shortcuts</ListItem>
              <ListItem>Custom keybinding profiles</ListItem>
              <ListItem>More editor personalization options</ListItem>
            </List>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CodeAnalysisEditor;
