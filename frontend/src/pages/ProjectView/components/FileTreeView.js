import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen,
  FileCode
} from 'lucide-react';

const FileTreeView = ({ files = [], projectName = 'project', onFileSelect, selectedFile }) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  // Build tree structure from flat file list
  const buildTree = (files) => {
    const tree = {};
    
    files.forEach(file => {
      const parts = file.path.split('/');
      let current = tree;
      
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // It's a file
          current[part] = { type: 'file', data: file };
        } else {
          // It's a folder
          if (!current[part]) {
            current[part] = { type: 'folder', children: {} };
          }
          current = current[part].children;
        }
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

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const iconClass = "w-4 h-4";
    
    const colors = {
      'js': 'text-yellow-500',
      'jsx': 'text-blue-500',
      'ts': 'text-blue-600',
      'tsx': 'text-blue-600',
      'py': 'text-blue-400',
      'html': 'text-orange-500',
      'css': 'text-purple-500',
      'json': 'text-yellow-600',
      'md': 'text-gray-600',
      'txt': 'text-gray-500'
    };
    
    return <File className={`${iconClass} ${colors[ext] || 'text-gray-400'}`} />;
  };

  const renderTree = (tree, parentPath = '') => {
    return Object.keys(tree).sort().map(key => {
      const node = tree[key];
      const currentPath = parentPath ? `${parentPath}/${key}` : key;
      const isExpanded = expandedFolders.has(currentPath);
      
      if (node.type === 'folder') {
        return (
          <div key={currentPath}>
            <div
              className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-100 rounded cursor-pointer"
              onClick={() => toggleFolder(currentPath)}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-500" />
              ) : (
                <Folder className="w-4 h-4 text-blue-400" />
              )}
              <span className="text-sm font-medium text-gray-700">{key}</span>
            </div>
            {isExpanded && (
              <div className="ml-6 border-l border-gray-200 pl-2">
                {renderTree(node.children, currentPath)}
              </div>
            )}
          </div>
        );
      } else {
        const isSelected = selectedFile?.path === node.data?.path;
        return (
          <div
            key={currentPath}
            className={`flex items-center gap-2 py-1.5 px-2 hover:bg-gray-100 rounded cursor-pointer ${
              isSelected ? 'bg-blue-50' : ''
            }`}
            onClick={() => onFileSelect && onFileSelect(node.data)}
          >
            <div className="w-4" /> {/* Spacer for alignment */}
            {getFileIcon(key)}
            <span className="text-sm text-gray-700">{key}</span>
          </div>
        );
      }
    });
  };

  const tree = buildTree(files);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Project Structure</h3>
        </div>
        <p className="text-sm text-gray-500">
          {files.length} file{files.length !== 1 ? 's' : ''} generated
        </p>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-auto p-4">
        {files.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileCode className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">No files generated yet</p>
            <p className="text-sm mt-1">Generate code using the AI Agent tab</p>
          </div>
        ) : (
          <div className="font-mono text-sm">
            {renderTree(tree)}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {files.length > 0 && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{files.length}</div>
              <div className="text-xs text-gray-600">Files</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {new Set(files.map(f => f.path.split('/')[0])).size}
              </div>
              <div className="text-xs text-gray-600">Top Folders</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {files.reduce((sum, f) => sum + (f.size || 0), 0) / 1024 > 1024
                  ? `${(files.reduce((sum, f) => sum + (f.size || 0), 0) / 1024 / 1024).toFixed(1)}MB`
                  : `${(files.reduce((sum, f) => sum + (f.size || 0), 0) / 1024).toFixed(1)}KB`}
              </div>
              <div className="text-xs text-gray-600">Total Size</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileTreeView;
