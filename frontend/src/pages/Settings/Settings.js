import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Key, Bell, Palette, Save, Loader2, CheckCircle2, Server } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [llmLoading, setLlmLoading] = useState(true);
  const [checkingModel, setCheckingModel] = useState(false);
  const [modelStatus, setModelStatus] = useState(null);

  // Profile settings
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: '',
  });

  // LLM Configuration
  const [llmConfig, setLlmConfig] = useState({
    model_name: 'codellama:latest',
    endpoint_url: 'http://localhost:11434/api/generate',
    temperature: 0.7,
    max_tokens: 4000,
  });

  // Preferences
  const [preferences, setPreferences] = useState({
    autoGenerate: true,
    darkMode: false,
    notifications: true,
    emailUpdates: false,
  });

  // Theme settings
  const [theme, setTheme] = useState({
    primaryColor: '#2563EB',
    accentColor: '#8B5CF6',
  });

  // Load LLM config on mount
  useEffect(() => {
    loadLLMConfig();
  }, []);

  const loadLLMConfig = async () => {
    try {
      const response = await axios.get(`${API}/ai-assistant/llm-config`);
      setLlmConfig(response.data);
    } catch (error) {
      console.error('Failed to load LLM config:', error);
    } finally {
      setLlmLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLLMConfig = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/ai-assistant/llm-config`, llmConfig);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save LLM config:', error);
      alert('Failed to save LLM configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckModel = async () => {
    setCheckingModel(true);
    try {
      const response = await axios.post(
        `${API}/ai-assistant/check-model`,
        {
          endpoint_url: llmConfig.endpoint_url,
          model_name: llmConfig.model_name,
        }
      );
      setModelStatus(response.data);
    } catch (error) {
      setModelStatus({
        available: false,
        message: error.response?.data?.message || error.message,
      });
    } finally {
      setCheckingModel(false);
    }
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/projects')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-600">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {saved && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              ✓ Settings saved successfully!
            </div>
          )}

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-gray-100">
              <TabsTrigger value="profile" className="data-[state=active]:bg-white">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="api-keys" className="data-[state=active]:bg-white">
                <Key className="h-4 w-4 mr-2" />
                LLM Config
              </TabsTrigger>
              <TabsTrigger value="preferences" className="data-[state=active]:bg-white">
                <Bell className="h-4 w-4 mr-2" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="theme" className="data-[state=active]:bg-white">
                <Palette className="h-4 w-4 mr-2" />
                Theme
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={4}
                    />
                  </div>

                  <Button 
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* LLM Configuration Tab */}
            <TabsContent value="api-keys">
              {llmLoading ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin mb-4" />
                    <p className="text-gray-600">Loading LLM configuration...</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Key className="w-5 h-5 text-blue-600" />
                        </div>
                        LLM Configuration
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Configure your local Ollama model settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label htmlFor="model-name" className="text-gray-700 font-semibold mb-2 block">
                          Model Name
                        </Label>
                        <Input
                          id="model-name"
                          placeholder="codellama:latest"
                          value={llmConfig.model_name}
                          onChange={(e) => setLlmConfig({ ...llmConfig, model_name: e.target.value })}
                          className="border-gray-300 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Examples: codellama:7b, deepseek-coder:6.7b, llama3:8b
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="endpoint" className="text-gray-700 font-semibold mb-2 block">
                          Endpoint URL
                        </Label>
                        <Input
                          id="endpoint"
                          placeholder="http://localhost:11434/api/generate"
                          value={llmConfig.endpoint_url}
                          onChange={(e) => setLlmConfig({ ...llmConfig, endpoint_url: e.target.value })}
                          className="border-gray-300 focus:border-blue-500 font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Default Ollama endpoint: http://localhost:11434/api/generate
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="temperature" className="text-gray-700 font-semibold mb-2 block">
                            Temperature
                          </Label>
                          <Input
                            id="temperature"
                            type="number"
                            step="0.1"
                            min="0"
                            max="2"
                            value={llmConfig.temperature}
                            onChange={(e) =>
                              setLlmConfig({ ...llmConfig, temperature: parseFloat(e.target.value) })
                            }
                            className="border-gray-300 focus:border-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-2">Controls randomness (0-2)</p>
                        </div>

                        <div>
                          <Label htmlFor="max-tokens" className="text-gray-700 font-semibold mb-2 block">
                            Max Tokens
                          </Label>
                          <Input
                            id="max-tokens"
                            type="number"
                            value={llmConfig.max_tokens}
                            onChange={(e) =>
                              setLlmConfig({ ...llmConfig, max_tokens: parseInt(e.target.value) })
                            }
                            className="border-gray-300 focus:border-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-2">Maximum response length</p>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={handleSaveLLMConfig}
                          disabled={loading}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Configuration
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={handleCheckModel}
                          disabled={checkingModel}
                          className="flex-1 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 font-semibold"
                        >
                          {checkingModel ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Checking...
                            </>
                          ) : (
                            <>
                              <Server className="w-4 h-4 mr-2" />
                              Check Model
                            </>
                          )}
                        </Button>
                      </div>

                      {modelStatus && (
                        <div
                          className={`p-5 rounded-lg border-2 ${
                            modelStatus.available
                              ? 'bg-green-50 border-green-300'
                              : 'bg-red-50 border-red-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            {modelStatus.available ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <Server className="w-5 h-5 text-red-600" />
                            )}
                            <span
                              className={`font-semibold ${
                                modelStatus.available ? 'text-green-900' : 'text-red-900'
                              }`}
                            >
                              {modelStatus.message}
                            </span>
                          </div>
                          {modelStatus.models && modelStatus.models.length > 0 && (
                            <div>
                              <p className="text-sm text-gray-700 font-medium mb-2">
                                Available models:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {modelStatus.models.map((model, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-xs bg-white text-gray-700 border-gray-300"
                                  >
                                    {model}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
                    <CardHeader className="border-b border-blue-200">
                      <CardTitle className="text-gray-900 flex items-center gap-2">
                        <span className="text-2xl">📚</span>
                        Quick Setup Guide
                      </CardTitle>
                      <CardDescription className="text-gray-700">
                        Get started with Ollama in minutes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-6">
                      <div className="bg-white p-5 rounded-lg border border-blue-200 shadow-sm">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                            1
                          </span>
                          Install Ollama
                        </h4>
                        <code className="block bg-slate-900 text-green-400 p-3 rounded text-sm font-mono">
                          curl -fsSL https://ollama.com/install.sh | sh
                        </code>
                      </div>

                      <div className="bg-white p-5 rounded-lg border border-blue-200 shadow-sm">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                            2
                          </span>
                          Pull a Code Model
                        </h4>
                        <code className="block bg-slate-900 text-green-400 p-3 rounded text-sm font-mono">
                          ollama pull codellama
                        </code>
                      </div>

                      <div className="bg-white p-5 rounded-lg border border-blue-200 shadow-sm">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                            3
                          </span>
                          Verify Ollama is Running
                        </h4>
                        <code className="block bg-slate-900 text-green-400 p-3 rounded text-sm font-mono">
                          ollama list
                        </code>
                      </div>

                      <div className="bg-blue-100 border border-blue-300 p-4 rounded-lg">
                        <p className="text-sm text-gray-800">
                          <strong>💡 Pro Tip:</strong> For faster generation, use{' '}
                          <code className="bg-white px-2 py-1 rounded text-blue-600 font-mono text-xs">
                            codellama:7b
                          </code>{' '}
                          model with Max Tokens set to 2000-4000
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>Customize your experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-generate code after wizard</Label>
                      <p className="text-sm text-gray-500">Automatically start code generation</p>
                    </div>
                    <Switch
                      checked={preferences.autoGenerate}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, autoGenerate: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Dark Mode</Label>
                      <p className="text-sm text-gray-500">Use dark theme (coming soon)</p>
                    </div>
                    <Switch
                      checked={preferences.darkMode}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, darkMode: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>In-app Notifications</Label>
                      <p className="text-sm text-gray-500">Show notifications for updates</p>
                    </div>
                    <Switch
                      checked={preferences.notifications}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, notifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Updates</Label>
                      <p className="text-sm text-gray-500">Receive email notifications</p>
                    </div>
                    <Switch
                      checked={preferences.emailUpdates}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, emailUpdates: checked })
                      }
                    />
                  </div>

                  <Button 
                    onClick={handleSavePreferences}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Theme Tab */}
            <TabsContent value="theme">
              <Card>
                <CardHeader>
                  <CardTitle>Theme Settings</CardTitle>
                  <CardDescription>Customize colors (coming soon)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="primary-color"
                        type="color"
                        value={theme.primaryColor}
                        onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        value={theme.primaryColor}
                        onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                        placeholder="#2563EB"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="accent-color">Accent Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="accent-color"
                        type="color"
                        value={theme.accentColor}
                        onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        value={theme.accentColor}
                        onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                        placeholder="#8B5CF6"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
                    <div className="flex gap-2">
                      <Button style={{ backgroundColor: theme.primaryColor }}>
                        Primary Button
                      </Button>
                      <Button variant="outline" style={{ borderColor: theme.accentColor, color: theme.accentColor }}>
                        Accent Button
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500">
                    Theme customization is coming soon. Stay tuned!
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings;
