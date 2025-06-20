// Power Automate Language Definition for Monaco Editor
import { languages, editor, Range } from 'monaco-editor';
import type { PowerAutomateLanguageDefinition } from '../types/phase2';

export const POWER_AUTOMATE_LANGUAGE_ID = 'powerautomate';

// Power Automate keywords and tokens
const POWER_AUTOMATE_KEYWORDS = [
  // Triggers
  'trigger',
  'when',
  'manual',
  'recurrence',
  'http',
  'sharepoint',
  'outlook',
  'teams',
  'dataverse',
  'onedrive',
  'excel',
  'forms',
  'approval',

  // Actions
  'action',
  'compose',
  'condition',
  'switch',
  'apply',
  'each',
  'until',
  'scope',
  'terminate',
  'delay',
  'response',
  'send',
  'create',
  'update',
  'delete',
  'get',
  'list',
  'filter',
  'select',
  'join',
  'split',

  // Control structures
  'if',
  'else',
  'elseif',
  'then',
  'and',
  'or',
  'not',
  'equals',
  'contains',
  'startsWith',
  'endsWith',
  'greater',
  'less',
  'empty',
  'null',

  // Data types
  'string',
  'number',
  'boolean',
  'array',
  'object',
  'date',
  'time',

  // Functions
  'concat',
  'substring',
  'indexOf',
  'length',
  'replace',
  'trim',
  'toLower',
  'toUpper',
  'formatDateTime',
  'addDays',
  'addHours',
  'addMinutes',
  'utcNow',
  'convertTimeZone',
  'parseJson',
  'json',
  'xml',
  'base64',
  'encodeUriComponent',
  'decodeUriComponent',
  'guid',
  'rand',
  'range',

  // Connectors
  'sharepoint',
  'outlook',
  'teams',
  'onedrive',
  'excel',
  'word',
  'powerpoint',
  'dynamics365',
  'salesforce',
  'twitter',
  'facebook',
  'instagram',
  'youtube',
  'dropbox',
  'googledrive',
  'box',
  'ftp',
  'sftp',
  'sql',
  'mysql',
  'oracle',
  'cosmosdb',
  'azureblob',
  'azuretable',
  'azurequeue',
  'servicebus',

  // Properties
  'displayName',
  'description',
  'type',
  'inputs',
  'outputs',
  'metadata',
  'runAfter',
  'runtimeConfiguration',
  'trackedProperties',
  'operationOptions',
];

const POWER_AUTOMATE_OPERATORS = [
  '==',
  '!=',
  '>',
  '<',
  '>=',
  '<=',
  '&&',
  '||',
  '!',
  '+',
  '-',
  '*',
  '/',
  '%',
  '=',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '++',
  '--',
  '?',
  ':',
  '=>',
  '??',
];

const POWER_AUTOMATE_FUNCTIONS = [
  'triggerOutputs',
  'triggerBody',
  'outputs',
  'body',
  'parameters',
  'variables',
  'items',
  'iterationIndexes',
  'workflow',
  'subscription',
  'resourceGroup',
  'listCallbackUrl',
  'listKeys',
  'listSecrets',
  'reference',
  'resourceId',
  'deployment',
  'environment',
  'tenant',
  'subscription',
];

