import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  Code, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2, 
  FileCode,
  AlertCircle,
  Zap,
  Search,
  Target,
  Activity
} from 'lucide-react';

/**
 * Enhanced Agent Stream Component
 * Displays all live stream messages in real-time
 */
const EnhancedAgentStream = ({ projectId, wsEvents }) => {
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef(null);
  
  useEffect(() => {
    // Process new WebSocket events
    if (wsEvents && wsEvents.length > 0) {
      const latestEvent = wsEvents[wsEvents.length - 1];
      addMessage(latestEvent);
    }
  }, [wsEvents]);
  
  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  const addMessage = (event) => {
    const formatted = formatMessage(event);
    setMessages(prev => [...prev, formatted]);
  };
  
  const formatMessage = (event) => {
    return {
      id: Date.now() + Math.random(),
      type: event.type,
      data: event.data,
      timestamp: new Date().toLocaleTimeString()
    };
  };
  
  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500 animate-pulse" />
              Live Agent Stream
            </CardTitle>
            <Badge className="bg-green-500">
              <span className="animate-pulse">● LIVE</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{messages.length}</p>
              <p className="text-xs text-slate-400">Messages</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-500">
                {messages.filter(m => m.type === 'agent_step').length}
              </p>
              <p className="text-xs text-slate-400">Steps</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">
                {messages.filter(m => m.type === 'file_changed').length}
              </p>
              <p className="text-xs text-slate-400">Files Changed</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Message Stream */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          <ScrollArea className="h-[600px] p-4" ref={scrollRef}>
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Waiting for agent to start...</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Messages will appear here in real-time
                  </p>
                </div>
              ) : (
                messages.map(msg => <MessageItem key={msg.id} message={msg} />)
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Individual Message Item
 * Renders different UI based on message type
 */
const MessageItem = ({ message }) => {
  const { type, data, timestamp } = message;
  
  switch (type) {
    case 'agent_step':
      return <AgentStepMessage data={data} timestamp={timestamp} />;
    case 'task_progress':
      return <TaskProgressMessage data={data} timestamp={timestamp} />;
    case 'agent_thinking':
      return <ThinkingMessage data={data} timestamp={timestamp} />;
    case 'file_changed':
      return <FileChangedMessage data={data} timestamp={timestamp} />;
    case 'impact_analysis':
      return <ImpactAnalysisMessage data={data} timestamp={timestamp} />;
    case 'rag_context':
      return <RAGContextMessage data={data} timestamp={timestamp} />;
    case 'compilation_check':
      return <CompilationMessage data={data} timestamp={timestamp} />;
    case 'self_healing':
      return <SelfHealingMessage data={data} timestamp={timestamp} />;
    case 'validation_check':
      return <ValidationMessage data={data} timestamp={timestamp} />;
    case 'error':
      return <ErrorMessage data={data} timestamp={timestamp} />;
    default:
      return <DefaultMessage message={message} />;
  }
};

// Agent Step Message
const AgentStepMessage = ({ data, timestamp }) => {
  const step = data.step || {};
  const statusIcon = {
    completed: <CheckCircle className="h-4 w-4 text-green-500" />,
    running: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
    failed: <XCircle className="h-4 w-4 text-red-500" />,
    pending: <Clock className="h-4 w-4 text-gray-500" />
  }[step.status] || <Clock className="h-4 w-4" />;
  
  return (
    <div className="bg-slate-900 p-4 rounded border border-slate-700">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">{statusIcon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-white">
              Step {step.step_number}: {step.type}
            </span>
            <span className="text-xs text-slate-500">{timestamp}</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-purple-400"> Reasoning:</span>
              <p className="text-slate-300 mt-1">{step.reasoning}</p>
            </div>
            
            {step.tool && (
              <div>
                <span className="text-blue-400">🔧 Tool:</span>
                <Badge variant="outline" className="ml-2">{step.tool}</Badge>
              </div>
            )}
            
            {step.input_summary && (
              <div>
                <span className="text-yellow-400">📝 Input:</span>
                <p className="text-slate-400 mt-1">{step.input_summary}</p>
              </div>
            )}
            
            {step.output_summary && (
              <div>
                <span className="text-green-400">✅ Output:</span>
                <p className="text-slate-400 mt-1">{step.output_summary}</p>
              </div>
            )}
            
            {step.affected_files && step.affected_files.length > 0 && (
              <div>
                <span className="text-orange-400"> Files:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {step.affected_files.map((file, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {file}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Working Progress Message
const TaskProgressMessage = ({ data, timestamp }) => {
  const { status, progress_percentage, current_step, total_steps, steps } = data;
  
  return (
    <div className="bg-purple-900/20 p-4 rounded border border-purple-700">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-white"> Working Progress</span>
        <span className="text-xs text-slate-500">{timestamp}</span>
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300">
              Step {current_step} of {total_steps}
            </span>
            <span className="text-purple-400">{progress_percentage}%</span>
          </div>
          <Progress value={progress_percentage} className="h-2" />
        </div>
        
        {steps && steps.length > 0 && (
          <div className="space-y-1">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {step.status === 'completed' && <CheckCircle className="h-3 w-3 text-green-500" />}
                {step.status === 'running' && <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />}
                {step.status === 'pending' && <Clock className="h-3 w-3 text-gray-500" />}
                <span className={step.status === 'completed' ? 'text-slate-400' : 'text-white'}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Thinking Message
const ThinkingMessage = ({ data, timestamp }) => {
  return (
    <div className="bg-blue-900/20 p-4 rounded border border-blue-700">
      <div className="flex items-start gap-3">
        <Brain className="h-5 w-5 text-blue-400 flex-shrink-0 mt-1 animate-pulse" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white"> Thinking...</span>
            <span className="text-xs text-slate-500">{timestamp}</span>
          </div>
          <p className="text-slate-300 text-sm italic">"{data.thought}"</p>
          {data.confidence && (
            <div className="mt-2">
              <Badge variant="outline">Confidence: {Math.round(data.confidence * 100)}%</Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// File Changed Message
const FileChangedMessage = ({ data, timestamp }) => {
  const changeTypeColor = {
    created: 'text-green-500',
    modified: 'text-yellow-500',
    deleted: 'text-red-500'
  }[data.change_type] || 'text-blue-500';
  
  return (
    <div className="bg-slate-900 p-4 rounded border border-slate-700">
      <div className="flex items-start gap-3">
        <FileCode className={`h-5 w-5 ${changeTypeColor} flex-shrink-0 mt-1`} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">
              📝 File {data.change_type}: {data.file_path}
            </span>
            <span className="text-xs text-slate-500">{timestamp}</span>
          </div>
          
          {data.changes && (
            <div className="text-xs text-slate-400 space-y-1">
              <p>+{data.changes.lines_added} lines added</p>
              <p>-{data.changes.lines_removed} lines removed</p>
              {data.reason && (
                <p className="text-slate-300 mt-2">Reason: {data.reason}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Impact Analysis Message
const ImpactAnalysisMessage = ({ data, timestamp }) => {
  return (
    <div className="bg-orange-900/20 p-4 rounded border border-orange-700">
      <div className="flex items-start gap-3">
        <Target className="h-5 w-5 text-orange-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">🎯 Impact Analysis</span>
            <span className="text-xs text-slate-500">{timestamp}</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <p className="text-slate-300">
              💥 Blast Radius: {data.blast_radius?.length || 0} files affected
            </p>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Risk Level:</span>
              <Badge className={`
                ${data.risk_level === 'low' ? 'bg-green-500' : ''}
                ${data.risk_level === 'medium' ? 'bg-yellow-500' : ''}
                ${data.risk_level === 'high' ? 'bg-orange-500' : ''}
                ${data.risk_level === 'critical' ? 'bg-red-500' : ''}
              `}>
                {data.risk_level?.toUpperCase()}
              </Badge>
            </div>
            {data.critical_files && data.critical_files.length > 0 && (
              <div>
                <p className="text-red-400">🔴 Critical Files:</p>
                <ul className="list-disc list-inside text-slate-400 mt-1">
                  {data.critical_files.slice(0, 3).map((file, i) => (
                    <li key={i}>{file}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// RAG Context Message
const RAGContextMessage = ({ data, timestamp }) => {
  return (
    <div className="bg-green-900/20 p-4 rounded border border-green-700">
      <div className="flex items-start gap-3">
        <Search className="h-5 w-5 text-green-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">🔍 Searching Codebase...</span>
            <span className="text-xs text-slate-500">{timestamp}</span>
          </div>
          
          <p className="text-slate-300 text-sm mb-2">Query: "{data.query}"</p>
          <p className="text-green-400 text-sm">📚 Found {data.results_count} relevant code chunks</p>
          
          {data.top_results && data.top_results.length > 0 && (
            <div className="mt-2 space-y-1">
              {data.top_results.map((result, i) => (
                <div key={i} className="text-xs text-slate-400">
                  {i + 1}. {result.file} → {result.symbol} ({Math.round(result.relevance * 100)}% match)
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Compilation Message
const CompilationMessage = ({ data, timestamp }) => {
  return (
    <div className={`p-4 rounded border ${
      data.status === 'success' 
        ? 'bg-green-900/20 border-green-700' 
        : 'bg-red-900/20 border-red-700'
    }`}>
      <div className="flex items-start gap-3">
        <Zap className={`h-5 w-5 flex-shrink-0 mt-1 ${
          data.status === 'success' ? 'text-green-400' : 'text-red-400'
        }`} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">
              🔨 Compilation Check: {data.language}
            </span>
            <span className="text-xs text-slate-500">{timestamp}</span>
          </div>
          
          <div className="space-y-1 text-sm">
            <p className={data.status === 'success' ? 'text-green-400' : 'text-red-400'}>
              Status: {data.status.toUpperCase()} {data.status === 'success' ? '✅' : '❌'}
            </p>
            {data.execution_time && (
              <p className="text-slate-400">Execution time: {data.execution_time}</p>
            )}
            {data.errors && data.errors.length > 0 && (
              <p className="text-red-400">{data.errors.length} errors found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Self-Healing Message
const SelfHealingMessage = ({ data, timestamp }) => {
  return (
    <div className="bg-yellow-900/20 p-4 rounded border border-yellow-700">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-1 animate-pulse" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">
              🔧 Self-Healing: Iteration {data.iteration}
            </span>
            <span className="text-xs text-slate-500">{timestamp}</span>
          </div>
          
          {data.errors_found && data.errors_found.length > 0 && (
            <div className="space-y-2 text-sm">
              <p className="text-red-400">❌ Errors Found:</p>
              {data.errors_found.map((error, i) => (
                <div key={i} className="text-slate-300 text-xs pl-4">
                  <p>File: {error.file} (line {error.line})</p>
                  <p className="text-slate-400">Error: {error.message}</p>
                </div>
              ))}
              <p className="text-yellow-400 mt-2">🔄 Applying fix...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Validation Message
const ValidationMessage = ({ data, timestamp }) => {
  return (
    <div className={`p-4 rounded border ${
      data.status === 'passed'
        ? 'bg-green-900/20 border-green-700'
        : 'bg-red-900/20 border-red-700'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">
          ✅ Validation Check: {data.check_type}
        </span>
        <span className="text-xs text-slate-500">{timestamp}</span>
      </div>
      
      <div className="space-y-1 text-sm">
        <p className={data.status === 'passed' ? 'text-green-400' : 'text-red-400'}>
          Status: {data.status.toUpperCase()} {data.status === 'passed' ? '✅' : '❌'}
        </p>
        {data.warnings && data.warnings.length > 0 && (
          <div>
            <p className="text-yellow-400">⚠️ Warnings:</p>
            <ul className="list-disc list-inside text-slate-400 text-xs pl-4">
              {data.warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// Error Message
const ErrorMessage = ({ data, timestamp }) => {
  return (
    <div className="bg-red-900/30 p-4 rounded border border-red-700">
      <div className="flex items-start gap-3">
        <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">❌ Error Occurred</span>
            <span className="text-xs text-slate-500">{timestamp}</span>
          </div>
          
          <div className="space-y-1 text-sm">
            <p className="text-red-300">Type: {data.error_type}</p>
            <p className="text-slate-300">{data.message}</p>
            {data.recoverable && (
              <p className="text-yellow-400 mt-2">
                This error is recoverable. Retrying in {data.retry_after}s...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Default Message (fallback)
const DefaultMessage = ({ message }) => {
  return (
    <div className="bg-slate-900 p-3 rounded border border-slate-700">
      <div className="text-xs text-slate-400">
        <Badge className="mb-2">{message.type}</Badge>
        <pre className="overflow-x-auto">
          {JSON.stringify(message.data, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default EnhancedAgentStream;
