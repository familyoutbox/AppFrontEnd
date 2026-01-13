import React, { useState } from 'react';
import { Code, FileCode } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import FileTreeView from './FileTreeView';
import { codebaseAPI } from '@/services/api';

const CodeTab = ({ files, getLanguage }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  console.log('[CodeTab] Rendering with files:', files?.length || 0, files);

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
      <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
        {/* File Tree */}
        <div className="flex-1 overflow-auto">
          <FileTreeView 
            files={files}
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
          />
        </div>
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
                <FileCode className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Select a file to view</p>
                <p className="text-sm mt-2">Choose a file from the tree to view its code</p>
                {files.length === 0 && (
                  <p className="text-xs mt-4 text-gray-400">No files generated yet. Start by creating a project.</p>
                )}
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

export default CodeTab;
