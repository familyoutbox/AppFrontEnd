import React, { useState, useEffect } from 'react';
import { Eye, Code, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import FileTreeView from './FileTreeView';
import api, { codebaseAPI } from '@/services/api';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview
} from '@codesandbox/sandpack-react';

const FrontendTab = ({ projectId, files, getLanguage }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewMode, setViewMode] = useState('code');
  const [previewFiles, setPreviewFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiPromptTarget, setAiPromptTarget] = useState('');
  const [aiPromptText, setAiPromptText] = useState('');
  const [showRawOutput, setShowRawOutput] = useState(false);

  // Load preview components saved under backend preview storage
  useEffect(() => {
    const loadPreviewFiles = async () => {
      if (!projectId) return;
      try {
        const res = await api.get(`/preview/projects/${projectId}/files`);
        const apiFiles = res.data?.files || [];
        console.log('[FrontendTab] Loaded preview files:', apiFiles);
        const mapped = apiFiles.map((f) => ({
          id: `preview:${f.name}`,
          path: `preview/${f.name}`,
          size: 0,
          isPreview: true
        }));
        setPreviewFiles(mapped);
      } catch (error) {
        console.error('[FrontendTab] Failed to load preview components:', error);
      }
    };

    loadPreviewFiles();
  }, [projectId, files.length]); // Re-fetch when files change
  
  const frontendFiles = files.filter(f => {
    const raw = (f.path || '').toLowerCase();
    // Normalize to always include a leading slash so checks work for both
    // 'src/App.jsx' and '/src/App.jsx' and 'frontend/src/App.jsx'
    const path = raw.startsWith('/') ? raw : `/${raw}`;

    // Exclude backend-specific paths first
    const isBackendPath = [
      '/api/',
      '/server/',
      '/backend/',
      '/services/',
      '/models/',
      '/routes/',
      '/middleware/',
      '/controllers/',
      '/repositories/',
      '/database/',
      '/migrations/'
    ].some(seg => path.includes(seg));
    
    // Exclude backend file extensions
    const isBackendFile = ['.py', '.java', '.go', '.rb', '.php', '.cs'].some(ext => path.endsWith(ext));
    
    if (isBackendPath || isBackendFile) return false;

    // Treat a file as frontend if it matches common frontend folders
    const isFrontendFolder = [
      '/src/',
      '/components/',
      '/pages/',
      '/views/',
      '/public/',
      '/assets/',
      '/styles/',
      '/frontend/',
      '/client/',
      '/app/',
      '/ui/'
    ].some(seg => path.includes(seg));

    const hasFrontendExt = ['.jsx', '.tsx', '.vue', '.svelte', '.css', '.scss', '.sass', '.less', '.html', '.svg'].some(ext => path.endsWith(ext));

    // Must have both a frontend folder AND frontend extension, or be explicitly in frontend directories
    return (isFrontendFolder && hasFrontendExt) || (path.includes('/frontend/') || path.includes('/client/') || path.includes('/ui/'));
  });

  // Use only regular frontend files (no preview folder)
  let treeFiles = frontendFiles.slice();
  if (showRawOutput) {
    const rawCandidates = (files || []).filter(f => {
      const p = (f.path || '').toLowerCase();
      if (!p) return false;
      if (p.endsWith('raw_output.txt')) return true;
      // Include top-level .txt outputs or files saved under generated_project/output folders
      if (p.endsWith('.txt') && (p.split('/').length <= 2 || p.includes('generated_project') || p.includes('generated_projects') || p.includes('/output/'))) return true;
      return false;
    });
    rawCandidates.forEach(r => {
      if (!treeFiles.find(tf => tf.id === r.id)) treeFiles.push(r);
    });
  }

  const handleFileSelect = async (fileMeta) => {
    console.log('[FrontendTab] File selected:', fileMeta);
    setIsLoading(true);
    setSelectedFile({ ...fileMeta, content: '' }); // Set immediately with empty content
    
    try {
      if (fileMeta.isPreview) {
        const res = await api.get(`/preview/projects/${projectId}/preview`, {
          params: { file: fileMeta.path.replace(/^preview\//, '') }
        });
        console.log('[FrontendTab] Preview content loaded:', res.data.code?.substring(0, 100));
        const full = { ...fileMeta, content: res.data.code };
        setSelectedFile(full);
        window.__lastSelected = full;
      } else {
        const res = await codebaseAPI.getFileContent(fileMeta.id);
        console.log('[FrontendTab] File content loaded:', res.data.content?.substring(0, 100));
        const full = { ...fileMeta, content: res.data.content };
        setSelectedFile(full);
        window.__lastSelected = full;
      }
    } catch (error) {
      console.error('[FrontendTab] Failed to load file content:', error);
      setSelectedFile({ ...fileMeta, content: `// Error loading file: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const isReactComponent = (path) => {
    if (!path) return false;
    const lower = path.toLowerCase();
    return (lower.endsWith('.jsx') || lower.endsWith('.js') || lower.endsWith('.tsx')) && !lower.includes('node_modules');
  };

  const buildSandpackFiles = (file) => {
    if (!file) return { files: {}, dependencies: {} };
    const code = file.content || '';

    // Detect extension to set correct entry file
    const lower = (file.path || '').toLowerCase();
    const isTsx = lower.endsWith('.tsx');
    const appFile = isTsx ? '/App.tsx' : '/App.jsx';

    // Known dependency versions (extend as needed)
    const depVersions = {
      react: '18.2.0',
      'react-dom': '18.2.0',
      'prop-types': '15.8.1',
      axios: '1.6.2',
      lodash: '4.17.21',
      clsx: '2.0.0',
      classnames: '2.5.1',
      'date-fns': '3.6.0',
      'react-router-dom': '6.28.0',
      zod: '3.24.4',
      'react-hook-form': '7.56.2',
      yup: '1.4.0'
    };

    const dependencies = { react: depVersions.react, 'react-dom': depVersions['react-dom'] };
    let needsRouter = false;

    // Collect stubs for missing project imports (relative or alias) and add npm deps for package imports
    const stubs = {};
    const importRegex = /import[^'"`]*['"`]([^'"`]+)['"`]/g;
    let transformed = code;
    const makeStubPath = (p, idx) => `/__stubs__/stub_${idx}_${p.replace(/[^a-zA-Z0-9_]/g, '_')}.js`;
    const stubBody = (label, isAuth) => `// auto mock for ${label}\n` +
      `import React, { createContext, useContext, useState } from 'react';\n` +
      `const sample = {\n  id: 1,\n  name: 'Sample ${label}',\n  title: 'Sample ${label} Title',\n  description: 'Sample description for ${label}',\n  items: [\n    { id: 1, label: 'Item 1', value: 'Value 1' },\n    { id: 2, label: 'Item 2', value: 'Value 2' },\n    { id: 3, label: 'Item 3', value: 'Value 3' }\n  ],\n  list: ['One', 'Two', 'Three'],\n  meta: { status: 'ok', count: 3 }\n};\nconst Ctx = createContext({ user: sample, setUser: () => {}, logout: () => {} });\nexport const useAuth = () => useContext(Ctx);\nexport const AuthProvider = ({ children }) => { const [user, setUser] = useState(sample); const logout = () => setUser(null); return <Ctx.Provider value={{ user, setUser, logout }}>{children}</Ctx.Provider>; };\nexport const data = sample;\nexport const items = sample.items;\nexport const list = sample.list;\nexport const meta = sample.meta;\nexport const noop = () => null;\nconst Component = () => <div style={{padding:'8px',fontFamily:'sans-serif'}}>Mocked ${label}</div>;\nexport const ComponentMock = Component;\nexport default ${isAuth ? 'AuthProvider' : 'Component'};`;
    let match;
    let idx = 0;
    while ((match = importRegex.exec(code)) !== null) {
      const importPath = match[1];
      const isRelative = importPath.startsWith('.');
      const isAlias = importPath.startsWith('@/');
      const isStyle = /(\.css|\.scss|\.sass)$/i.test(importPath);
      if (isStyle) {
        transformed = transformed.replace(match[0], `// stripped style import ${importPath}`);
        continue;
      }
      if (isRelative || isAlias) {
        const stubPath = makeStubPath(importPath, idx++);
        const isAuth = /authcontext|useauth/i.test(importPath);
        stubs[stubPath] = stubBody(importPath, isAuth);
        transformed = transformed.replace(importPath, stubPath);
      } else {
        // package import
        const pkgName = importPath.split('/')[0];
        if (depVersions[pkgName]) {
          dependencies[pkgName] = depVersions[pkgName];
          if (pkgName === 'react-router-dom') needsRouter = true;
        } else {
          // Unknown package: stub it to avoid hard failure
          const stubPath = makeStubPath(importPath, idx++);
          stubs[stubPath] = stubBody(importPath, false);
          transformed = transformed.replace(importPath, stubPath);
        }
      }
    }

    // If no default export, wrap the detected component name as default export
    const hasDefaultExport = /export\s+default/.test(transformed);
    let finalCode = transformed;
    if (!hasDefaultExport) {
      // Try to find a named component starting with uppercase (function, const, class)
      const fnMatch = transformed.match(/function\s+([A-Z][A-Za-z0-9_]*)/);
      const constMatch = transformed.match(/const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*/);
      const classMatch = transformed.match(/class\s+([A-Z][A-Za-z0-9_]*)/);
      const compName = fnMatch?.[1] || constMatch?.[1] || classMatch?.[1] || 'App';
      finalCode = `${transformed}\n\nexport default ${compName};`;
    }

    const routerWrapperImport = needsRouter ? `import { MemoryRouter } from 'react-router-dom';\n` : '';
    const routerWrapperOpen = needsRouter ? `<MemoryRouter initialEntries={["/"]}>` : '';
    const routerWrapperClose = needsRouter ? `</MemoryRouter>` : '';

    const files = {
      [appFile]: finalCode,
      '/index.js': `import React from "react";\nimport { createRoot } from "react-dom/client";\n${routerWrapperImport}import App from "./${appFile.replace('/', '')}";\nconst root = createRoot(document.getElementById("root"));\nroot.render(${routerWrapperOpen}<App />${routerWrapperClose});\n`
    };

    // Attach stubs
    Object.assign(files, stubs);

    // Expose for debugging in devtools
    if (typeof window !== 'undefined') {
      window.__sandpackFiles = files;
      window.__sandpackDeps = dependencies;
    }

    return { files, dependencies };
  };

  return (
    <>
    <div className="h-full flex overflow-hidden bg-white" onContextMenu={(e) => {
      // Placeholder: future enhancement to open AI prompt on right-click of controls
      // e.preventDefault();
    }}>
      {/* Left: File Tree */}
      <div className="w-80 border-r border-gray-200 bg-gray-50">
        <div className="p-3 border-b border-gray-200 bg-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Frontend Files
            </h3>
            <p className="text-xs text-gray-500 mt-1">{frontendFiles.length} files</p>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" className="form-checkbox" checked={showRawOutput} onChange={() => setShowRawOutput(v => !v)} />
              <span>Show raw LLM output</span>
            </label>
          </div>
        </div>
        <FileTreeView 
          files={treeFiles}
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
        />
      </div>

      {/* Right: Content Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with View Toggle */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600 truncate" title={selectedFile?.path || ''}>
            {selectedFile ? selectedFile.path : 'No file selected'}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'preview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('preview')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Live Preview
            </Button>
            <Button
              variant={viewMode === 'code' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('code')}
            >
              <Code className="h-4 w-4 mr-2" />
              Code
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAiPromptTarget(selectedFile?.path || '');
                setAiPromptOpen(true);
              }}
              disabled={!selectedFile}
            >
              Ai Agent Prompt
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {!selectedFile ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Monitor className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Select a frontend file</p>
                <p className="text-sm mt-2">Choose a file from the tree to view its content</p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-lg font-medium">Loading...</p>
              </div>
            </div>
          ) : viewMode === 'preview' && isReactComponent(selectedFile.path) ? (
            <div className="h-full overflow-hidden bg-gray-50">
              {(() => {
                const { files, dependencies } = buildSandpackFiles(selectedFile);
                return (
                <SandpackProvider
                  key={selectedFile.path}
                  template="react"
                  files={files}
                  options={{
                    visibleFiles: [Object.keys(files).find(f => f.startsWith('/App')) || '/App.jsx'],
                    activeFile: Object.keys(files).find(f => f.startsWith('/App')) || '/App.jsx'
                  }}
                  customSetup={{
                    dependencies
                  }}
                >
                <SandpackLayout className="h-full">
                  <SandpackPreview showOpenInCodeSandbox={false} showRefreshButton height="100%" />
                </SandpackLayout>
              </SandpackProvider>
                );
              })()}
            </div>
          ) : viewMode === 'preview' ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center max-w-xl px-6">
                <Eye className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Preview Not Available</p>
                <p className="text-sm mt-2">Select a React component file (.js/.jsx/.tsx) to render it.</p>
                <p className="text-xs text-gray-400 mt-2">If this should render, make sure the file ends with .jsx/.js/.tsx and has content.</p>
              </div>
            </div>
          ) : (
            <div className="h-full bg-gray-900 p-6 overflow-auto">
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
    {aiPromptOpen && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">AI Agent Prompt</p>
              <p className="text-xs text-gray-400">Target: {aiPromptTarget || 'Current file'}</p>
            </div>
            <button className="text-gray-500 hover:text-gray-800" onClick={() => setAiPromptOpen(false)}>x</button>
          </div>
          <textarea
            className="w-full border rounded-md p-2 text-sm h-32"
            placeholder="Describe the change you want (e.g., change button color to blue, increase padding)"
            value={aiPromptText}
            onChange={(e) => setAiPromptText(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setAiPromptOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => {
              // TODO: wire to AI agent endpoint
              console.log('AI Prompt submit', { target: aiPromptTarget, prompt: aiPromptText });
              setAiPromptOpen(false);
            }}>Send to AI</Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default FrontendTab;
