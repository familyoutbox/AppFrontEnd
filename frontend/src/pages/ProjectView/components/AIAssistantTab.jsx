import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Send, Loader2, Sparkles, Trash2, Copy, Check,
  Code, Search, GitBranch, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const AIAssistantTab = ({ projectId }) => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [actions, setActions] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [advancedMode, setAdvancedMode] = useState(false); // Multi-agent mode toggle
  const [agentStatus, setAgentStatus] = useState(null);
  const [autonomousMode, setAutonomousMode] = useState(false); // Fully autonomous mode
  const [generating, setGenerating] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${BACKEND_URL}/api/ai-assistant/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(response.data.conversations);
    } catch (error) {
      console.error('Load conversations error:', error);
    }
  };

  const startNewChat = () => {
    setCurrentSession(null);
    setMessages([]);
    setSuggestions([]);
    setActions([]);
    inputRef.current?.focus();
  };

  const loadSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${BACKEND_URL}/api/ai-assistant/conversation/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCurrentSession(response.data);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Load session error:', error);
    }
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm('Delete this conversation?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(
        `${BACKEND_URL}/api/ai-assistant/conversation/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSessions(sessions.filter(s => s.session_id !== sessionId));
      if (currentSession?.session_id === sessionId) {
        startNewChat();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || sending) return;

    const userMsg = inputMessage;
    setInputMessage('');
    setSending(true);

    // Add user message to UI immediately
    const tempUserMsg = {
      role: 'user',
      content: userMsg,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${BACKEND_URL}/api/ai-assistant/chat`,
        {
          message: userMsg,
          session_id: currentSession?.session_id,
          project_id: projectId,
          include_project_context: true,
          metadata: { advanced_mode: advancedMode } // Pass advanced mode flag
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update current session
      if (!currentSession) {
        setCurrentSession({ session_id: response.data.session_id });
        loadConversations(); // Refresh session list
      }

      // Add assistant message
      setMessages(prev => [...prev, response.data.message]);
      
      // Update suggestions and actions
      setSuggestions(response.data.suggestions || []);
      setActions(response.data.actions || []);

    } catch (error) {
      console.error('Send message error:', error);
      
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setSending(false);
    }
  };

  const useSuggestion = (suggestion) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  const executeAction = async (action) => {
    setSending(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${BACKEND_URL}/api/ai-assistant/action`,
        {
          action: action.action,
          context: { description: inputMessage },
          session_id: currentSession?.session_id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Add action result to messages
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Action error:', error);
    } finally {
      setSending(false);
    }
  };

  const startAutonomousGeneration = async () => {
    if (!inputMessage.trim() || generating) return;

    const description = inputMessage;
    setInputMessage('');
    setGenerating(true);

    // Add user message
    const tempUserMsg = {
      role: 'user',
      content: `🚀 AUTONOMOUS GENERATION REQUEST:\n${description}`,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    // Add status message
    const statusMsg = {
      role: 'assistant',
      content: '⚙️ Initializing autonomous agent system...\n\n' +
               ' Phase 1: Planning architecture and tasks\n' +
               '💻 Phase 2: Implementing with self-healing agents\n' +
               '🧪 Phase 3: Testing and validation\n' +
               '✅ Phase 4: Code review and optimization\n' +
               '🚀 Phase 5: Infrastructure deployment\n\n' +
               'This may take several minutes. I will update you with progress...',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, statusMsg]);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${BACKEND_URL}/api/ai-assistant/autonomous-generate`,
        {
          description: description,
          project_id: projectId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Format the result
      let resultMessage = '🎉 **Autonomous Generation Complete!**\n\n';
      
      if (response.data.status === 'completed') {
        const phases = response.data.phases || {};
        
        resultMessage += `**Project ID:** ${response.data.project_id}\n`;
        resultMessage += `**Output Directory:** ${response.data.project_dir}\n\n`;
        
        resultMessage += '**Phases Executed:**\n';
        if (phases.planning?.status === 'success') {
          resultMessage += `✅ Planning: ${phases.planning.result?.plan?.tasks?.length || 0} tasks created\n`;
        }
        if (phases.implementation) {
          resultMessage += `✅ Implementation: ${phases.implementation.tasks_completed || 0} tasks completed\n`;
          resultMessage += `✅ Files Generated: ${phases.implementation.generated_files?.length || 0}\n`;
        }
        if (phases.testing?.status === 'success') {
          resultMessage += '✅ Testing: Validation complete\n';
        }
        if (phases.review?.status === 'success') {
          resultMessage += '✅ Code Review: Quality checks passed\n';
        }
        if (phases.deployment?.status === 'success') {
          resultMessage += '✅ Deployment: Infrastructure provisioned\n';
        }
        
        // Add deployment info if available
        if (response.data.live_url) {
          resultMessage += `\n🌐 **LIVE URL:** ${response.data.live_url}\n`;
        }
        
        if (response.data.one_click_deploy?.enabled) {
          resultMessage += `\n🚀 **One-Click Deploy:** ${response.data.one_click_deploy.deploy_button_url}\n`;
          resultMessage += `${response.data.one_click_deploy.instructions}\n`;
        }
        
        const memory = response.data.memory_summary || {};
        resultMessage += `\n**Self-Healing Stats:**\n`;
        resultMessage += `• Errors Detected & Fixed: ${memory.total_errors_logged || 0}\n`;
        resultMessage += `• Solutions Cached: ${memory.solutions_cached || 0}\n`;
        
        resultMessage += `\n All files saved to: \`${response.data.project_dir}\``;
        resultMessage += `\n\nYou can now review and run the generated project!`;
      } else {
        resultMessage += `❌ Generation failed: ${response.data.error || 'Unknown error'}\n`;
        resultMessage += `Failed at phase: ${response.data.phase || 'unknown'}`;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: resultMessage,
        timestamp: new Date().toISOString()
      }]);

    } catch (error) {
      console.error('Autonomous generation error:', error);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Autonomous generation failed: ${error.response?.data?.detail || error.message}\n\nPlease try again or use standard chat mode.`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderMessage = (msg, index) => {
    const isUser = msg.role === 'user';
    
    return (
      <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[80%] ${isUser ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white' : 'bg-gradient-to-br from-gray-100 to-gray-50 text-gray-900'} rounded-lg p-4 shadow-md`}>
          {/* Message content */}
          <div className="prose prose-sm max-w-none">
            {msg.content.split('```').map((part, i) => {
              if (i % 2 === 1) {
                // Code block
                const lines = part.split('\n');
                const language = lines[0].trim() || 'text';
                const code = lines.slice(1).join('\n');
                
                return (
                  <div key={i} className="relative my-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 z-10 bg-gray-800 hover:bg-gray-700"
                      onClick={() => copyCode(code, `${index}-${i}`)}
                    >
                      {copiedIndex === `${index}-${i}` ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-300" />
                      )}
                    </Button>
                    <SyntaxHighlighter
                      language={language}
                      style={vscDarkPlus}
                      customStyle={{ margin: 0, borderRadius: '0.5rem' }}
                    >
                      {code}
                    </SyntaxHighlighter>
                  </div>
                );
              } else {
                // Regular text
                return (
                  <div key={i} className="whitespace-pre-wrap">
                    {part}
                  </div>
                );
              }
            })}
          </div>
          
          {/* Code snippets */}
          {msg.code_snippets && msg.code_snippets.length > 0 && (
            <div className="mt-2 space-y-2">
              {msg.code_snippets.map((snippet, i) => (
                <div key={i} className="relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 z-10 bg-gray-800 hover:bg-gray-700"
                    onClick={() => copyCode(snippet.code, `snippet-${index}-${i}`)}
                  >
                    {copiedIndex === `snippet-${index}-${i}` ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-300" />
                    )}
                  </Button>
                  <SyntaxHighlighter
                    language={snippet.language}
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, borderRadius: '0.5rem' }}
                  >
                    {snippet.code}
                  </SyntaxHighlighter>
                </div>
              ))}
            </div>
          )}
          
          <div className="text-xs mt-2 opacity-70">
            {new Date(msg.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
      {/* Sidebar - Conversation History */}
      <div className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-purple-500/20 flex flex-col">
        <div className="p-4 border-b border-purple-500/20">
          <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" onClick={startNewChat}>
            <Sparkles className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2">
            {sessions.map(session => (
              <div
                key={session.session_id}
                className={`p-3 mb-2 rounded cursor-pointer transition-all ${
                  currentSession?.session_id === session.session_id 
                    ? 'bg-purple-500/20 border-l-4 border-purple-500' 
                    : 'hover:bg-slate-800/50'
                }`}
                onClick={() => loadSession(session.session_id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-slate-100">{session.title}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {session.message_count} messages
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-shrink-0 hover:bg-red-500/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.session_id);
                    }}
                  >
                    <Trash2 className="w-3 h-3 text-slate-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900/50 backdrop-blur-xl border-b border-purple-500/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">AI Assistant</h1>
              <p className="text-sm text-slate-400">
                Multi-purpose coding assistant with project awareness
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                <h2 className="text-2xl font-bold mb-2 text-slate-100">Hi! I'm your AI Assistant</h2>
                <p className="text-slate-400 mb-6">
                  I can help with coding, architecture, code review, and optimization.
                  Start by asking me anything!
                </p>
                
                <div className="grid grid-cols-2 gap-3 text-left">
                  <Card className="cursor-pointer hover:shadow-lg hover:shadow-purple-500/20 transition-all bg-slate-800/50 border-slate-700" onClick={() => setInputMessage('How do I build a REST API with authentication?')}>
                    <CardContent className="p-4">
                      <Code className="w-5 h-5 mb-2 text-blue-400" />
                      <p className="text-sm font-medium text-slate-200">Code Help</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-lg hover:shadow-purple-500/20 transition-all bg-slate-800/50 border-slate-700" onClick={() => setInputMessage('Review my code for best practices and security')}>
                    <CardContent className="p-4">
                      <Search className="w-5 h-5 mb-2 text-green-400" />
                      <p className="text-sm font-medium text-slate-200">Code Review</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-lg hover:shadow-purple-500/20 transition-all bg-slate-800/50 border-slate-700" onClick={() => setInputMessage('Design a scalable microservices architecture')}>
                    <CardContent className="p-4">
                      <GitBranch className="w-5 h-5 mb-2 text-purple-400" />
                      <p className="text-sm font-medium text-slate-200">Architecture</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-lg hover:shadow-purple-500/20 transition-all bg-slate-800/50 border-slate-700" onClick={() => setInputMessage('Optimize this code for better performance')}>
                    <CardContent className="p-4">
                      <Play className="w-5 h-5 mb-2 text-orange-400" />
                      <p className="text-sm font-medium text-slate-200">Optimization</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {messages.map((msg, index) => renderMessage(msg, index))}
              {sending && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg p-4 shadow-md">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="px-6 py-2 bg-slate-900/30 border-t border-purple-500/20">
            <div className="flex gap-2 flex-wrap">
              {suggestions.map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-purple-500/30 bg-purple-500/20 text-slate-200 border-purple-500/30"
                  onClick={() => useSuggestion(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {actions.length > 0 && (
          <div className="px-6 py-2 bg-slate-900/30 border-t border-purple-500/20">
            <p className="text-xs text-slate-400 mb-2">Quick Actions:</p>
            <div className="flex gap-2 flex-wrap">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  className="border-purple-500/30 hover:bg-purple-500/20 text-slate-200"
                  onClick={() => executeAction(action)}
                  disabled={sending}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-slate-900/50 backdrop-blur-xl border-t border-purple-500/20">
          {/* Mode Toggles */}
          <div className="mb-3 space-y-2">
            {/* Advanced Mode Toggle */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={advancedMode}
                  onChange={(e) => setAdvancedMode(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-900"
                />
                <span className="text-sm text-slate-300 group-hover:text-purple-400 transition-colors flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Advanced Multi-Agent Mode
                </span>
              </label>
              {advancedMode && (
                <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-400 text-xs">
                  🚀 10 Specialists Active
                </Badge>
              )}
            </div>

            {/* Autonomous Mode Toggle */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={autonomousMode}
                  onChange={(e) => setAutonomousMode(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-green-600 focus:ring-green-500 focus:ring-offset-slate-900"
                />
                <span className="text-sm text-slate-300 group-hover:text-green-400 transition-colors flex items-center gap-1">
                  <Play className="w-4 h-4" />
                  Autonomous Generation (100% Completion Guarantee)
                </span>
              </label>
              {autonomousMode && (
                <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-400 text-xs">
                  🤖 Self-Healing Active
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (autonomousMode) {
                    startAutonomousGeneration();
                  } else {
                    sendMessage();
                  }
                }
              }}
              placeholder={
                autonomousMode 
                  ? "Describe the complete project to generate (e.g., 'Build a TODO app with React and FastAPI backend')..." 
                  : advancedMode 
                    ? "Ask complex questions - I'll assemble a team of specialists to help you..." 
                    : "Ask me anything about coding, architecture, or project planning..."
              }
              className="flex-1 resize-none bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
              rows={3}
              disabled={sending || generating}
            />
            <Button
              onClick={autonomousMode ? startAutonomousGeneration : sendMessage}
              disabled={!inputMessage.trim() || sending || generating}
              size="icon"
              className={
                autonomousMode
                  ? "self-end bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/50"
                  : advancedMode 
                    ? "self-end bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/50" 
                    : "self-end bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              }
            >
              {sending || generating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : autonomousMode ? (
                <Play className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {autonomousMode
              ? "🤖 Autonomous mode: Full project generation with self-healing agents (may take 5-10 minutes)"
              : advancedMode 
                ? "🎯 Advanced mode: Multiple AI specialists will collaborate on your request"
                : "Press Enter to send, Shift+Enter for new line"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantTab;
