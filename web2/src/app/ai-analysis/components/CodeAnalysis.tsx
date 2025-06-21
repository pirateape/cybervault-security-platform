'use client';

import React, { useState, useRef } from 'react';
import { 
  Play, 
  Upload, 
  Download, 
  Code, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  FileText,
  Zap,
  Clock,
  BarChart3
} from 'lucide-react';

import { useAIAnalysis, AIAnalysisRequest } from '@/libs/data-access/aiAnalysisApi';

const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
];

const ANALYSIS_TYPES = [
  { value: 'security', label: 'Security Analysis' },
  { value: 'performance', label: 'Performance Analysis' },
  { value: 'quality', label: 'Code Quality' },
  { value: 'vulnerability', label: 'Vulnerability Assessment' },
];

export default function CodeAnalysisComponent() {
  const [code, setCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [analysisType, setAnalysisType] = useState('security');
  const [context, setContext] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // React Query hooks
  const analyzeCodeMutation = useAIAnalysis.useAnalyzeCode();
  const { data: analysisHistory, isLoading: historyLoading } = useAIAnalysis.useCodeAnalysisHistory(20);

  const handleAnalyzeCode = async () => {
    if (!code.trim()) {
      return;
    }

    const request: AIAnalysisRequest = {
      code: code.trim(),
      language: selectedLanguage,
      analysisType: analysisType as any,
      context: context.trim() || undefined,
    };

    try {
      await analyzeCodeMutation.mutateAsync(request);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCode(content);
        
        // Auto-detect language from file extension
        const extension = file.name.split('.').pop()?.toLowerCase();
        const languageMap: Record<string, string> = {
          'js': 'javascript',
          'jsx': 'javascript',
          'ts': 'typescript',
          'tsx': 'typescript',
          'py': 'python',
          'java': 'java',
          'cs': 'csharp',
          'cpp': 'cpp',
          'cc': 'cpp',
          'cxx': 'cpp',
          'go': 'go',
          'rs': 'rust',
          'php': 'php',
          'rb': 'ruby',
        };
        
        if (extension && languageMap[extension]) {
          setSelectedLanguage(languageMap[extension]);
        }
      };
      reader.readAsText(file);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplexityColor = (complexity: number) => {
    if (complexity >= 20) return 'text-red-600';
    if (complexity >= 10) return 'text-orange-600';
    if (complexity >= 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Code Input Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Code className="h-5 w-5" />
            Code Analysis Input
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Upload or paste code for AI-powered analysis
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select 
                value={selectedLanguage} 
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analysis Type
              </label>
              <select 
                value={analysisType} 
                onChange={(e) => setAnalysisType(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {ANALYSIS_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Upload className="h-4 w-4" />
                Upload File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept=".js,.jsx,.ts,.tsx,.py,.java,.cs,.cpp,.cc,.cxx,.go,.rs,.php,.rb,.txt"
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here or upload a file..."
              className="block w-full min-h-[300px] font-mono text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Context (Optional)
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Provide additional context about the code, framework, or specific concerns..."
              className="block w-full min-h-[80px] rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAnalyzeCode}
              disabled={!code.trim() || analyzeCodeMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzeCodeMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Analyze Code
                </>
              )}
            </button>
          </div>

          {analyzeCodeMutation.error && (
            <div className="border border-red-200 bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-red-800">
                  Analysis failed: {analyzeCodeMutation.error.message}
                </p>
              </div>
            </div>
          )}

          {analyzeCodeMutation.isSuccess && (
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-green-800">
                  Code analysis completed successfully! Check the results below.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Analysis Results */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Analysis Results
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Latest code analysis results and findings
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {historyLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : analysisHistory && analysisHistory.length > 0 ? (
                analysisHistory.slice(0, 10).map((analysis) => (
                  <div key={analysis.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-sm">{analysis.filename}</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {analysis.language}
                        </span>
                      </div>
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-purple-500" />
                        <span>Complexity:</span>
                        <span className={`font-medium ${getComplexityColor(analysis.complexity)}`}>
                          {analysis.complexity.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-green-500" />
                        <span>Maintainability:</span>
                        <span className="font-medium">{analysis.maintainabilityIndex.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Issues:</span>
                      {['critical', 'high', 'medium', 'low'].map((severity) => {
                        const count = analysis.issues.filter(issue => issue.severity === severity).length;
                        return count > 0 ? (
                          <span
                            key={severity}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(severity)}`}
                          >
                            {count} {severity}
                          </span>
                        ) : null;
                      })}
                    </div>

                    {analysis.aiInsights && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium mb-1">AI Insights:</p>
                        <p className="text-sm text-blue-700">{analysis.aiInsights}</p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(analysis.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Analysis Results</p>
                  <p className="text-sm">Upload and analyze code to see results here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analysis Statistics */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analysis Statistics
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Code quality metrics and trends
            </p>
          </div>
          <div className="p-6">
            {analysisHistory && analysisHistory.length > 0 ? (
              <div className="space-y-6">
                {/* Complexity Distribution */}
                <div>
                  <h4 className="font-medium text-sm mb-3">Complexity Distribution</h4>
                  <div className="space-y-2">
                    {['Low (0-5)', 'Medium (5-10)', 'High (10-20)', 'Very High (20+)'].map((range, index) => {
                      const [label, rangeStr] = range.split(' ');
                      const [min, max] = rangeStr.slice(1, -1).split('-').map(n => n === '+' ? Infinity : parseInt(n));
                      const count = analysisHistory.filter(a => {
                        const complexity = a.complexity;
                        return max === Infinity ? complexity >= min : complexity >= min && complexity < max;
                      }).length;
                      const percentage = (count / analysisHistory.length) * 100;
                      
                      return (
                        <div key={range} className="flex items-center gap-3">
                          <span className="text-sm w-24">{label}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm w-12 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Language Distribution */}
                <div>
                  <h4 className="font-medium text-sm mb-3">Language Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(
                      analysisHistory.reduce((acc, a) => {
                        acc[a.language] = (acc[a.language] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([language, count]) => {
                      const percentage = (count / analysisHistory.length) * 100;
                      
                      return (
                        <div key={language} className="flex items-center gap-3">
                          <span className="text-sm w-20 capitalize">{language}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm w-12 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Statistics Available</p>
                <p className="text-sm">Analyze some code to see statistics and trends</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 