import React, { useState, useEffect } from 'react';
import { agentAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Edit, 
  Layers, 
  FileCode,
  Sparkles,
  AlertCircle
} from 'lucide-react';

const ModuleManager = ({ projectId }) => {
  const [modules, setModules] = useState([]);
  const [showAddModule, setShowAddModule] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(false);

  // Add module form
  const [newModule, setNewModule] = useState({
    name: '',
    description: '',
    files: '',
    dependencies: ''
  });

  // Update module form
  const [updateDescription, setUpdateDescription] = useState('');

  useEffect(() => {
    loadModules();
  }, [projectId]);

  const loadModules = async () => {
    try {
      // TODO: Load modules from API
      // Mock data for now
      setModules([
        {
          id: '1',
          name: 'Authentication',
          description: 'User login and registration',
          files: ['auth_service.py', 'user_model.py'],
          status: 'completed'
        },
        {
          id: '2',
          name: 'Product Management',
          description: 'CRUD operations for products',
          files: ['product_service.py', 'product_model.py'],
          status: 'completed'
        }
      ]);
    } catch (error) {
      console.error('Failed to load modules:', error);
    }
  };

  const handleAddModule = async () => {
    if (!newModule.name || !newModule.description) {
      alert('Please fill in module name and description');
      return;
    }

    setLoading(true);
    try {
      // Use RAG to get relevant context
      const contextPrompt = `
I need to add a new module: ${newModule.name}
Description: ${newModule.description}
${newModule.files ? `Suggested files: ${newModule.files}` : ''}
${newModule.dependencies ? `Dependencies: ${newModule.dependencies}` : ''}

Please analyze the existing codebase and:
1. Identify related files that should be referenced
2. Generate only the NEW files needed for this module
3. Update ONLY the files that need imports or integration
4. Do NOT regenerate existing working code
`;

      // Start incremental generation task
      await agentAPI.start({
        project_id: projectId,
        task_title: `Add Module: ${newModule.name}`,
        task_description: contextPrompt
      });

      alert('✨ Module generation started! Check the chat for progress.');
      setShowAddModule(false);
      setNewModule({ name: '', description: '', files: '', dependencies: '' });
      
      // Reload modules
      setTimeout(loadModules, 2000);
    } catch (error) {
      console.error('Failed to add module:', error);
      alert('Failed to start module generation');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateModule = async (module) => {
    if (!updateDescription.trim()) {
      alert('Please describe what changes you want to make');
      return;
    }

    setLoading(true);
    try {
      // Use RAG to get context for ONLY this module
      const contextPrompt = `
I need to update the "${module.name}" module.
Current files: ${module.files.join(', ')}

Requested changes: ${updateDescription}

IMPORTANT CONSTRAINTS:
1. Use RAG to fetch context ONLY for files related to "${module.name}"
2. Update ONLY the files in this module: ${module.files.join(', ')}
3. If other files need updates (imports, references), identify them but minimize changes
4. Do NOT regenerate the entire project
5. Preserve all existing functionality in other modules
`;

      await agentAPI.start({
        project_id: projectId,
        task_title: `Update Module: ${module.name}`,
        task_description: contextPrompt
      });

      alert('✨ Module update started! Using RAG to fetch only relevant context.');
      setSelectedModule(null);
      setUpdateDescription('');
      
    } catch (error) {
      console.error('Failed to update module:', error);
      alert('Failed to start module update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-6 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900">Module Manager</h2>
            <Button
              onClick={() => setShowAddModule(!showAddModule)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          </div>
          <p className="text-gray-600">
            Add new modules or update existing ones without regenerating the entire project
          </p>
        </div>

        {/* Info Banner */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Incremental Updates with RAG</p>
                <p className="text-blue-800">
                  When you add or update a module, the system uses RAG (Retrieval-Augmented Generation) 
                  to fetch only the relevant context from your codebase. This ensures that:
                </p>
                <ul className="list-disc ml-5 mt-2 space-y-1 text-blue-800">
                  <li>Only necessary files are created or modified</li>
                  <li>Existing working code remains untouched</li>
                  <li>Changes are surgical and precise</li>
                  <li>No full project regeneration needed</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Module Form */}
        {showAddModule && (
          <Card className="mb-6 border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-900">Add New Module</CardTitle>
              <CardDescription>
                Describe your module and let AI generate only the necessary files
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="module-name">Module Name *</Label>
                <Input
                  id="module-name"
                  value={newModule.name}
                  onChange={(e) => setNewModule({ ...newModule, name: e.target.value })}
                  placeholder="e.g., Payment Processing"
                />
              </div>

              <div>
                <Label htmlFor="module-description">Description *</Label>
                <Textarea
                  id="module-description"
                  value={newModule.description}
                  onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                  placeholder="Describe what this module should do..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="module-files">Suggested Files (Optional)</Label>
                <Input
                  id="module-files"
                  value={newModule.files}
                  onChange={(e) => setNewModule({ ...newModule, files: e.target.value })}
                  placeholder="e.g., payment_service.py, stripe_integration.py"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Comma-separated list of files you expect to be created
                </p>
              </div>

              <div>
                <Label htmlFor="module-dependencies">Dependencies (Optional)</Label>
                <Input
                  id="module-dependencies"
                  value={newModule.dependencies}
                  onChange={(e) => setNewModule({ ...newModule, dependencies: e.target.value })}
                  placeholder="e.g., stripe, requests"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleAddModule}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {loading ? 'Generating...' : 'Generate Module'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddModule(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modules List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Existing Modules ({modules.length})
          </h3>

          {modules.map((module) => (
            <Card key={module.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileCode className="h-5 w-5 text-blue-600" />
                      {module.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {module.description}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedModule(module.id === selectedModule ? null : module.id)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Update
                  </Button>
                </div>
              </CardHeader>
              
              {selectedModule === module.id && (
                <CardContent className="border-t">
                  <div className="pt-4 space-y-4">
                    <div>
                      <Label>What changes do you want to make?</Label>
                      <Textarea
                        value={updateDescription}
                        onChange={(e) => setUpdateDescription(e.target.value)}
                        placeholder="e.g., Add email verification, Update validation logic, Add caching..."
                        rows={3}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        RAG will fetch context only from: {module.files.join(', ')}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleUpdateModule(module)}
                        disabled={loading || !updateDescription.trim()}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {loading ? 'Processing...' : 'Apply Changes'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedModule(null);
                          setUpdateDescription('');
                        }}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}

              <CardContent>
                <div className="text-sm">
                  <p className="text-gray-500 mb-2">Files in this module:</p>
                  <div className="flex flex-wrap gap-2">
                    {module.files.map((file, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono"
                      >
                        {file}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModuleManager;
