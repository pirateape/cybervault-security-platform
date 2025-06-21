'use client';

import React, { useState } from 'react';
import { Card } from '@ui/primitives/Card';
import { Button } from '@ui/primitives/Button';
import { useApiVersions, useApiDocumentation, useTestApiEndpoint, useGenerateCodeExample } from '@data-access/externalApiManagementApi';

// Custom Icons
const BookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const CodeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <polyline points="16,18 22,12 16,6"/>
    <polyline points="8,6 2,12 8,18"/>
  </svg>
);

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <polygon points="5,3 19,12 5,21"/>
  </svg>
);

const CopyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

const GitBranchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <line x1="6" y1="3" x2="6" y2="15"/>
    <circle cx="18" cy="6" r="3"/>
    <circle cx="6" cy="18" r="3"/>
    <path d="M18 9a9 9 0 0 1-9 9"/>
  </svg>
);

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>
);

const SendIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22,2 15,22 11,13 2,9"/>
  </svg>
);

export function ApiDocumentation() {
  const [selectedVersion, setSelectedVersion] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<any>(null);
  const [testParams, setTestParams] = useState<Record<string, any>>({});
  const [testHeaders, setTestHeaders] = useState<Record<string, string>>({});
  const [selectedLanguage, setSelectedLanguage] = useState<'javascript' | 'python' | 'curl' | 'php' | 'go'>('javascript');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const { data: apiVersions, isLoading: versionsLoading } = useApiVersions();
  const { data: apiDocs, isLoading: docsLoading } = useApiDocumentation(selectedVersion);
  const testEndpoint = useTestApiEndpoint();
  const generateCode = useGenerateCodeExample();

  const handleTestEndpoint = async () => {
    if (!selectedEndpoint) return;
    
    try {
      await testEndpoint.mutateAsync({
        endpoint: selectedEndpoint.path,
        method: selectedEndpoint.method,
        parameters: testParams,
        headers: testHeaders
      });
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  const handleGenerateCode = async () => {
    if (!selectedEndpoint) return;
    
    try {
      await generateCode.mutateAsync({
        endpoint: selectedEndpoint.path,
        method: selectedEndpoint.method,
        language: selectedLanguage
      });
    } catch (error) {
      console.error('Code generation failed:', error);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const filteredEndpoints = apiDocs?.endpoints?.filter(endpoint =>
    endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    endpoint.summary.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'PATCH': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">API Documentation</h3>
          <p className="text-sm text-gray-600">Interactive documentation with code examples and testing capabilities</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Version Selector */}
          {versionsLoading ? (
            <div className="animate-pulse">
              <div className="h-8 w-24 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {apiVersions?.map((version) => (
                <option key={version.version} value={version.version}>
                  v{version.version} {version.status === 'deprecated' ? '(deprecated)' : ''}
                </option>
              ))}
            </select>
          )}
          
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search endpoints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* API Overview */}
      {docsLoading ? (
        <Card variant="elevated">
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </Card>
      ) : apiDocs ? (
        <Card variant="elevated">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookIcon className="w-8 h-8 text-blue-600" />
              </div>
                             <div className="flex-1">
                 <div className="flex items-center gap-3 mb-2">
                   <h4 className="text-xl font-semibold text-gray-900">API Documentation</h4>
                   <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                     apiDocs.status === 'active' ? 'bg-green-100 text-green-800' :
                     apiDocs.status === 'deprecated' ? 'bg-yellow-100 text-yellow-800' :
                     'bg-red-100 text-red-800'
                   }`}>
                     {apiDocs.status}
                   </span>
                   <div className="flex items-center gap-1 text-sm text-gray-600">
                     <GitBranchIcon className="w-4 h-4" />
                     Version {apiDocs.version}
                   </div>
                 </div>
                 <p className="text-gray-600 mb-4">API documentation and interactive testing interface</p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                     <p className="text-sm text-gray-600">Release Date</p>
                     <span className="text-sm font-medium text-gray-900">
                       {new Date(apiDocs.release_date).toLocaleDateString()}
                     </span>
                   </div>
                   <div>
                     <p className="text-sm text-gray-600">Endpoints</p>
                     <span className="text-sm font-medium text-gray-900">
                       {apiDocs.endpoints.length} available
                     </span>
                   </div>
                   <div>
                     <p className="text-sm text-gray-600">Changes</p>
                     <span className="text-sm font-medium text-gray-900">
                       {apiDocs.changelog.length} updates
                     </span>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Endpoints List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Endpoints List */}
        <Card variant="elevated">
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Endpoints</h4>
            
            {docsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredEndpoints.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredEndpoints.map((endpoint, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedEndpoint(endpoint)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedEndpoint?.path === endpoint.path
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(endpoint.method)}`}>
                        {endpoint.method.toUpperCase()}
                      </span>
                      <code className="text-sm font-mono text-gray-900 flex-1 truncate">
                        {endpoint.path}
                      </code>
                    </div>
                                         <p className="text-sm text-gray-600 mt-1 truncate">{endpoint.summary}</p>
                     <div className="flex items-center gap-2 mt-2">
                       <span className="text-xs text-gray-500">
                         {endpoint.authentication_required ? 'Auth required' : 'No auth'}
                       </span>
                       <span className="text-xs text-gray-500">
                         Rate limit: {endpoint.rate_limit}/min
                       </span>
                     </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchQuery ? 'No endpoints match your search' : 'No endpoints available'}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Endpoint Details */}
        <Card variant="elevated">
          <div className="p-6">
            {selectedEndpoint ? (
              <div className="space-y-6">
                {/* Endpoint Header */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(selectedEndpoint.method)}`}>
                      {selectedEndpoint.method.toUpperCase()}
                    </span>
                    <code className="text-lg font-mono text-gray-900">{selectedEndpoint.path}</code>
                  </div>
                  <p className="text-gray-600">{selectedEndpoint.summary}</p>
                  {selectedEndpoint.description && (
                    <p className="text-sm text-gray-500 mt-2">{selectedEndpoint.description}</p>
                  )}
                </div>

                {/* Parameters */}
                {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3">Parameters</h5>
                    <div className="space-y-3">
                      {selectedEndpoint.parameters.map((param: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <code className="font-mono text-sm text-gray-900">{param.name}</code>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              param.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {param.required ? 'required' : 'optional'}
                            </span>
                            <span className="text-xs text-gray-500">{param.type}</span>
                          </div>
                          <p className="text-sm text-gray-600">{param.description}</p>
                          {param.example && (
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 block">
                              Example: {JSON.stringify(param.example)}
                            </code>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Test Endpoint */}
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">Test Endpoint</h5>
                  <div className="space-y-3">
                    {/* Test Parameters Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Request Parameters (JSON)
                      </label>
                      <textarea
                        value={JSON.stringify(testParams, null, 2)}
                        onChange={(e) => {
                          try {
                            setTestParams(JSON.parse(e.target.value || '{}'));
                          } catch {}
                        }}
                        className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="{}"
                      />
                    </div>
                    
                    {/* Test Headers Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Headers (JSON)
                      </label>
                      <textarea
                        value={JSON.stringify(testHeaders, null, 2)}
                        onChange={(e) => {
                          try {
                            setTestHeaders(JSON.parse(e.target.value || '{}'));
                          } catch {}
                        }}
                        className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder='{"Authorization": "Bearer your-token"}'
                      />
                    </div>
                    
                    <Button
                      onClick={handleTestEndpoint}
                      disabled={testEndpoint.isPending}
                      className="flex items-center gap-2"
                    >
                      {testEndpoint.isPending ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <SendIcon className="w-4 h-4" />
                      )}
                      Test Endpoint
                    </Button>
                    
                    {/* Test Results */}
                    {testEndpoint.data && (
                      <div className="mt-4">
                        <h6 className="font-medium text-gray-900 mb-2">Response</h6>
                        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                          {JSON.stringify(testEndpoint.data, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {testEndpoint.error && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          Error: {testEndpoint.error.message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <CodeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select an endpoint to view details</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Code Examples */}
      {selectedEndpoint && (
        <Card variant="elevated">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Code Examples</h4>
              <div className="flex items-center gap-3">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="curl">cURL</option>
                  <option value="php">PHP</option>
                  <option value="go">Go</option>
                </select>
                
                <Button
                  variant="outline"
                  onClick={handleGenerateCode}
                  disabled={generateCode.isPending}
                  className="flex items-center gap-2"
                >
                  {generateCode.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                  ) : (
                    <CodeIcon className="w-4 h-4" />
                  )}
                  Generate
                </Button>
              </div>
            </div>
            
            {generateCode.data ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => copyToClipboard(generateCode.data.code, 'generated')}
                  className="absolute top-2 right-2 z-10 flex items-center gap-1"
                >
                  {copiedCode === 'generated' ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : (
                    <CopyIcon className="w-4 h-4" />
                  )}
                </Button>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{generateCode.data.code}</code>
                </pre>
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <CodeIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Generate code examples for this endpoint</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
} 