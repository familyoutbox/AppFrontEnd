import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { projectsAPI } from '@/services/api';

import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Settings, LogOut, Upload, Plus, Folder, Trash2, User, Clock, Cpu } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';




const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  // const [projects, setProjects] = useState([]);
  // const [loading, setLoading] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const handleDelete = (projectId) => {
    setPendingDeleteId(projectId);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setConfirmOpen(false);
    if (!pendingDeleteId) return;
    try {
      await projectsAPI.delete(pendingDeleteId);
      setProjects((prev) => prev.filter((p) => p.id !== pendingDeleteId));
      toast({ title: 'Project deleted', description: 'The project was deleted successfully.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete project.', variant: 'destructive' });
    } finally {
      setPendingDeleteId(null);
    }
  };
  // Redirect to login after logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.list();
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-white">
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => { setConfirmOpen(false); setPendingDeleteId(null); }}
      />
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">AppGenie</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right flex items-center gap-2">
              <div>
                <p className="text-sm text-gray-500">Welcome back,</p>
                <p className="text-gray-900 font-medium">{user?.name}</p>
              </div>
              <button
                className="ml-2 p-2 rounded-full hover:bg-gray-100"
                title="Settings"
                onClick={() => navigate('/settings')}
              >
                <Settings className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <Button variant="outline" onClick={handleLogout} data-testid="logout-button">
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Projects</h2>
            <p className="text-gray-600">Create and manage your AI-powered projects</p>
          </div>
          <div className="flex gap-3">
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/import')}
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Upload className="mr-2 h-5 w-5" /> Import Project
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/orchestrator')}
              className="border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              <Cpu className="mr-2 h-5 w-5" /> AI Orchestrator
            </Button>
            <Button
              size="lg"
              onClick={() => navigate('/wizard')}
              data-testid="new-project-button"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-5 w-5" /> New Project
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="text-center py-12">
              <Folder className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first AI-powered project</p>
              <Button onClick={() => navigate('/wizard')} data-testid="create-first-project-button" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" /> Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const requirements = project.requirements || {};
              const tech = requirements.tech_stack || {};
              const featureCount = (requirements.features || []).length;
              const moduleCount = (project.modules || []).length;
              const complexity = requirements.complexity || '—';
              const backend = tech.backend || 'backend';
              const frontend = tech.frontend || 'frontend';
              const database = tech.database || tech.db || 'database';
              const domain = requirements.business_domain || project.description || 'No domain specified';

              return (
              <Card
                key={project.id}
                className="bg-white border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all group cursor-pointer relative"
                onClick={() => navigate(`/project/${project.id}`)}
                data-testid={`project-card-${project.id}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Folder className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-gray-900 mt-4 flex justify-between items-center">
                    <span>{project.name}</span>
                    <button
                      className="ml-2 p-1 rounded hover:bg-red-50 text-red-600 opacity-0 group-hover:opacity-100 transition"
                      title="Delete Project"
                      onClick={e => { e.stopPropagation(); handleDelete(project.id); }}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {domain}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-purple-600" />
                      <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100">{backend}</Badge>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">{frontend}</Badge>
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">{database}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-4 w-4" />
                      <span>Owner: {project.owner_id || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Created {formatDate(project.created_at)} • Updated {formatDate(project.updated_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
