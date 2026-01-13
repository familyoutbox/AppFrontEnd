import React, { useState } from 'react';
import { Server, Code } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import FileTreeView from './FileTreeView';
import { codebaseAPI } from '@/services/api';

const BackendTab = ({ files, getLanguage }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Filter backend files
  const backendFiles = files.filter(f => {
    const path = (f.path || '').toLowerCase();
    
    // Exclude frontend-specific paths
    const isFrontendPath = [
      '/frontend/',
      '/client/',
      '/ui/',
      '/components/',
      '/pages/',
      '/views/',
      '/public/',
      '/assets/',
      '/styles/'
    ].some(seg => path.includes(seg));
    
    if (isFrontendPath) return false;
    
    // Include backend paths and file types
    const isBackendPath = [
      '/api/',
      '/server/',
      '/backend/',
      '/controllers/',
      '/services/',
      '/models/',
      '/routes/',
      '/middleware/',
      '/config/',
      '/database/',
      '/repositories/',
      '/migrations/',
      '/schemas/'
    ].some(seg => path.includes(seg));
    
    const isBackendFileType = [
      '.py',
      '.java',
      '.cs',
      '.go',
      '.rb',
      '.php',
      '.sql'
    ].some(ext => path.endsWith(ext));
    
    // Include .js/.ts only if in backend-related paths
    const isBackendScript = (
      (path.endsWith('.js') || path.endsWith('.ts')) && 
      (path.includes('server') || path.includes('api') || path.includes('backend'))
    );
    
    return isBackendPath || isBackendFileType || isBackendScript;
  });

  const handleFileSelect = async (fileMeta) => {
    setSelectedFile(fileMeta);
    try {
      const res = await codebaseAPI.getFileContent(fileMeta.id);
      setSelectedFile({ ...fileMeta, content: res.data.content });
    } catch (error) {
      console.error('Failed to load file content:', error);
    }
  };

  return (
    <div className="h-full flex overflow-hidden bg-white">
      {/* Left: File Tree */}
      <div className="w-80 border-r border-gray-200 bg-gray-50">
        <div className="p-3 border-b border-gray-200 bg-white">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Server className="w-4 h-4" />
            Backend Files
          </h3>
          <p className="text-xs text-gray-500 mt-1">{backendFiles.length} files</p>
        </div>
        <FileTreeView 
          files={backendFiles}
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
        />
      </div>

      {/* Right: Code Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedFile ? selectedFile.path : 'No file selected'}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Code className="h-3 w-3" />
            Code View
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {!selectedFile ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Server className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Select a backend file</p>
                <p className="text-sm mt-2">Choose a file from the tree to view its code</p>
              </div>
            </div>
          ) : (
            <div className="h-full bg-gray-900 p-6">
              <SyntaxHighlighter
                language={getLanguage(selectedFile)}
                style={vscDarkPlus}
                customStyle={{ margin: 0, background: 'transparent' }}
                showLineNumbers
                wrapLongLines
              >
                {selectedFile.content || '// Loading...'}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackendTab;
