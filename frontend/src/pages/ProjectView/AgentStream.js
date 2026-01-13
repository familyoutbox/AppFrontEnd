import React, { useState } from 'react';
import { agentAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, CheckCircle, XCircle, Clock, Loader2, Brain, ListChecks } from 'lucide-react';

const AgentStream = ({ projectId, tasks, wsEvents, onTasksUpdate }) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const startNewTask = async () => {
    if (!taskTitle || !taskDescription) return;

    setLoading(true);
    try {
      await agentAPI.start({
        project_id: projectId,
        task_title: taskTitle,
        task_description: taskDescription,
      });
      setTaskTitle('');
      setTaskDescription('');
      onTasksUpdate();
    } catch (error) {
      console.error('Failed to start task:', error);
      alert('Failed to start task');
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Task Creation */}
      <div className="lg:col-span-1">
        <Card className="bg-slate-800/50 border-slate-700" data-testid="new-task-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Play className="h-5 w-5 text-purple-500" />
              Start New Task
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="taskTitle" className="text-slate-300">Task Title</Label>
              <Input
                id="taskTitle"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g., Add user authentication"
                className="bg-slate-900 border-slate-700 text-white"
                data-testid="task-title-input"
              />
            </div>
            <div>
              <Label htmlFor="taskDescription" className="text-slate-300">Description</Label>
              <Textarea
                id="taskDescription"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Describe what you want the AI agent to do..."
                rows={6}
                className="bg-slate-900 border-slate-700 text-white"
                data-testid="task-description-input"
              />
            </div>
            <Button
              onClick={startNewTask}
              disabled={!taskTitle || !taskDescription || loading}
              className="w-full"
              data-testid="start-task-button"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...</>
              ) : (
                <><Play className="mr-2 h-4 w-4" /> Start Agent</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Live Events */}
        <Card className="bg-slate-800/50 border-slate-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Live Events ({wsEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {wsEvents.length === 0 ? (
                  <p className="text-slate-500 text-sm">No events yet. Start a task to see live updates.</p>
                ) : (
                  wsEvents.slice().reverse().map((event, i) => (
                    <div key={i} className="p-2 bg-slate-900 rounded border border-slate-700 text-xs">
                      <Badge className="mb-1">{event.type}</Badge>
                      <p className="text-slate-400">{JSON.stringify(event.data).slice(0, 100)}...</p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right: Task List & Progress */}
      <div className="lg:col-span-2">
        <Card className="bg-slate-800/50 border-slate-700" data-testid="tasks-list-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-purple-500" />
              Tasks & Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <ListChecks className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No tasks yet. Create your first task to get started.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {tasks.map((task) => (
                    <Card key={task.id} className="bg-slate-900 border-slate-700" data-testid={`task-${task.id}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-white text-lg">{task.title}</CardTitle>
                            <p className="text-slate-400 text-sm mt-1">{task.description}</p>
                          </div>
                          <Badge className={task.status === 'completed' ? 'bg-green-500' : task.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'}>
                            {task.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Progress Bar */}
                        {task.steps && task.steps.length > 0 && (
                          <div className="mb-4">
                            <div className="flex justify-between text-sm text-slate-400 mb-2">
                              <span>Progress</span>
                              <span>
                                {task.steps.filter(s => s.status === 'completed').length} / {task.steps.length} steps
                              </span>
                            </div>
                            <Progress
                              value={(task.steps.filter(s => s.status === 'completed').length / task.steps.length) * 100}
                              className="h-2"
                            />
                          </div>
                        )}

                        {/* Steps */}
                        <div className="space-y-3">
                          {task.steps && task.steps.map((step, i) => (
                            <div key={i} className="flex gap-3 p-3 bg-slate-800 rounded border border-slate-700" data-testid={`step-${i}`}>
                              <div className="flex-shrink-0 mt-1">
                                {getStepIcon(step.status)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-white">Step {step.step_number}</span>
                                  <Badge variant="outline" className="text-xs">{step.type}</Badge>
                                  {step.tool && <Badge variant="secondary" className="text-xs">{step.tool}</Badge>}
                                </div>
                                <p className="text-sm text-slate-300 mb-2">
                                  <strong>Reasoning:</strong> {step.reasoning}
                                </p>
                                <p className="text-xs text-slate-400">
                                  <strong>Input:</strong> {step.input_summary}
                                </p>
                                {step.output_summary && (
                                  <p className="text-xs text-slate-400 mt-1">
                                    <strong>Output:</strong> {step.output_summary}
                                  </p>
                                )}
                                {step.affected_files && step.affected_files.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {step.affected_files.map((file, j) => (
                                      <Badge key={j} variant="outline" className="text-xs">{file}</Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentStream;
