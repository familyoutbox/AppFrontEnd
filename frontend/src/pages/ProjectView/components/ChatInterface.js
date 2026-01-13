import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import MessageBubble from './MessageBubble';

const ChatInterface = ({ wsEvents, prompt, setPrompt, onSendMessage, isProcessing, useMultiAgent, setUseMultiAgent }) => {
  // Animations removed for a simpler, static UI

  // State hooks must be declared first
  const [pendingUserInput, setPendingUserInput] = useState(false);
  const [userInputValue, setUserInputValue] = useState("");
  const [pendingTaskId, setPendingTaskId] = useState("");
  const [pendingProjectId, setPendingProjectId] = useState("");

  const [visibleMessages, setVisibleMessages] = useState([]);
  // healthError state is already declared below, so do not redeclare here
  const scrollAreaRef = React.useRef(null);
  const messagesEndRef = React.useRef(null);
  const [wsStatus, setWsStatus] = useState('connecting'); // 'connecting', 'open', 'closed', 'error'

  // Track last event count for animation
  const lastEventCountRef = React.useRef(0);

  // Format and clean LLM response messages
  const formatLLMResponse = (message) => {
    if (!message) return 'No message';
    
    let cleaned = message;
    
    // Remove non-readable characters (control characters, etc)
    cleaned = cleaned.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    
    // Try to detect and format JSON strings
    if (cleaned.includes('{') || cleaned.includes('[')) {
      // Check if entire message is JSON
      try {
        const parsed = JSON.parse(cleaned);
        cleaned = JSON.stringify(parsed, null, 2);
      } catch (e) {
        // Not pure JSON, try to find JSON blocks and format them
        cleaned = cleaned.replace(/(\{[^{}]*\}|\[[^\[\]]*\])/g, (match) => {
          try {
            const parsed = JSON.parse(match);
            return '\n' + JSON.stringify(parsed, null, 2) + '\n';
          } catch (e) {
            return match;
          }
        });
      }
    }
    
    // Clean up escaped characters
    cleaned = cleaned.replace(/\\n/g, '\n');
    cleaned = cleaned.replace(/\\t/g, '  ');
    cleaned = cleaned.replace(/\\"/g, '"');
    cleaned = cleaned.replace(/\\'/g, "'");
    
    // Remove multiple consecutive spaces (but preserve intentional formatting)
    cleaned = cleaned.replace(/ {3,}/g, '  ');
    
    // Trim excessive newlines
    cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');
    
    return cleaned.trim();
  };

  const formatTimestamp = (ts) => {
    try {
      return new Date(ts).toLocaleTimeString();
    } catch (e) {
      return '';
    }
  };

  // Prevent duplicate messages that arrive back-to-back with identical payloads
  const isDuplicateEvent = useCallback((prevEvent, nextEvent) => {
    if (!prevEvent || !nextEvent) return false;
    if (prevEvent.type !== nextEvent.type) return false;
    try {
      return JSON.stringify(prevEvent.data) === JSON.stringify(nextEvent.data);
    } catch (e) {
      return false;
    }
  }, []);

  // Extra suppression for noisy repeated search/status payloads
  const isNoisySearchPayload = (evt) => {
    if (!evt || !evt.data) return false;
    return Boolean(evt.data.query && evt.data.status);
  };

  // Filter out technical/internal events that users don't need to see
  const shouldShowMessage = useCallback((evt) => {
    if (!evt || !evt.type) return false;
    
    // Hide noisy search/status payloads
    if (isNoisySearchPayload(evt)) return false;
    
    // Hide agent_thinking messages (visual noise)
    if (evt.type === 'agent_thinking') return false;
    
    // Hide technical agent_step events (RAG, impact analysis, etc.)
    if (evt.type === 'agent_step') {
      const data = evt.data || {};
      const action = data.action || '';
      
      // Hide all technical actions
      if (action.includes('rag_') || 
          action.includes('impact_') || 
          action.includes('context_') ||
          action.includes('_start') ||
          action.includes('_complete') ||
          data.type === 'action') {
        return false;
      }
      
      // Only show agent_step if it has meaningful user-facing content
      if (!data.reasoning && !data.output_summary && !data.step_type) return false;
    }
    
    // Hide task_progress with technical IDs - show only significant progress
    if (evt.type === 'task_progress') {
      const data = evt.data || {};
      // Hide if it's just technical progress without meaningful updates
      if (!data.title && !data.message && data.progress_percentage < 100) return false;
    }
    
    // Show only meaningful event types
    const allowedTypes = ['llm_response', 'code_generated', 'file_changed', 'error', 'user_message'];
    return allowedTypes.includes(evt.type);
  }, []);

  // Listen for WebSocket status from window (set by ProjectView)
  useEffect(() => {
    function handleWsStatus(e) {
      if (e.detail && e.detail.wsStatus) setWsStatus(e.detail.wsStatus);
    }
    window.addEventListener('ws-status', handleWsStatus);
    return () => window.removeEventListener('ws-status', handleWsStatus);
  }, []);

  // Fallback: if messages arrive but status never flipped to open, mark it open
  useEffect(() => {
    if (wsStatus !== 'open' && wsEvents.length > 0) {
      setWsStatus('open');
    }
  }, [wsEvents, wsStatus]);

  const [healthError, setHealthError] = useState("");

  // Only one handleUserInputSubmit, after state is defined
  const handleUserInputSubmit = React.useCallback(async () => {
    if (!userInputValue.trim() || !pendingTaskId || !pendingProjectId) return;
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
    await fetch(`${backendUrl}/agent/continue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: pendingProjectId,
        task_id: pendingTaskId,
        user_input: userInputValue
      })
    });
    setPendingUserInput(false);
    setUserInputValue("");
    setPendingTaskId("");
    setPendingProjectId("");
  }, [userInputValue, pendingTaskId, pendingProjectId]);

  // Detect requires_user_input in messages
  useEffect(() => {
    if (wsEvents.length > 0) {
      const lastMsg = wsEvents[wsEvents.length - 1];
      if (lastMsg.data?.requires_user_input) {
        setPendingUserInput(true);
        setPendingTaskId(lastMsg.data?.task_id || "");
        setPendingProjectId(lastMsg.data?.project_id || "");
      }
    }
  }, [wsEvents]);

  // Sequential message display - show one at a time with staggered animation
  useEffect(() => {
    if (wsEvents.length === 0) {
      setVisibleMessages([]);
      lastEventCountRef.current = 0;
      return;
    }

    // NEW MESSAGES: Always animate them one by one for smooth experience
    if (wsEvents.length > lastEventCountRef.current) {
      const newEvents = wsEvents.slice(lastEventCountRef.current);
      
      // Add messages one by one with staggered delays
      let cumulativeDelay = 0;
      newEvents.forEach((event, index) => {
        // Filter out noisy/technical events
        if (!shouldShowMessage(event)) {
          return;
        }
        
        setTimeout(() => {
          setVisibleMessages(prev => {
            const last = prev[prev.length - 1];
            if (isDuplicateEvent(last, event)) {
              return prev; // skip duplicate
            }
            return [...prev, event];
          });
        }, cumulativeDelay);
        
        // Calculate delay based on message type for natural pacing
        let messageDelay = 300; // default delay between messages
        
        if (event.type === 'agent_thinking') {
          messageDelay = 800; // Pause for thinking messages so users can read
        } else if (event.type === 'code_generated') {
          messageDelay = 1000; // Major milestones get extra time
        } else if (event.type === 'task_progress') {
          messageDelay = 600; // Progress updates get moderate delay
        } else if (event.type === 'step_start' || event.type === 'step_complete') {
          messageDelay = 700; // Step transitions feel important
        } else if (event.type === 'rag_context' || event.type === 'impact_analysis') {
          messageDelay = 300; // Background info moves faster
        }
        
        // If many messages arrive at once, speed up to prevent long waits
        if (newEvents.length > 10) {
          messageDelay = Math.max(messageDelay * 0.5, 200); // Halve delays but min 200ms
        } else if (newEvents.length > 5) {
          messageDelay = Math.max(messageDelay * 0.7, 300); // Reduce delays but min 300ms
        }
        
        cumulativeDelay += messageDelay;
      });
      
      lastEventCountRef.current = wsEvents.length;
    }
  }, [wsEvents]);

  useEffect(() => {
    scrollToBottom();
  }, [visibleMessages]);

  // Debug: log wsEvents whenever they change
  useEffect(() => {
    console.log('wsEvents:', wsEvents);
  }, [wsEvents]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (isProcessing) return;
    setHealthError("");
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const resp = await fetch(`${backendUrl}/health/ollama`);
      if (!resp.ok) {
        setHealthError('Ollama is unavailable. Please start Ollama and pull gpt-oss:120b-cloud.');
        return;
      }
      const data = await resp.json();
      if (data.status !== 'ok') {
        setHealthError('Ollama is unavailable. Please start Ollama and pull gpt-oss:120b-cloud.');
        return;
      }
      onSendMessage();
    } catch (e) {
      setHealthError('Unable to reach backend health endpoint. Please ensure the backend is running.');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Compact header with connection indicator */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Agent Console</h2>
          <div className="inline-flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${wsStatus === 'open' ? 'bg-green-500' : wsStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
            <span className="text-gray-600">{wsStatus}</span>
          </div>
        </div>
        <div className="text-sm text-gray-500">Project chat</div>
      </div>

      {/* User input prompt for agent pause */}
      {pendingUserInput && (
        <div className="bg-orange-50 border-b border-orange-200 text-orange-900 px-6 py-3 text-sm flex items-center gap-2">
          <span>Agent is waiting for your input:</span>
          <input
            type="text"
            value={userInputValue}
            onChange={e => setUserInputValue(e.target.value)}
            placeholder="Specify files or confirm intent"
            className="border border-orange-300 bg-white rounded px-2 py-1 mx-2 text-gray-900"
            style={{ minWidth: 200 }}
          />
          <Button size="sm" onClick={handleUserInputSubmit} disabled={!userInputValue.trim()}>
            Submit
          </Button>
        </div>
      )}
      {/* Health error banner */}
      {healthError && (
        <div className="bg-red-50 border-b border-red-200 text-red-900 px-6 py-3 text-sm">
          {healthError}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50">
        <div className="p-6">
          <div className="max-w-4xl mx-auto space-y-3">
            {visibleMessages.length === 0 && (
              <div className="text-center py-14 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 border border-gray-200 rounded-full mb-4">
                  <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {wsEvents.length === 0
                    ? 'Waiting for the agent...'
                    : '🚀 Code generation in progress'}
                </h3>
                <p className="text-gray-600 mb-1">
                  {wsEvents.length === 0
                    ? 'No events yet. Send a prompt or check your backend connection.'
                    : 'Your AI agent is generating and will stream updates here.'}
                </p>
                <p className="text-sm text-gray-500">
                  {wsEvents.length === 0
                    ? 'If this persists, inspect the browser console for WebSocket errors.'
                    : 'Stay on this page to watch Copilot-style updates roll in.'}
                </p>
                {wsStatus !== 'open' && (
                  <p className="text-xs text-orange-600 mt-2">Still connecting... if this never changes, check backend URL/env.</p>
                )}
              </div>
            )}

            {/* Render messages with refreshed timeline */}
            <div className="space-y-4">
              {visibleMessages.map((event, idx) => {
                // Skip agent_thinking events - they are just visual noise
                if (event.type === 'agent_thinking') {
                  return null;
                }

                // Simple one-line display for llm_response
                if (event.type === 'llm_response') {
                  const formattedMessage = formatLLMResponse(event.data?.message);
                  const hasNewlines = formattedMessage.includes('\n');
                  
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-semibold text-white">AI</div>
                      </div>
                      <div className="flex-1">
                        {hasNewlines ? (
                          <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans overflow-x-auto bg-gray-50 p-3 rounded border border-gray-200">
                            {formattedMessage}
                          </pre>
                        ) : (
                          <div className="text-sm text-gray-700 leading-relaxed">
                            {formattedMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // Full display for other event types
                const rawType = (event.type || '').toString();
                const typeLabel = rawType
                  ? rawType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                  : 'Event';

                const avatarLabel = typeLabel.split(' ').map(s => s.charAt(0)).join('').slice(0,2).toUpperCase();

                return (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">{avatarLabel || 'EV'}</div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-semibold text-gray-900">{typeLabel}</div>
                          <div className="text-xs text-gray-500">{formatTimestamp(event.data?.timestamp || Date.now())}</div>
                        </div>

                        <MessageBubble event={event} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          
          <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area - sticky rounded bar */}
      <div className="sticky bottom-0 z-10 px-4 py-3 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-lg p-2 shadow-sm">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe what you want to build or modify..."
              className="flex-1 min-h-[48px] max-h-[140px] resize-none bg-transparent border-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 px-3 py-2"
              disabled={isProcessing}
            />

            <Button
              onClick={handleSend}
              disabled={!prompt.trim() || isProcessing}
              size="sm"
              className="rounded-lg p-2 bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>

          <div className="flex justify-between items-center text-xs text-gray-500 mt-2 px-2">
            <div className="flex items-center gap-3">
              <span>Press Enter to send, Shift+Enter for newline</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useMultiAgent || false}
                  onChange={(e) => setUseMultiAgent && setUseMultiAgent(e.target.checked)}
                  className="w-3.5 h-3.5 text-blue-600 border-gray-400 rounded focus:ring-blue-500"
                />
                <span className="text-blue-600 font-medium">🚀 Multi-Agent Mode (3-5x faster)</span>
              </label>
            </div>
            <div className="text-gray-600">{isProcessing ? 'Processing...' : ''}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
