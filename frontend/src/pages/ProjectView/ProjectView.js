import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { projectsAPI, agentAPI, codebaseAPI, createWebSocketConnection } from '@/services/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import ProjectHeader from './components/ProjectHeader';
import ChatInterface from './components/ChatInterface';
import CodeTab from './components/CodeTab';
import DocumentsTab from './components/DocumentsTab';
import DeploymentTab from './components/DeploymentTab';
import DatabaseSchemaPreview from './components/DatabaseSchemaPreview';
// import UIEditor from './components/UIEditor';
import AIAssistantTab from './components/AIAssistantTab';
import { MessageSquare, Code, FileText, Rocket, Database, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const ProjectView = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wsEvents, setWsEvents] = useState([]);
  const [ws, setWs] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [useMultiAgent, setUseMultiAgent] = useState(false);

  const getLanguage = (file) => {
    if (!file) return 'text';
    if (file.language) return file.language;
    const path = (file.path || '').toLowerCase();
    const ext = path.split('.').pop();
    const map = {
      js: 'javascript',
      jsx: 'jsx',
      ts: 'typescript',
      tsx: 'tsx',
      py: 'python',
      java: 'java',
      cs: 'csharp',
      rb: 'ruby',
      php: 'php',
      go: 'go',
      rs: 'rust',
      cpp: 'cpp',
      c: 'c',
      sh: 'bash',
      bash: 'bash',
      json: 'json',
      yml: 'yaml',
      yaml: 'yaml',
      md: 'markdown',
      html: 'html',
      css: 'css',
      sql: 'sql',
      dockerfile: 'dockerfile'
    };
    return map[ext] || 'text';
  };

  useEffect(() => {
    loadProject();
    loadFiles();
    setupWebSocket();

    return () => {
      if (ws) ws.close();
    };
  }, [projectId]);

  const loadProject = async () => {
    try {
      const response = await projectsAPI.get(projectId);
      setProject(response.data);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ref used to debounce/coalesce rapid file_generation events to avoid
  // triggering many back-to-back GET requests and hitting rate limits.
  const reloadTimeoutRef = React.useRef(null);

  const loadFiles = async () => {
    try {
      setLoadingFiles(true);
      const response = await codebaseAPI.listFiles(projectId);
      console.debug('[ProjectView] loadFiles response:', response && response.data ? response.data.length : 'no response', response && response.data ? response.data.slice(0,5) : null);
      const files = (response.data || [])
        .filter((f) => (f.path || '').toLowerCase() !== 'raw_output.txt')
        .map((f) => ({
          ...f,
          size: f.size || 0,
        }));
      setGeneratedFiles(files);
      console.debug('[ProjectView] setGeneratedFiles count =', files.length);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const setupWebSocket = () => {
    try {
      const websocket = createWebSocketConnection(projectId);
      console.debug('Opening project websocket for projectId=', projectId);
      
      websocket.onopen = () => {
        console.log('WebSocket connected');
        console.debug('WebSocket open for project', projectId);
        window.dispatchEvent(new CustomEvent('ws-status', { detail: { wsStatus: 'open' } }));
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.debug('Project WS message received', data);
          setWsEvents(prev => [...prev, data]);
          
          // Stop processing on completion, failure, or when user input is requested
          if (
            (data.type === 'task_progress' && ['completed', 'failed'].includes(data.data?.status)) ||
            data.data?.requires_user_input
          ) {
            setIsProcessing(false);
          }

          if (data.type === 'task_progress' && data.data.status === 'completed') {
            loadProject();
            loadFiles();
          }
          // When backend saves files it broadcasts a file_generation event.
          // Auto-refresh the file list so generated files appear in the UI.
          if (data.type === 'file_generation') {
            // Coalesce rapid events: wait 300ms after the last event before reloading
            console.debug('[ProjectView] file_generation event received, scheduling reload', data);
            if (reloadTimeoutRef.current) clearTimeout(reloadTimeoutRef.current);
            reloadTimeoutRef.current = setTimeout(() => {
              loadFiles();
              reloadTimeoutRef.current = null;
            }, 300);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        window.dispatchEvent(new CustomEvent('ws-status', { detail: { wsStatus: 'error' } }));
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
        window.dispatchEvent(new CustomEvent('ws-status', { detail: { wsStatus: 'closed' } }));
      };

      setWs(websocket);
    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!prompt.trim() || isProcessing) return;

    try {
      const messageText = prompt.trim();

      const userMessage = {
        type: 'user_message',
        project_id: projectId,
        data: { message: messageText },
        timestamp: new Date().toISOString()
      };

      setWsEvents(prev => [...prev, userMessage]);

      setIsProcessing(true);
      const resp = await agentAPI.startTask({
        project_id: projectId,
        task_title: 'Code Generation',
        task_description: messageText,
        use_multi_agent: useMultiAgent
      });
      console.debug('Agent start response', resp && resp.data);
      if (resp && resp.data && resp.data.id) {
        toast.success(`Agent started (task ${resp.data.id})`);
      } else {
        toast.success('Agent start requested');
      }
      
      setPrompt('');
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsProcessing(false);
      toast.error('Failed to start agent. Check backend logs.');
      const errorEvent = {
        type: 'error',
        project_id: projectId,
        data: { message: 'Failed to process request. Please try again.' },
        timestamp: new Date().toISOString()
      };
      setWsEvents(prev => [...prev, errorEvent]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <ProjectHeader
        project={project}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b border-gray-200 bg-white px-6">
              <TabsList>
                <TabsTrigger value="chat">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="ai-assistant">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Assistant
                </TabsTrigger>
                <TabsTrigger value="code">
                  <Code className="w-4 h-4 mr-2" />
                  Code
                </TabsTrigger>
                <TabsTrigger value="documents">
                  <FileText className="w-4 h-4 mr-2" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="deployment">
                  <Rocket className="w-4 h-4 mr-2" />
                  Deployment
                </TabsTrigger>
                <TabsTrigger value="database">
                  <Database className="w-4 h-4 mr-2" />
                  Database
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="chat" className="flex-1 m-0">
              <ChatInterface
                wsEvents={wsEvents}
                prompt={prompt}
                setPrompt={setPrompt}
                onSendMessage={handleSendMessage}
                isProcessing={isProcessing}
                useMultiAgent={useMultiAgent}
                setUseMultiAgent={setUseMultiAgent}
              />
            </TabsContent>

            <TabsContent value="ai-assistant" className="flex-1 m-0">
              <AIAssistantTab projectId={projectId} />
            </TabsContent>

            <TabsContent value="code" className="flex-1 m-0">
              <CodeTab files={generatedFiles} getLanguage={getLanguage} />
            </TabsContent>

            <TabsContent value="documents" className="flex-1 m-0">
              <DocumentsTab files={generatedFiles} getLanguage={getLanguage} />
            </TabsContent>

            <TabsContent value="deployment" className="flex-1 m-0">
              <DeploymentTab files={generatedFiles} getLanguage={getLanguage} />
            </TabsContent>

            <TabsContent value="database" className="flex-1 m-0">
              <div className="h-full bg-white">
                <DatabaseSchemaPreview projectId={projectId} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar removed */}
        {/* <Sidebar project={project} isOpen={isSidebarOpen} /> */}
      </div>
    </div>
  );
};

export default ProjectView;
