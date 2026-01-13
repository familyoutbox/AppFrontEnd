import React, { useState, useEffect } from 'react';
import { codebaseAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { File, Folder, FileCode, GitCompare, Clock } from 'lucide-react';

const CodeExplorer = ({ projectId }) => {
  const [files, setFiles] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      const [filesRes, snapshotsRes] = await Promise.all([
        codebaseAPI.listFiles(projectId),
        codebaseAPI.listSnapshots(projectId),
      ]);
      setFiles(filesRes.data);
      setSnapshots(snapshotsRes.data);
      if (snapshotsRes.data.length > 0) {
        setSelectedSnapshot(snapshotsRes.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load code data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFileContent = async (fileId) => {
    try {
      const response = await codebaseAPI.getFileContent(fileId);
      setFileContent(response.data.content);
      setSelectedFile(response.data.metadata);
    } catch (error) {
      console.error('Failed to load file content:', error);
    }
  };

  const groupFilesByDirectory = () => {
    const grouped = {};
    files.forEach(file => {
      const parts = file.path.split('/');
      const dir = parts.slice(0, -1).join('/') || 'root';
      if (!grouped[dir]) grouped[dir] = [];
      grouped[dir].push(file);
    });
    return grouped;
  };

  const groupedFiles = groupFilesByDirectory();

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
        <p className="text-slate-400 mt-4">Loading code...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: File Tree */}
      <div className="lg:col-span-1">
        <Card className="bg-slate-800/50 border-slate-700" data-testid="file-tree-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Folder className="h-5 w-5 text-purple-500" />
              File Explorer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {files.length === 0 ? (
                <div className="text-center py-8">
                  <FileCode className="h-12 w-12 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No files yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedFiles).map(([dir, dirFiles]) => (
                    <div key={dir}>
                      <div className="flex items-center gap-2 mb-2">
                        <Folder className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-medium text-slate-300">{dir}</span>
                      </div>
                      <div className="ml-6 space-y-1">
                        {dirFiles.map(file => (
                          <Button
                            key={file.id}
                            variant="ghost"
                            className={`w-full justify-start text-left ${
                              selectedFile?.id === file.id ? 'bg-purple-500/20' : ''
                            }`}
                            onClick={() => loadFileContent(file.id)}
                            data-testid={`file-${file.id}`}
                          >
                            <File className="h-4 w-4 mr-2 text-slate-400" />
                            <span className="text-sm text-slate-300">{file.path.split('/').pop()}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Snapshots */}
        <Card className="bg-slate-800/50 border-slate-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              Snapshots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              {snapshots.length === 0 ? (
                <p className="text-slate-400 text-sm">No snapshots yet</p>
              ) : (
                <div className="space-y-2">
                  {snapshots.map(snapshot => (
                    <Button
                      key={snapshot.id}
                      variant="ghost"
                      className={`w-full justify-start text-left ${
                        selectedSnapshot === snapshot.id ? 'bg-purple-500/20' : ''
                      }`}
                      onClick={() => setSelectedSnapshot(snapshot.id)}
                      data-testid={`snapshot-${snapshot.id}`}
                    >
                      <div className="flex-1">
                        <p className="text-sm text-slate-300">{snapshot.message}</p>
                        <p className="text-xs text-slate-500">{new Date(snapshot.created_at).toLocaleString()}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right: File Content */}
      <div className="lg:col-span-2">
        <Card className="bg-slate-800/50 border-slate-700" data-testid="file-content-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-white flex items-center gap-2">
                <FileCode className="h-5 w-5 text-purple-500" />
                {selectedFile ? selectedFile.path : 'Select a file'}
              </CardTitle>
              {selectedFile && (
                <Badge variant="outline">{(selectedFile.size / 1024).toFixed(2)} KB</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedFile ? (
              <ScrollArea className="h-[600px]">
                <pre className="bg-slate-900 p-4 rounded border border-slate-700 overflow-x-auto">
                  <code className="text-sm text-slate-300 font-mono">{fileContent}</code>
                </pre>
              </ScrollArea>
            ) : (
              <div className="text-center py-12">
                <FileCode className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Select a file to view its content</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CodeExplorer;
