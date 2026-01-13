import React, { useState } from 'react';
import { Sparkles, Code, FileText, AlertCircle } from 'lucide-react';

const MessageBubble = ({ event }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);

  const renderEventContent = () => {
    // Compute a content fallback so messages that don't follow the expected
    // shape still show a readable preview.
    const contentFallback = event.data?.message || event.data?.output || event.data?.text || (event.data && typeof event.data === 'string' ? event.data : (event.data ? JSON.stringify(event.data) : ''));

    // Truncation for long fallback content with a toggle
    const FALLBACK_MAX = 400;
    const isLongFallback = contentFallback && contentFallback.length > FALLBACK_MAX;
    const fallbackPreview = isLongFallback && !expanded ? `${contentFallback.slice(0, FALLBACK_MAX)}…` : contentFallback;

    const summarizeObject = (obj) => {
      if (obj === null) return 'null';
      if (typeof obj !== 'object') return String(obj);
      if (Array.isArray(obj)) return `${obj.length} items`;
      const entries = Object.entries(obj || {}).slice(0, 4).map(([k, v]) => {
        if (v === null) return `${k}: null`;
        if (typeof v === 'object') {
          if (Array.isArray(v)) return `${k}: ${v.length} items`;
          return `${k}: {…}`;
        }
        const sval = String(v);
        return `${k}: ${sval.length > 60 ? sval.slice(0, 57) + '…' : sval}`;
      });
      return entries.join('; ') + (Object.keys(obj || {}).length > 4 ? ' …' : '');
    };

    const renderFallback = (text, className = 'text-sm text-slate-200') => {
      if (!text) return null;
      // If text looks like JSON, try to parse and summarize it instead of showing raw JSON
      let display = text;
      if (typeof text === 'string' && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
        try {
          const parsed = JSON.parse(text);
          display = summarizeObject(parsed);
        } catch (e) {
          // not valid JSON, leave as-is
        }
      }
      // If contentFallback is long, use the truncated preview logic
      const long = display && display.length > FALLBACK_MAX;
      const preview = long && !expanded ? `${display.slice(0, FALLBACK_MAX)}…` : display;

      return (
        <div className={`mt-1 break-words ${className}`}>
          <div>{long ? preview : display}</div>
          {long ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-xs text-indigo-300 hover:text-indigo-100"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          ) : null}
        </div>
      );
    };

    // Produce a concise human-friendly summary for common event shapes
    const formatHumanMessage = (evt) => {
      if (!evt || !evt.type) return null;
      const d = evt.data || {};
      try {
        switch (evt.type) {
          case 'task_progress': {
            const title = d.title || (d.task_id ? `Task ${d.task_id.slice(0,8)}` : 'Task');
            const pct = d.progress_percentage ?? d.progress ?? null;
            if (Array.isArray(d.steps) && d.steps.length > 0) {
              // find running or next pending
              const current = d.steps.findIndex(s => s.status === 'in_progress' || s.status === 'running');
              const curIdx = current >= 0 ? current : (d.current_step ?? d.current ?? 0);
              const step = d.steps[curIdx] || d.steps[0];
              const stepLabel = step ? (step.label || step.name || `Step ${curIdx+1}`) : '';
              return `${title} — ${d.status || 'in progress'}${pct ? ` (${pct}%)` : ''}. Now: ${stepLabel} (${step.status || 'pending'})`;
            }
            if (d.status === 'completed') return `${title} completed${pct ? ` (${pct}%)` : ''}.`;
            return `${title} is ${d.status || 'in progress'}${pct ? ` — ${pct}%` : ''}`;
          }

          case 'agent_log': {
            if (d.message) return `${d.role ? d.role + ':' : 'Agent'} ${d.message}`;
            if (d.task && d.task.task_id) return `Agent ${d.role || d.agent_id} updated task ${d.task.task_id}`;
            return d.role ? `Agent ${d.role} logged an update` : `Agent update`;
          }

          case 'orchestrator_log': {
            if (d.message) return `Orchestrator: ${d.message}`;
            return 'Orchestrator update';
          }

          case 'code_generated': {
            if (d.message) return d.message;
            if (d.file_count) return `Generated ${d.file_count} files`;
            return 'Code generation completed';
          }

          case 'progress': {
            if (d.message) return d.message + (d.progress ? ` (${d.progress}%)` : '');
            if (d.progress) return `Progress: ${d.progress}%`;
            return null;
          }

          case 'file_changed': {
            if (d.file_path) return `${d.operation || 'Updated'} ${d.file_path}`;
            return 'File changed';
          }

          case 'user_message': {
            return d.message || null;
          }

          default:
            return null;
        }
      } catch (e) {
        return null;
      }
    };

    switch (event.type) {
      case 'agent_step':
        // Skip rendering if no meaningful content; fall back to a brief preview when available
        if (!event.data.step_type && !event.data.reasoning && !event.data.output_summary) {
          if (contentFallback) {
            return renderFallback(contentFallback);
          }
          return null;
        }
        return (
          <div className="space-y-2">
            {event.data.step_type && (
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-400" />
                <span className="font-semibold text-slate-50">
                  {event.data.step_type}
                </span>
              </div>
            )}
            {event.data.reasoning && (
              <p className="text-slate-200 leading-relaxed">{event.data.reasoning}</p>
            )}
            {event.data.output_summary && (
              <div className="bg-purple-900/50 border border-purple-700/50 rounded-lg p-3 mt-1">
                <p className="text-sm text-slate-200">{event.data.output_summary}</p>
              </div>
            )}
          </div>
        );

      case 'task_progress':
        // Support multiple payload shapes: progress, progress_percentage, current_step, steps array
        if (!event.data) {
          if (contentFallback) return renderFallback(contentFallback, 'text-sm text-slate-200 font-medium');
          return null;
        }

        // Handle alternative numeric progress fields
        const pct = event.data.progress_percentage ?? event.data.progress ?? null;
        const curStep = event.data.current_step ?? event.data.current ?? null;
        const totalSteps = event.data.total_steps ?? event.data.total ?? null;

        // If there is a steps array, render it
        if (Array.isArray(event.data.steps) && event.data.steps.length > 0) {
          const human = formatHumanMessage(event);
          return (
            <div className="space-y-3">
              {human && <div className="text-sm text-slate-200 font-medium">{human}</div>}
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span className="font-semibold text-slate-100">{event.data.title || 'Working Progress'}</span>
                <span className="font-mono text-orange-300">{pct ? `${pct}%` : (event.data.status || '')}</span>
              </div>
              <div className="space-y-2">
                {event.data.steps.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-slate-300">
                    <span className={`font-medium ${s.status === 'completed' ? 'text-emerald-300' : s.status === 'failed' ? 'text-red-300' : 'text-slate-300'}`}>{s.label || s.name || `Step ${i+1}`}</span>
                    <span className="text-xs">{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // If task failed, surface the error loudly
        if (event.data.status === 'failed' || event.data.error) {
          return (
            <div className="space-y-2 text-red-100">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Task failed</span>
                {event.data.task_id && (
                  <span className="text-xs text-red-200">{event.data.task_id}</span>
                )}
              </div>
              {event.data.error && (
                <div className="bg-red-950/50 border border-red-800/70 rounded-lg p-3 text-sm leading-relaxed">
                  {event.data.error}
                </div>
              )}
            </div>
          );
        }
        // Otherwise show a human-friendly single-line summary when available
        const humanSummary = formatHumanMessage(event);
        if (humanSummary) {
          return (<div className="text-sm text-slate-200">{humanSummary}</div>);
        }
        // If progress is missing or zero, just show the title line
        if ((!pct || pct === 0) && !event.data.title) {
          return (
            <div className="text-sm text-slate-200 font-medium flex items-center gap-2">
              <span className="text-lg"></span>
              {event.data.title || 'Working...'}
            </div>
          );
        }
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span className="font-semibold text-slate-100">
                {event.data.title || 'Working Progress'}
              </span>
              <span className="font-mono text-orange-300">{pct ? `${pct}%` : ''}</span>
            </div>
            <div className="w-full bg-purple-800/40 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-400 via-pink-500 to-rose-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${pct || 0}%` }}
              />
            </div>
          </div>
        );

      case 'file_changed':
        // Ignore noisy raw_output.txt bookkeeping
        if (event.data?.file_path && event.data.file_path.toLowerCase().includes('raw_output.txt')) {
          return null;
        }
        return (
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-orange-400 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-100">
                {event.data.operation || 'Modified'} file
              </p>
              <p className="text-sm text-slate-300 mt-1 font-mono">
                {event.data.file_path}
              </p>
            </div>
          </div>
        );

      case 'diff_generated':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-pink-400" />
              <span className="font-semibold text-slate-100">Code Changes</span>
            </div>
            {event.data.diff && (
              <pre className="bg-purple-900/60 text-slate-50 rounded-lg p-4 overflow-x-auto text-sm border border-purple-700/50">
                <code>{event.data.diff}</code>
              </pre>
            )}
          </div>
        );

      case 'error':
        return (
          <div className="flex items-start gap-3 bg-red-950/40 p-4 rounded-xl border border-red-800/60">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <p className="font-semibold text-red-100">Error</p>
              <p className="text-sm text-red-200 mt-1">
                {event.data.message || 'An error occurred'}
              </p>
            </div>
          </div>
        );

      case 'ui_preview_refresh':
        return (
          <div className="bg-purple-900/40 border border-purple-600/50 rounded-xl p-4 text-purple-50">
            <p className="text-sm">
              UI preview updated. Check the Canvas tab to see changes.
            </p>
          </div>
        );

      case 'agent_thinking':
        return (
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-xl animate-pulse">🤔</span>
              <div className="flex-1">
                <p className="text-slate-100 leading-relaxed">
                  {event.data?.thought || 'Thinking...'}
                </p>
                <div className="mt-2 flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                  <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse delay-150" />
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse delay-300" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'llm_response':
        // Display raw LLM response in chat
        return (
          <div className="space-y-2">
            {event.data?.model && (
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-slate-400">
                  {event.data.model}
                </span>
              </div>
            )}
            
            {event.data?.prompt_preview && (
              <details className="bg-slate-900/60 border border-slate-700/50 rounded-lg mb-2">
                <summary className="px-3 py-2 cursor-pointer text-xs font-semibold text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 rounded-lg">
                  View Prompt
                </summary>
                <div className="p-3 pt-2">
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                    {event.data.prompt_preview}
                  </pre>
                </div>
              </details>
            )}
            
            <div className="text-sm text-slate-200 leading-relaxed">
              {event.data?.message || 'No response'}
            </div>
          </div>
        );

      case 'agent_message':
        // Display generated code when message_type is 'code_display'
        if (event.data?.message_type === 'code_display' && event.data?.generated_files) {
          const files = event.data.generated_files || [];
          const selectedFile = files[selectedFileIdx] || null;
          const llmReasoning = event.data.llm_reasoning || '';
          const llmRawResponse = event.data.llm_raw_response || '';

          return (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Code className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold text-slate-100">
                  {event.data.message || 'Generated Code'}
                </span>
              </div>

              {/* LLM Reasoning Section */}
              {llmReasoning && (
                <div className="bg-indigo-900/40 border border-indigo-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-semibold text-indigo-200">AI Reasoning</span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {llmReasoning}
                  </p>
                </div>
              )}

              {/* Raw LLM Response (collapsible) */}
              {llmRawResponse && (
                <details className="bg-slate-900/60 border border-slate-700/50 rounded-lg">
                  <summary className="px-4 py-2 cursor-pointer text-xs font-semibold text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 rounded-lg">
                    View Raw LLM Response
                  </summary>
                  <div className="p-4 pt-2">
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                      {llmRawResponse}
                    </pre>
                  </div>
                </details>
              )}

              {/* Generated Files */}
              {files.length > 0 && (
                <div className="bg-slate-900/80 border border-purple-700/50 rounded-lg overflow-hidden">
                  {/* File tabs */}
                  <div className="flex overflow-x-auto bg-slate-950/50 border-b border-purple-700/50">
                    {files.map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedFileIdx(idx)}
                        className={`px-4 py-2 text-xs font-mono whitespace-nowrap border-b-2 transition-colors ${
                          idx === selectedFileIdx
                            ? 'border-emerald-400 bg-slate-900/60 text-emerald-300'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                        }`}
                      >
                        {file.path}
                      </button>
                    ))}
                  </div>

                  {/* Code content */}
                  {selectedFile && (
                    <div className="relative">
                      <div className="absolute top-2 right-2 flex gap-2 z-10">
                        <span className="px-2 py-1 text-xs bg-purple-900/80 text-purple-200 rounded border border-purple-700/50">
                          {selectedFile.language || 'text'}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedFile.content);
                          }}
                          className="px-2 py-1 text-xs bg-slate-800 text-slate-200 rounded hover:bg-slate-700 border border-slate-600"
                        >
                          Copy
                        </button>
                      </div>
                      <pre className="p-4 pt-12 overflow-x-auto text-xs text-slate-200 font-mono max-h-96">
                        <code>{selectedFile.content}</code>
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }
        
        // For other agent_message types, display as regular message
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-400" />
              <span className="font-semibold text-slate-100">Agent Message</span>
            </div>
            <p className="text-sm text-slate-200">
              {event.data?.message || contentFallback || 'Agent sent a message'}
            </p>
          </div>
        );

      case 'user_message':
        // Show the user's prompt as a simple outgoing bubble; fall back to preview if missing
        if (!event.data || !event.data.message) {
          if (contentFallback) {
            return (
              <div className="text-right">
                <div className="inline-block bg-gradient-to-r from-orange-500 to-pink-600 text-white px-3 py-2 rounded-lg text-sm shadow-lg shadow-orange-900/50 border border-orange-400/40">
                  {renderFallback(contentFallback, '')}
                </div>
              </div>
            );
          }
          return null;
        }
        return (
          <div className="text-right">
            <span className="inline-block bg-gradient-to-r from-orange-500 to-pink-600 text-white px-3 py-2 rounded-lg text-sm shadow-lg shadow-orange-900/50 border border-orange-400/40">
              {event.data.message}
            </span>
          </div>
        );

      case 'step_start':
        return (
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-xl">🚀</span>
              <div>
                <p className="text-slate-100 font-semibold">
                  {event.data.step_title || 'Starting...'}
                </p>
                {event.data.description && (
                  <p className="text-sm text-slate-300 mt-1">
                    {event.data.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 'step_complete':
        return (
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-xl">✅</span>
              <div>
                <p className="text-slate-100 font-semibold">
                  {event.data.step_title || 'Complete'}
                </p>
                {event.data.summary && (
                  <p className="text-sm text-slate-300 mt-1">
                    {event.data.summary}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 'progress':
        // Skip rendering if no message or progress; show fallback preview when present
        if (!event.data.message && !event.data.progress) {
          if (contentFallback) {
            return renderFallback(contentFallback);
          }
          return null;
        }
        return (
          <div className="space-y-3">
            {event.data.message && (
              <div className="flex items-center gap-2 text-slate-100">
                <span className="text-lg">⏳</span>
                <p className="leading-relaxed">{event.data.message}</p>
              </div>
            )}
            {event.data.progress && (
              <>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>{event.data.details || ''}</span>
                  <span className="font-mono text-orange-300">{event.data.progress}%</span>
                </div>
                <div className="w-full bg-purple-800/40 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-400 via-pink-500 to-rose-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${event.data.progress}%` }}
                  />
                </div>
              </>
            )}
          </div>
        );

      case 'code_generated':
        // Skip noise from raw_output bookkeeping
        if (event.data?.message && event.data.message.toLowerCase().includes('raw_output.txt')) {
          return null;
        }
        const human = formatHumanMessage(event);
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-emerald-400" />
              <span className="font-semibold text-slate-100">Code Generated</span>
            </div>
            <p className="text-sm text-slate-200">{human || event.data.message || `Generated ${event.data.file_count || 0} files`}</p>
          </div>
        );

      case 'agent_log': {
        const d = event.data || {};
        const human = formatHumanMessage(event) || d.message;
        const level = (d.level || 'info').toLowerCase();
        const color = level === 'error' ? 'text-red-400' : level === 'warning' ? 'text-amber-300' : 'text-emerald-300';
        return (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-zinc-900/30 flex items-center justify-center text-xs font-medium text-slate-100">
              {d.role ? d.role.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className={`text-xs font-semibold ${color}`}>{level.toUpperCase()}</span>
                <span className="text-xs text-slate-400">{d.role || d.agent_id}</span>
              </div>
              <div className="mt-1 text-sm text-slate-200">{human}</div>
              {d.task && Object.keys(d.task || {}).length > 0 && (
                <div className="mt-2 text-xs text-slate-400">{summarizeObject(d.task)}</div>
              )}
            </div>
          </div>
        );
      }

      case 'orchestrator_log': {
        const d = event.data || {};
        const human = formatHumanMessage(event) || d.message;
        const level = (d.level || 'info').toLowerCase();
        const color = level === 'error' ? 'text-red-400' : level === 'warning' ? 'text-amber-300' : 'text-indigo-300';
        return (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-zinc-900/20 flex items-center justify-center text-xs font-medium text-slate-100">OR</div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className={`text-xs font-semibold ${color}`}>{level.toUpperCase()}</span>
                <span className="text-xs text-slate-400">{d.orchestrator_id || ''}</span>
              </div>
              <div className="mt-1 text-sm text-slate-200">{human}</div>
              {d.meta && Object.keys(d.meta).length > 0 && (
                <div className="mt-2 text-xs text-slate-400">{summarizeObject(d.meta)}</div>
              )}
            </div>
          </div>
        );
      }

      default:
        // Don't render unknown message types with no data
        if (!event.data || Object.keys(event.data).length === 0) {
          return null;
        }
        // Suppress plain search-status JSON noise
        if (event.data.query && event.data.status) {
          return null;
        }
        // Show a summarized, human-friendly preview of the data (no raw JSON)
        return (
          <div className="text-slate-200">{summarizeObject(event.data)}</div>
        );
    }
  };

  const content = renderEventContent();
  
  // Don't render anything if content is null (empty message)
  if (content === null) {
    return null;
  }

  // Return content directly without extra wrapper card
  return content;
};

export default MessageBubble;