// Monaco Monarch tokenizer definition
const monarchTokenizer = {
  tokenizer: {
    root: [
      // Comments
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],

      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/"/, 'string', '@string'],
      [/'([^'\\]|\\.)*$/, 'string.invalid'],
      [/'/, 'string', '@string_single'],

      // Numbers
      [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],
      [/\d+/, 'number'],

      // Keywords
      [/\b(true|false|null|undefined)\b/, 'keyword.constant'],
      [
        /\b(trigger|action|condition|scope|foreach|until|switch|terminate)\b/,
        'keyword.control',
      ],
      [
        /\b(inputs|outputs|runAfter|metadata|runtimeConfiguration)\b/,
        'keyword.property',
      ],

      // Power Automate specific functions
      [
        /\b(triggerOutputs|triggerBody|outputs|body|parameters|variables|items)\b/,
        'keyword.function',
      ],
      [
        /\b(concat|substring|indexOf|length|replace|trim|toLower|toUpper)\b/,
        'keyword.function',
      ],
      [
        /\b(formatDateTime|addDays|addHours|utcNow|convertTimeZone)\b/,
        'keyword.function',
      ],
      [
        /\b(parseJson|json|xml|base64|encodeUriComponent|guid|rand)\b/,
        'keyword.function',
      ],

      // Connectors
      [
        /\b(sharepoint|outlook|teams|onedrive|excel|dynamics365|salesforce)\b/,
        'keyword.connector',
      ],
      [
        /\b(twitter|facebook|dropbox|googledrive|sql|cosmosdb|azureblob)\b/,
        'keyword.connector',
      ],

      // Operators
      [/[{}()\[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [
        /@symbols/,
        {
          cases: {
            '@operators': 'operator',
            '@default': '',
          },
        } as any,
      ],

      // Identifiers
      [
        /[a-zA-Z_$][\w$]*/,
        {
          cases: {
            '@keywords': 'keyword',
            '@default': 'identifier',
          },
        } as any,
      ],

      // Whitespace
      [/[ \t\r\n]+/, 'white'],

      // Delimiters
      [/[,:;]/, 'delimiter'],

      // Power Automate expressions
      [/@\{/, 'expression'],

      // JSON-like structures
      [/\{/, '@brackets'],
      [/\[/, '@brackets'],
    ],

    comment: [
      [/[^\/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[\/*]/, 'comment'],
    ],

    string: [
      [/[^\\"]+/, 'string'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop'],
    ],

    string_single: [
      [/[^\\']+/, 'string'],
      [/\\./, 'string.escape.invalid'],
      [/'/, 'string', '@pop'],
    ],
  },
  keywords: POWER_AUTOMATE_KEYWORDS,
  operators: POWER_AUTOMATE_OPERATORS,
  symbols: /[=><!~?:&|+\-*\/\^%]+/,
  escapes:
    /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
};

// Language definition
export const powerAutomateLanguageDefinition: PowerAutomateLanguageDefinition =
  {
    id: POWER_AUTOMATE_LANGUAGE_ID,
    extensions: ['.json', '.powerautomate'],
    aliases: ['PowerAutomate', 'powerautomate', 'Power Automate'],
    mimetypes: ['application/json', 'application/powerautomate'],
    tokenizer: {
      root: [],
      keywords: POWER_AUTOMATE_KEYWORDS,
      operators: POWER_AUTOMATE_OPERATORS,
      symbols: /[=><!~?:&|+\-*\/\^%]+/,
      escapes:
        /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    },

    theme: {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'keyword.control', foreground: 'C586C0', fontStyle: 'bold' },
        { token: 'keyword.function', foreground: 'DCDCAA' },
        { token: 'keyword.connector', foreground: '4EC9B0', fontStyle: 'bold' },
        { token: 'keyword.property', foreground: '9CDCFE' },
        { token: 'keyword.constant', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'string.invalid', foreground: 'F44747' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'number.float', foreground: 'B5CEA8' },
        { token: 'number.hex', foreground: 'B5CEA8' },
        { token: 'operator', foreground: 'D4D4D4' },
        { token: 'delimiter', foreground: 'D4D4D4' },
        { token: 'identifier', foreground: '9CDCFE' },
        { token: 'expression', foreground: 'FFD700', background: '2D2D30' },
        { token: 'expression.content', foreground: 'FFFF00' },
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editorLineNumber.foreground': '#858585',
        'editorCursor.foreground': '#AEAFAD',
        'editor.selectionBackground': '#264F78',
        'editor.inactiveSelectionBackground': '#3A3D41',
      },
    },
  };

// Register the language with Monaco Editor
export function registerPowerAutomateLanguage(): void {
  // Register the language
  languages.register({
    id: POWER_AUTOMATE_LANGUAGE_ID,
    extensions: powerAutomateLanguageDefinition.extensions,
    aliases: powerAutomateLanguageDefinition.aliases,
    mimetypes: powerAutomateLanguageDefinition.mimetypes,
  });

  // Set the tokenizer
  languages.setMonarchTokensProvider(
    POWER_AUTOMATE_LANGUAGE_ID,
    monarchTokenizer
  );

  // Define the theme
  languages.setLanguageConfiguration(POWER_AUTOMATE_LANGUAGE_ID, {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/'],
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"', notIn: ['string'] },
      { open: "'", close: "'", notIn: ['string', 'comment'] },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    folding: {
      markers: {
        start: new RegExp('^\\s*//\\s*#?region\\b'),
        end: new RegExp('^\\s*//\\s*#?endregion\\b'),
      },
    },
  });
}

// Validation and completion providers
export function registerPowerAutomateProviders(): void {
  // Completion provider for Power Automate functions and keywords
  languages.registerCompletionItemProvider(POWER_AUTOMATE_LANGUAGE_ID, {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions = [
        ...POWER_AUTOMATE_KEYWORDS.map((keyword) => ({
          label: keyword,
          kind: languages.CompletionItemKind.Keyword,
          insertText: keyword,
          documentation: `Power Automate keyword: ${keyword}`,
          range: range,
        })),
        ...POWER_AUTOMATE_FUNCTIONS.map((func) => ({
          label: func,
          kind: languages.CompletionItemKind.Function,
          insertText: `${func}()`,
          documentation: `Power Automate function: ${func}`,
          range: range,
        })),
      ];

      return { suggestions };
    },
  });

  // Hover provider for documentation
  languages.registerHoverProvider(POWER_AUTOMATE_LANGUAGE_ID, {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const wordText = word.word;

      if (POWER_AUTOMATE_KEYWORDS.includes(wordText)) {
        return {
          range: new Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          ),
          contents: [
            { value: `**${wordText}**` },
            { value: `Power Automate keyword for workflow definition` },
          ],
        };
      }

      if (POWER_AUTOMATE_FUNCTIONS.includes(wordText)) {
        return {
          range: new Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          ),
          contents: [
            { value: `**${wordText}()**` },
            { value: `Power Automate function for data manipulation` },
          ],
        };
      }

      return null;
    },
  });
}

// Sample Power Automate workflow for testing
export const samplePowerAutomateWorkflow = `{
  "definition": {
    "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
    "contentVersion": "1.0.0.0",
    "parameters": {},
    "triggers": {
      "manual": {
        "type": "Request",
        "kind": "Http",
        "inputs": {
          "schema": {
            "type": "object",
            "properties": {
              "email": {
                "type": "string"
              },
              "name": {
                "type": "string"
              }
            }
          }
        }
      }
    },
    "actions": {
      "Compose_Welcome_Message": {
        "type": "Compose",
        "inputs": "@{concat('Hello ', triggerBody()?['name'], '! Welcome to our service.')}"
      },
      "Send_Email": {
        "type": "ApiConnection",
        "inputs": {
          "host": {
            "connectionName": "shared_outlook",
            "operationId": "SendEmailV2"
          },
          "parameters": {
            "emailMessage": {
              "To": "@triggerBody()?['email']",
              "Subject": "Welcome!",
              "Body": "@outputs('Compose_Welcome_Message')"
            }
          }
        },
        "runAfter": {
          "Compose_Welcome_Message": ["Succeeded"]
        }
      }
    }
  }
}`;

export default {
  registerPowerAutomateLanguage,
  registerPowerAutomateProviders,
  powerAutomateLanguageDefinition,
  samplePowerAutomateWorkflow,
  POWER_AUTOMATE_LANGUAGE_ID,
};
