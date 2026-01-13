import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Github, 
  GitBranch, 
  Loader2,
  FileCode,
  FolderOpen,
  Check,
  AlertTriangle,
  Clock,
  Activity,
  Database,
  Zap
} from 'lucide-react';

const ProjectImportEnhanced = () => {
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [indexingProgress, setIndexingProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [fileStats, setFileStats] = useState({ total: 0, processed: 0, symbols: 0 });
  const [isValidating, setIsValidating] = useState(false);
  
  // GitHub import
  const [githubUrl, setGithubUrl] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [githubToken, setGithubToken] = useState('');
  
  // File upload
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [totalFileSize, setTotalFileSize] = useState(0);

  // WebSocket for real-time progress
  useEffect(() => {
    if (!loading) return;

    const connectWebSocket = (projectId) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/projects/${projectId}`;
      
      try {
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'indexing_progress') {
              setIndexingProgress(data.data.progress || 0);
              setCurrentFile(data.data.current_file || 'Processing...');
              
              if (data.data.file_count) {
                setFileStats(prev => ({
                  ...prev,
                  processed: data.data.file_count.processed || 0,
                  total: data.data.file_count.total || 0
                }));
              }
              
              if (data.data.estimated_time) {
                setEstimatedTime(data.data.estimated_time);
              }
            } else if (data.type === 'indexing_complete') {
              setIndexingProgress(100);
              setSuccessMessage('✅ Indexing complete! Project ready for modifications.');
              setCurrentFile('Ready!');
            } else if (data.type === 'indexing_error') {
              setErrorMessage(`❌ Error: ${data.data.message}`);
              setLoading(false);
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };

        wsRef.current.onerror = () => {
          console.error('WebSocket connection error');
        };
      } catch (e) {
        console.error('Failed to connect WebSocket:', e);
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [loading]);

  // Validate GitHub URL
  const validateGithubUrl = (url) => {
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+\/?$/;
    return githubRegex.test(url);
  };

  // Validate and calculate file size
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    let totalSize = 0;
    
    // Filter for code files and validate
    const codeFiles = files.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      const codeExtensions = ['py', 'js', 'jsx', 'ts', 'tsx', 'java', 'cpp', 'c', 'h', 'go', 'rs', 'rb', 'php', 'cs'];
      return codeExtensions.includes(ext);
    });

    // Calculate total size
    codeFiles.forEach(file => {
      totalSize += file.size;
    });

    // Validate total size (100MB limit)
    if (totalSize > 100 * 1024 * 1024) {
      setErrorMessage('❌ Total file size exceeds 100MB limit');
      setSelectedFiles([]);
      setTotalFileSize(0);
      return;
    }

    setSelectedFiles(codeFiles);
    setTotalFileSize(totalSize);
    setErrorMessage('');

    if (codeFiles.length === 0) {
      setErrorMessage('⚠️ No code files selected. Please select .js, .py, .ts, etc.');
    }
  };

  const handleGithubImport = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!githubUrl || !projectName) {
      setErrorMessage('❌ Please provide GitHub URL and project name');
      return;
    }

    // Validate URL format
    if (!validateGithubUrl(githubUrl)) {
      setErrorMessage('❌ Invalid GitHub URL format. Use: https://github.com/owner/repo');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setIndexingProgress(0);
    setIsValidating(true);
    
    try {
      // Step 1: Validate repository before importing
      setCurrentFile('Validating repository...');
      setUploadProgress(10);

      // Step 2: Clone and create project
      setCurrentFile('Cloning repository...');
      setUploadProgress(20);
      
      const response = await projectsAPI.importFromGithub({
        name: projectName,
        github_url: githubUrl,
        branch: githubBranch,
        token: githubToken
      });
      
      const projectId = response.data.id;
      setUploadProgress(50);
      setIsValidating(false);
      
      // Step 3: Index all files (WebSocket will update progress)
      setCurrentFile('Reading and indexing files...');
      
      // Wait for completion or timeout
      let completionTimeout = setTimeout(() => {
        setIndexingProgress(95);
        setCurrentFile('Finalizing...');
      }, 30000);

      // Simulate progress if WebSocket not connected
      let simulatedProgress = 50;
      const simulationInterval = setInterval(() => {
        if (simulatedProgress < 95 && indexingProgress < 95) {
          simulatedProgress += Math.random() * 15;
          setIndexingProgress(Math.min(simulatedProgress, 95));
        }
      }, 2000);

      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      clearTimeout(completionTimeout);
      clearInterval(simulationInterval);

      setUploadProgress(100);
      setIndexingProgress(100);
      setSuccessMessage('✅ Import successful! Redirecting to project...');

      // Navigate to project
      setTimeout(() => {
        navigate(`/project/${projectId}`);
      }, 1500);
      
    } catch (error) {
      console.error('Failed to import from GitHub:', error);
      setErrorMessage(`❌ Failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
      setIsValidating(false);
    }
  };

  const handleFileUpload = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (selectedFiles.length === 0 || !projectName) {
      setErrorMessage('❌ Please select files and provide project name');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setIndexingProgress(0);
    
    try {
      // Step 1: Validate files
      setCurrentFile('Validating files...');
      setUploadProgress(5);

      // Step 2: Create project
      setCurrentFile('Creating project...');
      const projectResponse = await projectsAPI.create({
        name: projectName,
        requirements: {
          business_domain: 'Imported Project',
          business_objective: 'Imported from local files'
        }
      });
      
      const projectId = projectResponse.data.id;
      setUploadProgress(15);
      
      // Step 3: Upload files with progress
      const formData = new FormData();
      formData.append('project_id', projectId);
      
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('files', selectedFiles[i]);
        setCurrentFile(`Uploading ${selectedFiles[i].name}...`);
        setUploadProgress(15 + (25 * (i + 1) / selectedFiles.length));
      }
      
      await projectsAPI.uploadFiles(formData);
      setUploadProgress(40);
      
      // Step 4: Index all files
      setCurrentFile('Indexing files with RAG...');
      
      // Wait for indexing (WebSocket will update progress)
      let simulatedProgress = 40;
      const simulationInterval = setInterval(() => {
        if (simulatedProgress < 95 && indexingProgress < 95) {
          simulatedProgress += Math.random() * 15;
          setIndexingProgress(Math.min(simulatedProgress, 95));
        }
      }, 2000);

      await new Promise(resolve => setTimeout(resolve, 5000));
      
      clearInterval(simulationInterval);

      setUploadProgress(100);
      setIndexingProgress(100);
      setSuccessMessage('✅ Upload and indexing complete! Redirecting...');

      // Navigate to project
      setTimeout(() => {
        navigate(`/project/${projectId}`);
      }, 1500);
      
    } catch (error) {
      console.error('Failed to upload files:', error);
      setErrorMessage(`❌ Failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getEstimatedTimeRemaining = () => {
    if (!estimatedTime) return '';
    const timeStr = estimatedTime;
    if (timeStr.includes('hour')) return '~1-2 hours';
    if (timeStr.includes('minute')) return '~10-30 minutes';
    return '~5-10 minutes';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Import Project</h1>
          <p className="text-gray-600">
            Upload files or connect to GitHub. AI will read every line and index all code.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {successMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Progress Card */}
        {loading && (
          <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Upload Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Upload Progress</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-700">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>

                {/* Indexing Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-blue-900">Indexing Progress</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-700">{indexingProgress}%</span>
                  </div>
                  <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-600 to-green-500 transition-all duration-300"
                      style={{ width: `${indexingProgress}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                {fileStats.total > 0 && (
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-blue-200">
                    <div className="text-center">
                      <Zap className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-xs text-blue-900">{fileStats.processed}/{fileStats.total} Files</p>
                    </div>
                    <div className="text-center">
                      <Activity className="h-5 w-5 text-green-600 mx-auto mb-1" />
                      <p className="text-xs text-blue-900">{fileStats.symbols} Symbols</p>
                    </div>
                    <div className="text-center">
                      <Clock className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                      <p className="text-xs text-blue-900">{getEstimatedTimeRemaining()}</p>
                    </div>
                  </div>
                )}

                {/* Current File */}
                <div className="flex items-center gap-2 text-sm text-blue-800 pt-2 border-t border-blue-200">
                  <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                  <span className="truncate">{currentFile || 'Processing...'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="github" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 rounded-lg p-1 w-full">
            <TabsTrigger value="github" className="flex-1">
              <Github className="h-4 w-4 mr-2" />
              GitHub
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex-1">
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </TabsTrigger>
          </TabsList>

          {/* GitHub Import */}
          <TabsContent value="github">
            <Card>
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                <CardTitle>Import from GitHub</CardTitle>
                <CardDescription>
                  Connect your GitHub repository. AI will clone and index all files.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <Label htmlFor="project-name-github" className="font-semibold">Project Name *</Label>
                  <Input
                    id="project-name-github"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="My Awesome Project"
                    disabled={loading}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="github-url" className="font-semibold">Repository URL *</Label>
                  <Input
                    id="github-url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/repo"
                    disabled={loading}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: https://github.com/owner/repo</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="github-branch" className="font-semibold">Branch</Label>
                    <Input
                      id="github-branch"
                      value={githubBranch}
                      onChange={(e) => setGithubBranch(e.target.value)}
                      placeholder="main"
                      disabled={loading}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="github-token" className="font-semibold">GitHub Token (Optional)</Label>
                    <Input
                      id="github-token"
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="ghp_..."
                      disabled={loading}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">For private repos</p>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">What happens next:</h4>
                  <ol className="text-sm text-gray-600 space-y-2 list-decimal ml-5">
                    <li>Validate GitHub repository</li>
                    <li>Clone repository with shallow depth limit</li>
                    <li>Read every file line by line</li>
                    <li>Extract code symbols (functions, classes, variables)</li>
                    <li>Generate semantic embeddings (vectors)</li>
                    <li>Store in vector database (Qdrant/RAG)</li>
                    <li>Build dependency graph</li>
                    <li>AI agent ready to modify code!</li>
                  </ol>
                </div>

                <Button
                  onClick={handleGithubImport}
                  disabled={loading || !githubUrl || !projectName || !validateGithubUrl(githubUrl)}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-10 font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isValidating ? 'Validating...' : 'Importing and Indexing...'}
                    </>
                  ) : (
                    <>
                      <Github className="h-4 w-4 mr-2" />
                      Import from GitHub
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* File Upload */}
          <TabsContent value="upload">
            <Card>
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                <CardTitle>Upload Files</CardTitle>
                <CardDescription>
                  Upload project files. AI will read and index all code.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <Label htmlFor="project-name-upload" className="font-semibold">Project Name *</Label>
                  <Input
                    id="project-name-upload"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="My Awesome Project"
                    disabled={loading}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="file-upload" className="font-semibold">Select Code Files *</Label>
                  <div className="mt-2">
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center py-8">
                        <FolderOpen className="w-12 h-12 mb-2 text-gray-400" />
                        <p className="mb-1 text-sm text-gray-600">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">Supported: .js, .py, .ts, .java, .cpp, .go, etc.</p>
                      </div>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        webkitdirectory=""
                        directory=""
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={loading}
                      />
                    </label>
                  </div>

                  {totalFileSize > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Total size: {(totalFileSize / 1024 / 1024).toFixed(2)}MB / 100MB
                    </p>
                  )}

                  {selectedFiles.length > 0 && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100">
                      <p className="text-sm font-semibold text-gray-900 mb-3">
                        Selected: {selectedFiles.length} files
                      </p>
                      <div className="max-h-40 overflow-auto space-y-1">
                        {selectedFiles.slice(0, 15).map((file, index) => (
                          <div key={index} className="text-xs text-gray-600 flex items-center gap-2">
                            <FileCode className="h-3 w-3 flex-shrink-0 text-blue-600" />
                            <span className="truncate">{file.name}</span>
                            <span className="text-gray-500 flex-shrink-0">({(file.size / 1024).toFixed(0)}KB)</span>
                          </div>
                        ))}
                        {selectedFiles.length > 15 && (
                          <p className="text-xs text-gray-500 pl-5">
                            ...and {selectedFiles.length - 15} more files
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">What happens next:</h4>
                  <ol className="text-sm text-gray-600 space-y-2 list-decimal ml-5">
                    <li>Validate selected files</li>
                    <li>Create project in database</li>
                    <li>Upload all files securely</li>
                    <li>Read every file line by line</li>
                    <li>Extract code symbols and structure</li>
                    <li>Generate semantic embeddings</li>
                    <li>Store in vector database</li>
                    <li>AI agent can now modify your code!</li>
                  </ol>
                </div>

                <Button
                  onClick={handleFileUpload}
                  disabled={loading || selectedFiles.length === 0 || !projectName}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-10 font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading and Indexing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload and Index Files ({selectedFiles.length})
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate('/projects')} disabled={loading}>
            Back to Projects
          </Button>
          <p className="text-xs text-gray-500">
            💡 Tip: Larger projects may take 1-5 minutes to index completely.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectImportEnhanced;
