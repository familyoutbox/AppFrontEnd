import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, RefreshCw, Maximize2, Minimize2, Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import * as esbuild from 'esbuild-wasm';

const SandboxPreview = ({ projectId, files }) => {
  const [previewContent, setPreviewContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buildOutput, setBuildOutput] = useState('');
  const [esbuildReady, setEsbuildReady] = useState(false);
  const iframeRef = useRef(null);
  const wsRef = useRef(null);

  // Initialize ESBuild WASM
  useEffect(() => {
    const initESBuild = async () => {
      try {
        await esbuild.initialize({
          wasmURL: 'https://unpkg.com/esbuild-wasm@0.19.11/esbuild.wasm',
        });
        setEsbuildReady(true);
        console.log('✅ ESBuild WASM initialized');
      } catch (err) {
        console.error('Failed to initialize ESBuild:', err);
        setError('Failed to initialize build system');
      }
    };

    initESBuild();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Setup WebSocket for live reload
  useEffect(() => {
    if (!projectId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8001/ws/preview/${projectId}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket connected for live reload');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'file_change') {
          console.log('📡 File changed, reloading preview...');
          buildAndPreview(files);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to setup WebSocket:', err);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [projectId]);

  // Build and bundle files using ESBuild
  const buildAndPreview = async (sourceFiles) => {
    if (!esbuildReady) {
      setError('Build system not ready');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setBuildOutput('🔨 Building project...\n');

      // Find entry point
      const entryFile = sourceFiles.find(f => 
        f.path.match(/index\.(jsx?|tsx?)$/) || 
        f.path.match(/App\.(jsx?|tsx?)$/) ||
        f.path.match(/main\.(jsx?|tsx?)$/)
      );

      if (!entryFile) {
        throw new Error('No entry file found (index.js, App.jsx, etc.)');
      }

      setBuildOutput(prev => prev + `📍 Entry point: ${entryFile.path}\n`);

      // Create virtual file system for ESBuild
      const fileSystem = {};
      sourceFiles.forEach(file => {
        fileSystem[file.path] = file.content;
      });

      // Bundle with ESBuild
      const result = await esbuild.build({
        entryPoints: [entryFile.path],
        bundle: true,
        write: false,
        format: 'esm',
        jsx: 'automatic',
        loader: {
          '.js': 'jsx',
          '.jsx': 'jsx',
          '.ts': 'tsx',
          '.tsx': 'tsx',
        },
        plugins: [{
          name: 'virtual-fs',
          setup(build) {
            build.onResolve({ filter: /.*/ }, args => {
              return { path: args.path, namespace: 'virtual' };
            });

            build.onLoad({ filter: /.*/, namespace: 'virtual' }, args => {
              const content = fileSystem[args.path];
              if (!content) {
                return { errors: [{ text: `File not found: ${args.path}` }] };
              }
              return { contents: content, loader: 'jsx' };
            });
          },
        }],
      });

      if (result.errors.length > 0) {
        throw new Error(result.errors.map(e => e.text).join('\n'));
      }

      setBuildOutput(prev => prev + '✅ Build successful\n');

      // Create HTML with bundled code
      const bundledCode = result.outputFiles[0].text;
      const html = generatePreviewHTML(bundledCode, sourceFiles);

      setPreviewContent(html);
      setBuildOutput(prev => prev + '🚀 Preview ready\n');
      toast.success('Preview built successfully');

    } catch (err) {
      console.error('Build error:', err);
      setError(err.message);
      setBuildOutput(prev => prev + `❌ Error: ${err.message}\n`);
      toast.error('Build failed');
    } finally {
      setLoading(false);
    }
  };

  // Generate HTML document for preview
  const generatePreviewHTML = (bundledCode, files) => {
    // Find CSS files
    const cssFiles = files.filter(f => f.path.endsWith('.css'));
    const cssContent = cssFiles.map(f => f.content).join('\n');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    ${cssContent}
  </style>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    ${bundledCode}
  </script>
  <script>
    // Listen for messages from parent
    window.addEventListener('message', (event) => {
      if (event.data.type === 'reload') {
        window.location.reload();
      }
    });

    // Error handling
    window.onerror = (msg, url, line, col, error) => {
      console.error('Runtime error:', msg, error);
      window.parent.postMessage({
        type: 'error',
        message: msg,
        stack: error?.stack
      }, '*');
    };

    // Report ready
    window.parent.postMessage({ type: 'ready' }, '*');
  </script>
</body>
</html>`;
  };

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'ready') {
        console.log('✅ Preview iframe ready');
      } else if (event.data.type === 'error') {
        console.error('Preview runtime error:', event.data.message);
        toast.error('Runtime error in preview');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Auto-build when files change
  useEffect(() => {
    if (files && files.length > 0 && esbuildReady) {
      buildAndPreview(files);
    }
  }, [files, esbuildReady]);

  const reloadPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage({ type: 'reload' }, '*');
    }
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-gray-600">Building preview...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center max-w-md p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 font-medium mb-2">Build Error</p>
            <pre className="text-left text-xs bg-red-50 p-3 rounded text-red-800 overflow-auto max-h-40">
              {error}
            </pre>
            <button
              onClick={() => buildAndPreview(files)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Retry Build
            </button>
          </div>
        </div>
      );
    }

    if (!previewContent) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <p className="text-gray-600 mb-4">No preview available</p>
            {files && files.length > 0 && (
              <button
                onClick={() => buildAndPreview(files)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                Build Preview
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <iframe
        ref={iframeRef}
        title="Sandbox Preview"
        className="w-full h-full border-none bg-white"
        srcDoc={previewContent}
        sandbox="allow-scripts allow-same-origin allow-modals"
      />
    );
  };

  return (
    <div className="flex h-full">
      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col">
        {/* Controls */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : esbuildReady ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-xs text-gray-600 font-medium">
              {loading ? 'Building...' : esbuildReady ? 'Ready' : 'Initializing...'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => buildAndPreview(files)}
              disabled={loading || !esbuildReady}
              className="p-1.5 hover:bg-gray-200 rounded transition disabled:opacity-50"
              title="Rebuild"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={reloadPreview}
              disabled={!previewContent}
              className="p-1.5 hover:bg-gray-200 rounded transition disabled:opacity-50"
              title="Reload iframe"
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 hover:bg-gray-200 rounded transition"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-hidden">
          {renderPreview()}
        </div>
      </div>

      {/* Build Output Console */}
      {buildOutput && (
        <div className="w-80 border-l bg-gray-900 text-gray-100 flex flex-col">
          <div className="px-4 py-2 bg-gray-800 text-sm font-medium border-b border-gray-700">
            Build Output
          </div>
          <pre className="flex-1 p-4 text-xs overflow-auto font-mono">
            {buildOutput}
          </pre>
        </div>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex justify-between items-center p-4 bg-gray-800 text-white">
            <h2 className="font-semibold">Preview (Fullscreen)</h2>
            <button
              onClick={() => setIsFullscreen(false)}
              className="text-gray-300 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <div className="flex-1">
            {renderPreview()}
          </div>
        </div>
      )}
    </div>
  );
};

export default SandboxPreview;
