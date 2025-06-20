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
  Spinner,
  Flex,
  IconButton,
  Tooltip,
  NativeSelectRoot,
  NativeSelectField,
  SwitchRoot,
  SwitchControl,
  SwitchThumb,
  FieldRoot,
  FieldLabel,
  Dialog,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogCloseTrigger,
  DialogBody,
  useDisclosure,
  createToaster,
  Skeleton,
  Spacer,
} from '@chakra-ui/react';
import {
  FiPlay,
  FiRefreshCw,
  FiDownload,
  FiSettings,
  FiEye,
  FiCode,
} from 'react-icons/fi';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

export interface CodeAnalysisEditorProps {
  value: string;
  language: 'json' | 'javascript';
  onChange?: (value: string) => void;
  onRequestAnalysis?: () => void;
  isAnalyzing?: boolean;
  theme?: 'dark' | 'light';
  readOnly?: boolean;
}

const CodeAnalysisEditor: React.FC<CodeAnalysisEditorProps> = ({
  value,
  language,
  onChange,
  onRequestAnalysis,
  isAnalyzing = false,
  theme = 'dark',
  readOnly = false,
}) => {
  const editorRef = useRef<any>(null);
  const [editorTheme, setEditorTheme] = useState(
    theme === 'dark' ? 'vs-dark' : 'vs'
  );
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on');
  const [fontSize, setFontSize] = useState(14);
  const toaster = createToaster({ placement: 'top' });

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleCodeChange = (value: string | undefined) => {
    if (onChange && value !== undefined) {
      onChange(value);
    }
  };

  return (
    <Box
      bg={{ base: 'white', _dark: 'gray.800' }}
      borderRadius="lg"
      borderWidth={1}
      borderColor={{ base: 'gray.200', _dark: 'gray.600' }}
      p={4}
      boxShadow="md"
      minH="400px"
      position="relative"
    >
      <Flex align="center" mb={2} gap={2}>
        <Text fontWeight="bold" fontSize="lg">
          Code Analysis Editor
        </Text>
        <Spacer />
        <Button
          size="sm"
          colorScheme="blue"
          onClick={onRequestAnalysis}
          loading={isAnalyzing}
        >
          <FiPlay />
          Analyze
        </Button>
        <Box display="flex" alignItems="center" gap={2}>
          <Text fontSize="sm">Line Numbers</Text>
          <SwitchRoot
            checked={showLineNumbers}
            onCheckedChange={() => setShowLineNumbers((v) => !v)}
            size="sm"
          >
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
          </SwitchRoot>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Text fontSize="sm">Word Wrap</Text>
          <SwitchRoot
            checked={wordWrap === 'on'}
            onCheckedChange={() =>
              setWordWrap((w) => (w === 'on' ? 'off' : 'on'))
            }
            size="sm"
          >
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
          </SwitchRoot>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Text fontSize="sm">Font Size</Text>
          <NativeSelectRoot size="sm" maxW="70px">
            <NativeSelectField
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            >
              {[12, 14, 16, 18, 20].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </NativeSelectField>
          </NativeSelectRoot>
        </Box>
      </Flex>
      <Box flex="1" position="relative" minH="320px">
        <Suspense
          fallback={
            <Box
              w="100%"
              h="100%"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Spinner size="xl" color="blue.500" />
              <Text ml={4}>Loading code editor...</Text>
            </Box>
          }
        >
          <MonacoEditor
            height="320px"
            language={language}
            theme={editorTheme}
            value={value}
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
      </Box>
    </Box>
  );
};

export default CodeAnalysisEditor;
