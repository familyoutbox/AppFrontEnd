import React, { useState } from 'react';
import { Rocket, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import FileTreeView from './FileTreeView';
import { codebaseAPI } from '@/services/api';

const DeploymentTab = ({ files, getLanguage }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Filter deployment-related files
  const deploymentFiles = files.filter(f => {
    const path = (f.path || '').toLowerCase();
    return (
      path.includes('dockerfile') ||
      path.includes('docker-compose') ||
      path.includes('.dockerignore') ||
      path.includes('kubernetes') ||
      path.includes('k8s') ||
      path.includes('.yml') ||
      path.includes('.yaml') ||
      path.includes('jenkinsfile') ||
      path.includes('.gitlab-ci') ||
      path.includes('.github/workflows') ||
      path.includes('terraform') ||
      path.includes('helm') ||
      path.includes('deploy') ||
      path.includes('deployment') ||
      path.includes('.tf') ||
      path.includes('nginx.conf') ||
      path.includes('package.json') ||
      path.includes('requirements.txt') ||
      path.includes('pom.xml') ||
      path.includes('.csproj')
    );
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
            <Rocket className="w-4 h-4" />
            Deployment Files
          </h3>
          <p className="text-xs text-gray-500 mt-1">{deploymentFiles.length} files</p>
        </div>
        <FileTreeView 
          files={deploymentFiles}
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
            Configuration View
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {!selectedFile ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Rocket className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Select a deployment file</p>
                <p className="text-sm mt-2">Choose a configuration file to view deployment setup</p>
                <div className="mt-4 text-xs text-gray-400">
                  <p>Supported files:</p>
                  <p>Docker, Kubernetes, CI/CD, Infrastructure configs</p>
                </div>
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

export default DeploymentTab;
