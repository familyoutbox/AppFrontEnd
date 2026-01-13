import React, { useState, useEffect } from 'react';

import { codebaseAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  FileCode,
  Layout,
  ChevronDown,
  ChevronRight,
  Folder,
  File,
  RefreshCw,
  Copy,
  Download,
  Eye,
  Code2
} from 'lucide-react';

const FileTreeEditor = ({ projectId }) => {
  const [uiFiles, setUiFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [viewMode, setViewMode] = useState('code');

  const getLanguageFromPath = (path) => {
    const lower = path.toLowerCase();
    const ext = lower.includes('.') ? lower.split('.').pop() : '';
    const map = {
      js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
      json: 'json', html: 'html', css: 'css', scss: 'scss', sass: 'scss',
      less: 'less', py: 'python', md: 'markdown', sh: 'bash', bash: 'bash',
      zsh: 'bash', yml: 'yaml', yaml: 'yaml', sql: 'sql', xml: 'xml',
      graphql: 'graphql', gql: 'graphql', dockerfile: 'docker', docker: 'docker',
      makefile: 'makefile', gradle: 'groovy', groovy: 'groovy', properties: 'ini',
      ini: 'ini', env: 'ini', conf: 'ini', toml: 'toml', kt: 'kotlin',
      kts: 'kotlin', swift: 'swift', rs: 'rust', go: 'go', rb: 'ruby',
      php: 'php', java: 'java', c: 'c', h: 'c', cpp: 'cpp', cxx: 'cpp',
      hpp: 'cpp', cs: 'csharp', scala: 'scala', lua: 'lua', perl: 'perl', pl: 'perl'
    };
    if (!ext) {
      if (lower.endsWith('dockerfile')) return 'docker';
      if (lower.endsWith('makefile')) return 'makefile';
    }
    return map[ext] || 'plaintext';
  };

  useEffect(() => {
    loadUIFiles();
  }, [projectId]);

  const loadUIFiles = async () => {
    setLoadingFiles(true);
    try {
      const response = await codebaseAPI.listFiles(projectId);
      const allFiles = response?.data?.files || response?.data || [];
      
      // Filter out internal/debug files that users shouldn't see
      const userVisibleFiles = allFiles.filter(file => {
        const fileName = file.path.split('/').pop();
        const internalFiles = [
          'raw_output.txt',
          '.DS_Store',
          'Thumbs.db',
          'desktop.ini',
          '__pycache__',
          '.pytest_cache',
          '.coverage',
          'npm-debug.log',
          'yarn-error.log',
          '.env.local',
          '.env.*.local'
        ];
        
        // Exclude exact matches and files in cache folders
        return !internalFiles.includes(fileName) && 
               !file.path.includes('__pycache__') &&
               !file.path.includes('.pytest_cache') &&
               !file.path.includes('node_modules/.cache');
      });
      
      setUiFiles(userVisibleFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
      alert('Failed to load files');
    } finally {
      setLoadingFiles(false);
    }
  };

  const loadFileContent = async (file) => {
    try {
      const response = await codebaseAPI.getFileContent(file.id);
      const content = response?.data?.content || response?.content || response?.data || '';
      
      if (!content || content.length === 0) {
        setFileContent('// File content is empty or could not be loaded');
      } else {
        setFileContent(content);
      }
    } catch (error) {
      console.error('ERROR loading file content:', error);
      const errorMsg = error?.response?.data?.detail || error?.message || 'Unknown error';
      setFileContent(`// Unable to load: ${file.path}\n// Error: ${errorMsg}`);
      alert(`Failed to load file: ${errorMsg}`);
    }
  };

  const handleSelectFile = (file) => {
    setSelectedFile(file);
    loadFileContent(file);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fileContent);
      alert('Copied to clipboard!');
    } catch (error) {
      alert('Failed to copy');
    }
  };

  const downloadProject = async () => {
    try {
      alert('Preparing download...');
      
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      
      for (const file of uiFiles) {
        try {
          const response = await codebaseAPI.getFileContent(file.id);
          const content = response?.data?.content || '';
          zip.file(file.path, content);
        } catch (error) {
          console.warn('Failed to download file:', file.path);
        }
      }
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-project-${new Date().getTime()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('Project downloaded!');
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download project');
    }
  };

  const isReactComponent = (path) => /\.(jsx?|tsx?)$/.test(path) && !path.includes('node_modules');
  const isHTMLFile = (path) => /\.html?$/.test(path);

  const buildFileTree = (files) => {
    const tree = {};
    files.forEach(file => {
      const parts = file.path.split('/');
      let current = tree;
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            __meta: { isFolder: index < parts.length - 1, file: null }
          };
        }
        if (index === parts.length - 1) {
          current[part].__meta.file = file;
          current[part].__meta.isFolder = false;
        } else {
          current[part].__meta.isFolder = true;
        }
        current = current[part];
      });
    });
    return tree;
  };

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderTree = (tree, prefix = '') => {
    return Object.entries(tree)
      // Filter out metadata property
      .filter(([name]) => name !== '__meta')
      .sort(([nameA, nodeA], [nameB, nodeB]) => {
        // Folders first, then files
        const aIsFolder = nodeA.__meta?.isFolder;
        const bIsFolder = nodeB.__meta?.isFolder;
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;
        return nameA.localeCompare(nameB);
      })
      .map(([name, node]) => {
        const path = prefix ? `${prefix}/${name}` : name;
        const isFile = node.__meta?.file;
        const isExpanded = expandedFolders.has(path);
        
        if (isFile) {
          return (
            <button
              key={path}
              onClick={() => handleSelectFile(node.__meta.file)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg transition-colors ${
                selectedFile?.id === node.__meta.file.id
                  ? 'bg-blue-100 text-blue-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <File className="h-4 w-4 text-blue-500" />
              <span className="truncate">{name}</span>
            </button>
          );
        }
        
        return (
          <div key={path}>
            <button
              onClick={() => toggleFolder(path)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Folder className="h-4 w-4 text-amber-500" />
              <span className="truncate">{name}</span>
            </button>
            {isExpanded && <div className="ml-2 border-l border-gray-200">{renderTree(node, path)}</div>}
          </div>
        );
      });
  };

  const tree = buildFileTree(uiFiles);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileCode className="h-5 w-5 text-blue-600" />
                Files
              </h3>
              <Button size="sm" variant="ghost" onClick={loadUIFiles} disabled={loadingFiles} className="p-1 h-auto">
                <RefreshCw className={`h-4 w-4 ${loadingFiles ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <p className="text-xs text-gray-500">{uiFiles.length} file(s)</p>
          </div>

          <div className="flex-1 overflow-auto p-2">
            {loadingFiles ? (
              <div className="text-center py-6 text-gray-500">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading...</p>
              </div>
            ) : uiFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Layout className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm mb-1">No code files</p>
                <p className="text-xs">Generate a React project to see files</p>
              </div>
            ) : (
              renderTree(tree)
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedFile ? (
            <>
              {/* File Header */}
              <div className="border-b border-gray-200 px-6 py-3 bg-gray-50 flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
                    <File className="h-5 w-5 text-blue-500" />
                    {selectedFile.path.split('/').pop()}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedFile.path}</p>
                </div>
                <div className="flex gap-2 items-center">
                  {/* View Mode Toggle */}
                  {(isReactComponent(selectedFile.path) || isHTMLFile(selectedFile.path)) && (
                    <div className="inline-flex rounded-lg bg-gray-100 p-0.5 mr-2">
                      <button
                        onClick={() => setViewMode('preview')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                          viewMode === 'preview'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </button>
                      <button
                        onClick={() => setViewMode('code')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                          viewMode === 'code'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Code2 className="h-4 w-4" />
                        Code
                      </button>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={downloadProject}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-auto bg-gray-50">
                {viewMode === 'code' ? (
                  /* Code View */
                  <Card className="m-6 overflow-hidden">
                    <div className="bg-gray-900 text-gray-100 h-full flex flex-col">
                      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800">
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        </div>
                        <span className="text-xs text-gray-400">{selectedFile.path.split('/').pop()}</span>
                      </div>
                      <div className="flex-1 overflow-auto">
                        <SyntaxHighlighter
                          language={getLanguageFromPath(selectedFile.path)}
                          style={vscDarkPlus}
                          customStyle={{ margin: 0, padding: '16px', background: 'transparent' }}
                          wrapLongLines
                          showLineNumbers
                        >
                          {fileContent || 'Loading...'}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  </Card>
                ) : (
                  /* Preview View */
                  <Card className="m-6 overflow-hidden h-[calc(100%-48px)]">
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-600">
                        <FileCode className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm font-medium">Preview not available</p>
                        <p className="text-xs text-gray-500 mt-1">Only React and HTML files have previews</p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Layout className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Code Explorer
                </h3>
                <p className="text-gray-600 mt-2">Select a file from the tree to view code</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileTreeEditor;
