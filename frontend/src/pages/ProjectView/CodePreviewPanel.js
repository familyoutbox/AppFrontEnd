import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Code, Database } from 'lucide-react';
import DatabaseSchemaPreview from './components/DatabaseSchemaPreview';
import mermaid from 'mermaid';

const CodePreviewPanel = ({ projectId, files = [], selectedFile }) => {
  const [viewMode, setViewMode] = useState('preview'); // 'preview' or 'schema'
  const [diagramSvg, setDiagramSvg] = useState(null);
  const [diagramError, setDiagramError] = useState(null);
  
  // Check if selected file is a UI page that can be previewed
  const isUIFile = (file) => {
    if (!file) return false;
    const path = file.path.toLowerCase();
    const uiExtensions = ['.html', '.jsx', '.tsx', '.vue', '.svelte'];
    return uiExtensions.some(ext => path.endsWith(ext));
  };

  const extractMermaid = (file) => {
    if (!file || !file.content) return null;
    // Handle fenced mermaid blocks in markdown (case-insensitive, flexible newlines)
    const fenced = file.content.match(/```mermaid[\t ]*[\r\n]+([\s\S]*?)```/i);
    if (fenced && fenced[1]) return fenced[1].trim();
    // If file is .mmd or .mermaid, use full content
    const lower = (file.path || '').toLowerCase();
    if (lower.endsWith('.mmd') || lower.endsWith('.mermaid') || lower.endsWith('.md')) return file.content;
    return null;
  };

  const isDiagramFile = (file) => Boolean(extractMermaid(file));

  const mermaidDefinition = useMemo(() => extractMermaid(selectedFile), [selectedFile]);

  // Check if project has database schemas
  const hasSchemas = files.some(f => 
    f.path.endsWith('.sql') || 
    f.path.includes('model') || 
    f.path.includes('schema')
  );

  const canPreview = isUIFile(selectedFile) || isDiagramFile(selectedFile);

  useEffect(() => {
    if (!mermaidDefinition) {
      setDiagramSvg(null);
      setDiagramError(null);
      return;
    }
    mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
    const renderDiagram = async () => {
      try {
        const renderId = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const { svg } = await mermaid.render(renderId, mermaidDefinition);
        setDiagramSvg(svg);
        setDiagramError(null);
      } catch (err) {
        console.error('Failed to render mermaid diagram', err);
        setDiagramSvg(null);
        setDiagramError(err?.message || 'Failed to render diagram');
      }
    };
    renderDiagram();
  }, [mermaidDefinition]);
  
  // Show Database Schema View
  if (viewMode === 'schema') {
    return <DatabaseSchemaPreview projectId={projectId} />;
  }
  
  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <Eye className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">Preview Mode</p>
          <p className="text-sm mt-2">Select a UI file from the tree to preview</p>
          <p className="text-xs mt-1 text-gray-400">
            Supports: HTML, JSX, TSX, Vue, Svelte
          </p>
        </div>
      </div>
    );
  }

  if (!canPreview) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <Code className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">Preview Not Available</p>
          <p className="text-sm mt-2">
            <span className="font-mono text-gray-700">{selectedFile.path}</span> cannot be previewed
          </p>
          <p className="text-xs mt-2 text-gray-400">
            Preview only works for UI files (HTML, JSX, TSX, Vue, Svelte)
          </p>
          <p className="text-xs mt-1 text-blue-600">
            Switch to Code view to see the file content
          </p>
        </div>
      </div>
    );
  }

  const renderPreviewBody = () => {
    if (isDiagramFile(selectedFile)) {
      return (
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Diagram Preview</h3>
              <span className="text-xs text-gray-500">Mermaid</span>
            </div>
            <div className="border border-gray-200 rounded-lg bg-white p-4 overflow-auto min-h-[300px]">
              {diagramSvg ? (
                <div dangerouslySetInnerHTML={{ __html: diagramSvg }} />
              ) : diagramError ? (
                <div className="text-red-600 text-sm space-y-2">
                  <p className="font-semibold">Failed to render diagram</p>
                  <p className="text-xs">{diagramError}</p>
                  <pre className="bg-gray-100 text-gray-700 p-2 rounded text-xs overflow-auto">{mermaidDefinition}</pre>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Code className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm">Rendering diagram...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
            <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              Refresh
            </button>
          </div>
          
          {/* Preview Frame */}
          <div className="border-2 border-gray-300 rounded-lg bg-white h-[calc(100%-60px)] overflow-auto">
            <div className="p-8">
              {/* Render preview based on file type */}
              {selectedFile.path.endsWith('.html') ? (
                <iframe
                  srcDoc={selectedFile.content}
                  className="w-full h-full border-0"
                  title="HTML Preview"
                  sandbox="allow-scripts"
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="font-medium">React/Vue Preview</p>
                  <p className="text-sm mt-2">
                    Component preview requires compilation
                  </p>
                  <p className="text-xs mt-2 text-gray-400">
                    Switch to Code view to see the component source
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Tabs */}
      {hasSchemas && (
        <div className="border-b border-gray-200 bg-gray-50 px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                viewMode === 'preview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-1" />
              Preview
            </button>
            <button
              onClick={() => setViewMode('schema')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                viewMode === 'schema'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Database className="w-4 h-4 inline mr-1" />
              Database Schema
            </button>
          </div>
        </div>
      )}
      
      {/* File Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">{selectedFile.path}</p>
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
            {isDiagramFile(selectedFile) ? 'Diagram Preview' : 'Preview Available'}
          </span>
        </div>
      </div>

      {/* Preview Content */}
      {renderPreviewBody()}
    </div>
  );
};

export default CodePreviewPanel;
