import React, { useState, useEffect } from 'react';
import { FileText, Code, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';
import FileTreeView from './FileTreeView';
import { codebaseAPI } from '@/services/api';

const DocumentsTab = ({ files, getLanguage }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewMode, setViewMode] = useState('preview'); // 'preview' or 'code'
  
  // Filter documentation files
  const docFiles = files.filter(f => {
    const path = (f.path || '').toLowerCase();
    return (
      path.endsWith('.md') ||
      path.endsWith('.txt') ||
      path.includes('/docs/') ||
      path.includes('/documentation/') ||
      path.includes('readme') ||
      path.includes('changelog') ||
      path.includes('contributing') ||
      path.includes('license')
    );
  });

  useEffect(() => {
    // Initialize mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
    });
  }, []);

  useEffect(() => {
    // Re-render mermaid diagrams when content changes
    if (selectedFile?.content && viewMode === 'preview') {
      setTimeout(() => {
        mermaid.contentLoaded();
      }, 100);
    }
  }, [selectedFile?.content, viewMode]);

  const handleFileSelect = async (fileMeta) => {
    setSelectedFile(fileMeta);
    try {
      const res = await codebaseAPI.getFileContent(fileMeta.id);
      setSelectedFile({ ...fileMeta, content: res.data.content });
    } catch (error) {
      console.error('Failed to load file content:', error);
    }
  };

  const renderMarkdown = (content) => {
    return (
      <ReactMarkdown
        className="prose prose-slate max-w-none"
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            // Check if it's a mermaid diagram
            if (language === 'mermaid') {
              return (
                <div className="mermaid my-4">
                  {String(children).replace(/\n$/, '')}
                </div>
              );
            }
            
            return !inline && match ? (
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <div className="h-full flex overflow-hidden bg-white">
      {/* Left: File Tree */}
      <div className="w-80 border-r border-gray-200 bg-gray-50">
        <div className="p-3 border-b border-gray-200 bg-white">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documentation
          </h3>
          <p className="text-xs text-gray-500 mt-1">{docFiles.length} files</p>
        </div>
        <FileTreeView 
          files={docFiles}
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
        />
      </div>

      {/* Right: Content Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with View Toggle */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedFile ? selectedFile.path : 'No file selected'}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'preview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('preview')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              variant={viewMode === 'code' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('code')}
            >
              <Code className="h-4 w-4 mr-2" />
              Source
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {!selectedFile ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Select a document</p>
                <p className="text-sm mt-2">Choose a file from the tree to view documentation</p>
              </div>
            </div>
          ) : viewMode === 'preview' && selectedFile.path?.endsWith('.md') ? (
            <div className="h-full bg-white p-8">
              {renderMarkdown(selectedFile.content || '')}
            </div>
          ) : viewMode === 'preview' ? (
            <div className="h-full bg-white p-8">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {selectedFile.content || 'Loading...'}
              </pre>
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

export default DocumentsTab;
