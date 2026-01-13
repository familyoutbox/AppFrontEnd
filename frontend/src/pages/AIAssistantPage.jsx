import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Send, Loader2, Sparkles, History, Trash2, Plus, Copy, Check,
  MessageSquare, Code, FileText, GitBranch, Search, Play
} from 'lucide-react';
import { toast } from 'sonner';
import Navigation from '../components/Navigation';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { ScrollArea } from '../components/ui/scroll-area';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AIAssistantPage = ({ user, onLogout }) => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const wsRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [actions, setActions] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  
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

  // Manage websocket connection for project-level events (typing, streamed messages)
  useEffect(() => {
    // Close existing socket
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (e) {}
      wsRef.current = null;
    }

    const projectId = currentSession?.project_id;
    if (!projectId) return;

    // Build ws URL from backend URL
    const backend = BACKEND_URL || '';
    const wsUrl = backend.replace(/^http/, 'ws') + `/ws/projects/${projectId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WS connected to project', projectId);
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'typing' && msg.session_id === currentSession?.session_id) {
          setIsTyping(Boolean(msg.status));
        } else if (msg.type === 'chat_message' && msg.session_id === currentSession?.session_id) {
          // Append incoming message
          setMessages(prev => [...prev, msg.message]);
          setIsTyping(false);
        }
      } catch (e) {
        console.error('WS parse error', e);
      }
    };

    ws.onclose = () => {
      console.log('WS closed');
      setIsTyping(false);
    };

    ws.onerror = (e) => {
      console.error('WS error', e);
    };

    return () => {
      try { ws.close(); } catch (e) {}
      wsRef.current = null;
    };
  }, [currentSession?.project_id, currentSession?.session_id]);

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      console.debug('Loading conversations with token present?', Boolean(token));
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
      toast.error('Failed to load conversation');
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
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete conversation');
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
          include_project_context: false
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update current session
      if (!currentSession) {
        setCurrentSession({ session_id: response.data.session_id, project_id: response.data.project_id });
        loadConversations(); // Refresh session list
      }
      // If session existed but project_id returned, ensure we store it
      if (currentSession && response.data.project_id && !currentSession.project_id) {
        setCurrentSession(prev => ({ ...prev, project_id: response.data.project_id }));
      }

      // Add assistant message
      setMessages(prev => [...prev, response.data.message]);
      
      // Update suggestions and actions
      setSuggestions(response.data.suggestions || []);
      setActions(response.data.actions || []);

    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
      
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
      
      toast.success(`${action.label} completed`);
    } catch (error) {
      console.error('Action error:', error);
      toast.error('Action failed');
    } finally {
      setSending(false);
    }
  };

  const copyCode = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Code copied!');
  };

  const renderMessage = (msg, index) => {
    const isUser = msg.role === 'user';
    
    return (
      <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[80%] ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg p-4`}>
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
                      className="absolute top-2 right-2 z-10"
                      onClick={() => copyCode(code, `${index}-${i}`)}
                    >
                      {copiedIndex === `${index}-${i}` ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
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
                    className="absolute top-2 right-2 z-10"
                    onClick={() => copyCode(snippet.code, `snippet-${index}-${i}`)}
                  >
                    {copiedIndex === `snippet-${index}-${i}` ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
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
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onLogout={onLogout} />
      
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar - Conversation History */}
        <div className="w-64 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <Button className="w-full" onClick={startNewChat}>
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2">
              {sessions.map(session => (
                <div
                  key={session.session_id}
                  className={`p-3 mb-2 rounded cursor-pointer hover:bg-gray-100 ${
                    currentSession?.session_id === session.session_id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => loadSession(session.session_id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{session.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {session.message_count} messages
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.session_id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
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
          <div className="bg-white border-b p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Assistant</h1>
                <p className="text-sm text-gray-600">
                  Multi-purpose coding assistant with project awareness
                </p>
                {isTyping && (
                  <p className="text-xs text-gray-500 mt-1">Assistant is typing...</p>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-6">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                  <h2 className="text-2xl font-bold mb-2">Hi! I'm your AI Assistant</h2>
                  <p className="text-gray-600 mb-6">
                    I can help with coding, architecture, code review, and optimization.
                    Start by asking me anything!
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setInputMessage('How do I build a REST API with authentication?')}>
                      <CardContent className="p-4">
                        <Code className="w-5 h-5 mb-2 text-blue-500" />
                        <p className="text-sm font-medium">Code Help</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setInputMessage('Review my code for best practices and security')}>
                      <CardContent className="p-4">
                        <Search className="w-5 h-5 mb-2 text-green-500" />
                        <p className="text-sm font-medium">Code Review</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setInputMessage('Design a scalable microservices architecture')}>
                      <CardContent className="p-4">
                        <GitBranch className="w-5 h-5 mb-2 text-purple-500" />
                        <p className="text-sm font-medium">Architecture</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setInputMessage('Optimize this code for better performance')}>
                      <CardContent className="p-4">
                        <Play className="w-5 h-5 mb-2 text-orange-500" />
                        <p className="text-sm font-medium">Optimization</p>
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
                    <div className="bg-gray-100 rounded-lg p-4">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="px-6 py-2 bg-gray-50 border-t">
              <div className="flex gap-2 flex-wrap">
                {suggestions.map((suggestion, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-300"
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
            <div className="px-6 py-2 bg-white border-t">
              <p className="text-xs text-gray-500 mb-2">Quick Actions:</p>
              <div className="flex gap-2 flex-wrap">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
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
          <div className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <Textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask me anything about coding, architecture, or project planning..."
                className="flex-1 resize-none"
                rows={3}
                disabled={sending}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || sending}
                size="icon"
                className="self-end"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
