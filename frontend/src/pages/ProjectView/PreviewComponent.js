import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, Maximize2, Play, Square, ExternalLink, Copy, Check, Code } from 'lucide-react';

import SandboxPreview from '@/components/sandbox/SandboxPreview';
import Inspector from '@/components/sandbox/Inspector';
import EditModal from '@/components/sandbox/EditModal';

const PreviewComponent = ({ projectId }) => {
  const [previewContent, setPreviewContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [devpodStatus, setDevpodStatus] = useState('idle'); // idle, starting, running, stopped
  const [devpodUrl, setDevpodUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showDevpodOptions, setShowDevpodOptions] = useState(false);
  const [files, setFiles] = useState([]);
  const [useSandbox, setUseSandbox] = useState(true);
  const [selectedElement, setSelectedElement] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const iframeRef = React.useRef(null);

  useEffect(() => {
    loadPreview();
  }, [projectId]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch project files for sandbox
      const filesResponse = await fetch(`/api/projects/${projectId}/files`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        setFiles(filesData);
      }

      // Fetch the generated HTML/React component from the project
      const response = await fetch(
        `/api/projects/${projectId}/preview`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load preview');
      }

      const data = await response.json();
      setPreviewContent(data.content || data);
      alert('Preview loaded');
    } catch (err) {
      console.error('Preview error:', err);
      setError(err.message || 'Failed to load preview');
      alert('Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const startDevpod = async () => {
    try {
      setDevpodStatus('starting');
      alert('Starting DevPod environment...');

      const response = await fetch(`/api/projects/${projectId}/devpod/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageType: 'prebuilt', // Use prebuilt devcontainer image
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start DevPod');
      }

      const data = await response.json();
      setDevpodUrl(data.url);
      setDevpodStatus('running');
      alert('DevPod environment started successfully!');
    } catch (err) {
      console.error('DevPod start error:', err);
      setDevpodStatus('idle');
      alert(`Failed to start DevPod: ${err.message}`);
    }
  };

  const stopDevpod = async () => {
    try {
      setDevpodStatus('stopping');
      alert('Stopping DevPod environment...');

      await fetch(`/api/projects/${projectId}/devpod/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setDevpodStatus('stopped');
      setDevpodUrl(null);
      alert('DevPod environment stopped');
    } catch (err) {
      console.error('DevPod stop error:', err);
      setDevpodStatus('idle');
      alert(`Failed to stop DevPod: ${err.message}`);
    }
  };

  const copyDevpodUrl = () => {
    if (devpodUrl) {
      navigator.clipboard.writeText(devpodUrl);
      setCopied(true);
      alert('URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleElementSelect = (element) => {
    setSelectedElement(element);
    setShowEditModal(true);
  };

  const handleApplyChanges = async (changes) => {
    try {
      // Apply changes via backend
      const response = await fetch(`/api/projects/${projectId}/apply-changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selector: selectedElement.selector,
          changes: changes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to apply changes');
      }

      // Reload preview
      await loadPreview();
      alert('Changes applied successfully!');
    } catch (err) {
      console.error('Apply changes error:', err);
      alert(err.message || 'Failed to apply changes');
    }
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-gray-600">Loading preview...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 font-medium">Preview Error</p>
            <p className="text-gray-600 text-sm mt-1">{error}</p>
            <button
              onClick={loadPreview}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (!previewContent) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-600">No preview available</p>
            <button
              onClick={loadPreview}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Load Preview
            </button>
          </div>
        </div>
      );
    }

    // Render HTML content in iframe for safety
    return (
      <iframe
        title="UI Preview"
        className="w-full h-full border-none"
        srcDoc={previewContent}
        sandbox="allow-scripts allow-same-origin"
      />
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-gray-800">UI Preview</h3>
          
          {/* Preview Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setUseSandbox(false)}
              className={`px-3 py-1 text-sm rounded transition ${
                !useSandbox
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Simple
            </button>
            <button
              onClick={() => setUseSandbox(true)}
              className={`px-3 py-1 text-sm rounded transition ${
                useSandbox
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Code className="w-3 h-3 inline mr-1" />
              Sandbox
            </button>
          </div>
          
          {/* DevPod Status Badge */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              devpodStatus === 'running' ? 'bg-green-500' :
              devpodStatus === 'starting' ? 'bg-yellow-500 animate-pulse' :
              'bg-gray-400'
            }`} />
            <span className="text-xs text-gray-600 font-medium">
              DevPod: {devpodStatus.charAt(0).toUpperCase() + devpodStatus.slice(1)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* DevPod Controls */}
          {devpodStatus === 'idle' ? (
            <button
              onClick={startDevpod}
              className="p-2 hover:bg-green-100 rounded transition text-green-600"
              title="Start DevPod environment"
            >
              <Play className="w-4 h-4" />
            </button>
          ) : devpodStatus === 'running' && (
            <>
              <button
                onClick={() => setShowDevpodOptions(!showDevpodOptions)}
                className="p-2 hover:bg-blue-100 rounded transition text-blue-600"
                title="DevPod options"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={stopDevpod}
                className="p-2 hover:bg-red-100 rounded transition text-red-600"
                title="Stop DevPod environment"
              >
                <Square className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Preview Controls */}
          <button
            onClick={loadPreview}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-50"
            title="Refresh preview"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-gray-100 rounded transition"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DevPod Options Panel */}
      {showDevpodOptions && devpodStatus === 'running' && devpodUrl && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">DevPod Environment URL</p>
              <p className="text-xs text-gray-600 mt-1">Your remote development environment is ready</p>
              <p className="text-sm text-blue-600 font-mono mt-2 break-all">{devpodUrl}</p>
            </div>
            <button
              onClick={copyDevpodUrl}
              className={`ml-4 p-2 rounded transition ${
                copied
                  ? 'bg-green-100 text-green-600'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
              title="Copy DevPod URL"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="mt-3 p-3 bg-white rounded border border-blue-200">
            <p className="text-xs font-medium text-gray-700 mb-2">Quick Start:</p>
            <ol className="text-xs text-gray-600 space-y-1">
              <li>• Your project is running in a prebuilt DevContainer image</li>
              <li>• Zero-install environment with all dependencies included</li>
              <li>• Click the URL above to open the environment in your browser</li>
              <li>• All changes are saved to your project</li>
            </ol>
          </div>
        </div>
      )}

      {/* Preview Content */}
      <div className="flex-1 overflow-auto bg-gray-50 relative">
        {useSandbox && files.length > 0 ? (
          <>
            <SandboxPreview
              projectId={projectId}
              files={files}
              ref={iframeRef}
            />
            <Inspector
              iframeRef={iframeRef}
              onElementSelect={handleElementSelect}
            />
          </>
        ) : (
          renderPreview()
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedElement && (
        <EditModal
          element={selectedElement}
          projectId={projectId}
          onClose={() => {
            setShowEditModal(false);
            setSelectedElement(null);
          }}
          onApplyChanges={handleApplyChanges}
        />
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-[95vw] h-[95vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-semibold">UI Preview (Fullscreen)</h2>
              <button
                onClick={() => setIsFullscreen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              {useSandbox && files.length > 0 ? (
                <SandboxPreview projectId={projectId} files={files} />
              ) : (
                renderPreview()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewComponent;
