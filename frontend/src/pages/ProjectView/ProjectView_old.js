import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, agentAPI, createWebSocketConnection } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CanvasUIEditor from './CanvasUIEditor';
import CodePreviewPanel from './CodePreviewPanel';
import ModuleManager from './ModuleManager';
import { 
  Menu, 
  Plus, 
  Send, 
  Code, 
  Sparkles, 
  History,
  Settings,
  FileText,
  Loader2,
  Layout,
  Eye,
  Layers
} from 'lucide-react';

const ProjectView = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wsEvents, setWsEvents] = useState([]);
  const [ws, setWs] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadProject();
    setupWebSocket();

    return () => {
      if (ws) ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [wsEvents]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  const setupWebSocket = () => {
    try {
      const websocket = createWebSocketConnection(projectId);
      
      websocket.onopen = () => {
        console.log('WebSocket connected');
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setWsEvents(prev => [...prev, data]);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
      };

      setWs(websocket);
    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!prompt.trim() || isProcessing) return;

    const userMessage = prompt;
    setPrompt('');
    setIsProcessing(true);

    // Add user message to events
    setWsEvents(prev => [...prev, {
      type: 'user_message',
      data: { message: userMessage },
      timestamp: new Date().toISOString()
    }]);

    try {
      // Send task to agent orchestrator
      await agentAPI.startTask({
        project_id: projectId,
        task_title: 'User Request',
        task_description: userMessage
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setWsEvents(prev => [...prev, {
        type: 'error',
        data: { message: 'Failed to process request. Please try again.' },
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 mx-auto animate-spin" />
          <p className="text-gray-600 mt-4">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Project not found</h2>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-white">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} bg-gray-50 border-r border-gray-200 transition-all duration-300 overflow-hidden`}>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">AI Agent</h1>
          </div>

          <Button 
            onClick={() => navigate('/dashboard')}
            variant="outline" 
            className="w-full justify-start mb-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>

          <div className="space-y-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
              Current Project
            </div>
            <div className="px-3 py-2 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Code className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-gray-900 text-sm truncate">
                  {project.name}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">
                {project.requirements?.business_domain}
              </p>
            </div>

            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase mt-6">
              Quick Actions
            </div>
            <Button variant="ghost" className="w-full justify-start text-sm">
              <FileText className="h-4 w-4 mr-2" />
              View Files
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sm">
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sm"
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-gray-200 flex items-center px-6 justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="mr-4"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-medium text-gray-900">{project.name}</h2>
          </div>

          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-gray-100">
              <TabsTrigger value="chat">
                <Sparkles className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="modules">
                <Layers className="h-4 w-4 mr-2" />
                Modules
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Preview & Data
              </TabsTrigger>
              <TabsTrigger value="canvas">
                <Layout className="h-4 w-4 mr-2" />
                Canvas
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content Area */}
        {activeTab === 'chat' ? (
          <>
            {/* Messages Area */}
            <ScrollArea className="flex-1 px-6">
          <div className="max-w-4xl mx-auto py-8">
            {wsEvents.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="h-20 w-20 text-blue-600 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-gray-900 mb-3">
                  Autonomous AI Agent
                </h3>
                <p className="text-lg text-gray-600 mb-8">
                  I can generate entire systems, handle complex business logic, and modify your codebase
                </p>
                
                {/* Capabilities Grid */}
                <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 px-6 text-left flex flex-col items-start hover:border-blue-500 hover:bg-blue-50"
                    onClick={() => setPrompt('Generate a complete banking loan underwriting system with credit scoring, fraud detection, and risk assessment')}
                  >
                    <span className="font-semibold mb-1 text-blue-600">🏦 Banking Systems</span>
                    <span className="text-xs text-gray-500">Loan underwriting, fraud detection, core banking</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 px-6 text-left flex flex-col items-start hover:border-purple-500 hover:bg-purple-50"
                    onClick={() => setPrompt('Create an insurance claims adjudication system with multi-stage approval and medical coding validation')}
                  >
                    <span className="font-semibold mb-1 text-purple-600">🏥 Insurance & Healthcare</span>
                    <span className="text-xs text-gray-500">Claims processing, EMR, clinical decision support</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 px-6 text-left flex flex-col items-start hover:border-green-500 hover:bg-green-50"
                    onClick={() => setPrompt('Build a multi-jurisdiction tax calculation engine with GST, VAT, and US tax rules')}
                  >
                    <span className="font-semibold mb-1 text-green-600">💰 Tax & Compliance</span>
                    <span className="text-xs text-gray-500">Tax engines, AML, regulatory compliance</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 px-6 text-left flex flex-col items-start hover:border-orange-500 hover:bg-orange-50"
                    onClick={() => setPrompt('Develop a supply chain optimization system with demand forecasting and inventory management')}
                  >
                    <span className="font-semibold mb-1 text-orange-600">📦 ERP & Supply Chain</span>
                    <span className="text-xs text-gray-500">Manufacturing, logistics, inventory optimization</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 px-6 text-left flex flex-col items-start hover:border-pink-500 hover:bg-pink-50"
                    onClick={() => setPrompt('Create an HR payroll system with multi-country tax rules and benefits management')}
                  >
                    <span className="font-semibold mb-1 text-pink-600">👥 HR & Payroll</span>
                    <span className="text-xs text-gray-500">Payroll, benefits, attendance, compliance</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 px-6 text-left flex flex-col items-start hover:border-indigo-500 hover:bg-indigo-50"
                    onClick={() => setPrompt('Add a new feature to the existing codebase')}
                  >
                    <span className="font-semibold mb-1 text-indigo-600"> Modify Existing Code</span>
                    <span className="text-xs text-gray-500">Add features, fix bugs, refactor code</span>
                  </Button>
                </div>

                {/* Info Banner */}
                <div className="max-w-3xl mx-auto p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700">
                    <strong>💡 Just describe what you need:</strong> I'll analyze, design architecture, generate all components, 
                    create data models, implement business rules, write tests, and provide documentation. I handle hundreds or thousands of rules automatically.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {wsEvents.map((event, index) => (
                  <MessageBubble key={index} event={event} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

            {/* Input Area with Copilot-style Task Status */}
            <div className="border-t border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto">
            {/* Task Status Panel (Copilot Style) */}
            {isProcessing && (
              <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">
                        AI Agent Working...
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {wsEvents.filter(e => e.type === 'agent_step').length} steps completed
                    </span>
                  </div>
                  
                  {/* Current Task */}
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 animate-pulse"></div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Current Task:</p>
                        <p className="text-sm font-medium text-gray-900">
                          {wsEvents.length > 0 && wsEvents[wsEvents.length - 1].type === 'agent_thinking' 
                            ? wsEvents[wsEvents.length - 1].data.thought 
                            : 'Analyzing your request...'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Task List */}
                  {wsEvents.filter(e => e.type === 'task_progress').length > 0 && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Todo List:</p>
                      <div className="space-y-1">
                        {wsEvents.filter(e => e.type === 'task_progress')[0]?.data?.steps?.map((step, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            {step.status === 'completed' ? (
                              <span className="text-green-600">✓</span>
                            ) : step.status === 'running' ? (
                              <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                            ) : (
                              <span className="text-gray-400">○</span>
                            )}
                            <span className={step.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-700'}>
                              {step.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  {wsEvents.filter(e => e.type === 'task_progress').length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Progress</span>
                        <span className="text-xs font-medium text-blue-600">
                          {wsEvents.filter(e => e.type === 'task_progress')[0]?.data?.progress_percentage || 0}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-500"
                          style={{ width: `${wsEvents.filter(e => e.type === 'task_progress')[0]?.data?.progress_percentage || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Prompt Input */}
            <div className="p-4">
              <div className="relative">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything: Generate banking system, add fraud detection, modify database, run tests..."
                  className="pr-12 min-h-[100px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!prompt.trim() || isProcessing}
                  size="sm"
                  className="absolute bottom-3 right-3 rounded-full h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  Press Enter to send, Shift+Enter for new line
                </p>
                <p className="text-xs text-gray-400">
                  I can handle complex business logic, banking systems, insurance, healthcare, and more
                </p>
              </div>
            </div>
          </div>
        </div>
          </>
        ) : activeTab === 'modules' ? (
          /* Module Manager */
          <div className="flex-1 overflow-hidden">
            <ModuleManager projectId={projectId} />
          </div>
        ) : activeTab === 'preview' ? (
          /* Code Preview & Data */
          <div className="flex-1 overflow-hidden">
            <CodePreviewPanel projectId={projectId} files={[]} />
          </div>
        ) : (
          /* Canvas Editor */
          <div className="flex-1 overflow-hidden">
            <CanvasUIEditor projectId={projectId} />
          </div>
        )}
      </div>
    </div>
  );
};

// Message Bubble Component with Diagram Support
const MessageBubble = ({ event }) => {
  const renderDiagram = (content) => {
    // Check if content contains mermaid diagram
    const mermaidMatch = content.match(/```mermaid\n([\s\S]*?)```/);
    if (mermaidMatch) {
      return (
        <div className="my-4 p-4 bg-white rounded-lg border border-gray-200">
          <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap">
            {mermaidMatch[1]}
          </pre>
          <p className="text-xs text-gray-500 mt-2">📊 Mermaid Diagram (use online viewer or mermaid extension)</p>
        </div>
      );
    }

    // Check for ASCII diagrams (lines with box drawing characters)
    if (content.match(/[┌┐└┘├┤┬┴┼─│]/)) {
      return (
        <div className="my-4 p-4 bg-gray-900 rounded-lg">
          <pre className="text-green-400 font-mono text-xs whitespace-pre">
            {content}
          </pre>
        </div>
      );
    }

    // Check for code blocks
    const codeMatch = content.match(/```(\w+)?\n([\s\S]*?)```/);
    if (codeMatch) {
      return (
        <div className="my-4 p-4 bg-gray-900 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">{codeMatch[1] || 'code'}</span>
            <button className="text-xs text-blue-400 hover:text-blue-300">Copy</button>
          </div>
          <pre className="text-green-400 font-mono text-xs whitespace-pre-wrap overflow-x-auto">
            {codeMatch[2]}
          </pre>
        </div>
      );
    }

    return <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>;
  };

  if (event.type === 'user_message') {
    return (
      <div className="flex justify-end">
        <div className="bg-blue-600 text-white rounded-3xl px-6 py-3 max-w-2xl">
          <p className="text-sm">{event.data.message}</p>
        </div>
      </div>
    );
  }

  // AI responses
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
        <Sparkles className="h-5 w-5 text-blue-600" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="bg-gray-100 rounded-3xl px-6 py-4 max-w-3xl">
          {event.type === 'agent_thinking' && (
            <div>
              <p className="text-sm text-gray-900"> {event.data.thought}</p>
            </div>
          )}
          {event.type === 'agent_step' && (
            <div className="text-sm space-y-3">
              <p className="font-medium text-gray-900 mb-2">
                Step {event.data.step?.step_number}: {event.data.step?.type}
              </p>
              <p className="text-gray-700">{event.data.step?.reasoning}</p>
              {event.data.step?.output_summary && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-gray-800 text-xs">
                    ✅ {event.data.step.output_summary}
                  </p>
                </div>
              )}
              {/* Show diagrams if included */}
              {event.data.step?.diagrams && (
                <div className="space-y-3">
                  {event.data.step.diagrams.map((diagram, idx) => (
                    <div key={idx}>
                      <p className="text-xs font-medium text-gray-600 mb-2">{diagram.title}</p>
                      {renderDiagram(diagram.content)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {event.type === 'diagram' && (
            <div className="text-sm space-y-2">
              <p className="font-medium text-gray-900 flex items-center gap-2">
                📊 {event.data.diagram_type || 'Diagram'}
              </p>
              {renderDiagram(event.data.content)}
            </div>
          )}
          {event.type === 'code_generated' && (
            <div className="text-sm space-y-2">
              <p className="font-medium text-gray-900">💻 Code Generated</p>
              <div className="p-3 bg-gray-900 rounded-lg">
                <p className="text-xs text-gray-400 mb-2">{event.data.file_path}</p>
                <pre className="text-green-400 font-mono text-xs whitespace-pre-wrap overflow-x-auto max-h-96">
                  {event.data.code}
                </pre>
              </div>
            </div>
          )}
          {event.type === 'sample_data' && (
            <div className="text-sm space-y-2">
              <p className="font-medium text-gray-900">📝 Sample Data Generated</p>
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <pre className="text-gray-800 font-mono text-xs whitespace-pre-wrap overflow-x-auto max-h-64">
                  {JSON.stringify(event.data.data, null, 2)}
                </pre>
              </div>
              <button className="text-xs text-blue-600 hover:underline">
                Edit Sample Data →
              </button>
            </div>
          )}
          {event.type === 'task_progress' && (
            <div className="text-sm">
              <p className="font-medium text-gray-900">
                📊 Progress: {event.data.progress_percentage}%
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Step {event.data.current_step} of {event.data.total_steps}
              </p>
            </div>
          )}
          {event.type === 'file_changed' && (
            <div className="text-sm">
              <p className="text-gray-900">
                📝 <span className="font-medium">{event.data.change_type}</span>: {event.data.file_path}
              </p>
            </div>
          )}
          {event.type === 'impact_analysis' && (
            <div className="text-sm space-y-2">
              <p className="font-medium text-gray-900 mb-1">🎯 Impact Analysis</p>
              <p className="text-gray-700">
                Analyzing {event.data.blast_radius?.length || 0} affected files
              </p>
              {event.data.blast_radius && event.data.blast_radius.length > 0 && (
                <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Affected files:</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    {event.data.blast_radius.slice(0, 5).map((file, idx) => (
                      <li key={idx}>• {file}</li>
                    ))}
                    {event.data.blast_radius.length > 5 && (
                      <li className="text-gray-500">...and {event.data.blast_radius.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
              <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                event.data.risk_level === 'low' ? 'bg-green-100 text-green-800' :
                event.data.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                Risk: {event.data.risk_level}
              </span>
            </div>
          )}
          {event.type === 'error' && (
            <div className="text-sm text-red-600 p-3 bg-red-50 rounded-lg">
              <p className="font-medium mb-1">❌ Error</p>
              <p>{event.data.message}</p>
            </div>
          )}
          {!['agent_thinking', 'agent_step', 'task_progress', 'file_changed', 'impact_analysis', 'error', 'user_message', 'diagram', 'code_generated', 'sample_data'].includes(event.type) && (
            renderDiagram(JSON.stringify(event.data, null, 2))
          )}
        </div>
        <p className="text-xs text-gray-400 px-6">
          {new Date(event.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default ProjectView;
