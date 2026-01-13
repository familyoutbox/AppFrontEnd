import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Cpu, CheckCircle2, Loader2, Server, Save } from "lucide-react";
import Navigation from "@/components/Navigation";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LLMConfigPage = ({ user, onLogout }) => {
  const [config, setConfig] = useState({
    model_name: "codellama:latest",
    endpoint_url: "http://localhost:11434/api/generate",
    temperature: 0.7,
    max_tokens: 4000,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingModel, setCheckingModel] = useState(false);
  const [modelStatus, setModelStatus] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API}/llm-config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfig(response.data);
    } catch (error) {
      toast.error("Failed to load LLM configuration");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API}/llm-config`, config, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("LLM configuration saved successfully!");
    } catch (error) {
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const checkModel = async () => {
    setCheckingModel(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API}/check-model`,
        {
          endpoint_url: config.endpoint_url,
          model_name: config.model_name,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setModelStatus(response.data);

      if (response.data.available) {
        toast.success("Model is available and ready!");
      } else {
        toast.error(response.data.message || "Model not available");
      }
    } catch (error) {
      setModelStatus({ available: false, message: error.message });
      toast.error("Failed to check model availability");
    } finally {
      setCheckingModel(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation user={user} onLogout={onLogout} currentPage="llm-config" />

      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
            LLM Configuration
          </h1>
          <p className="text-lg text-gray-600">Configure your local AI model settings</p>
        </div>

        {loading ? (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="py-16 text-center">
              <Loader2 className="w-12 h-12 mx-auto text-blue-600 spin mb-4" />
              <p className="text-gray-600">Loading configuration...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Configuration Form */}
            <Card className="bg-white border-gray-200 shadow-sm" data-testid="llm-config-card">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-gray-900 text-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-blue-600" />
                  </div>
                  Model Settings
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Configure your local LLM endpoint and parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <Label htmlFor="model-name" className="text-gray-700 font-semibold mb-2 block">Model Name</Label>
                  <Input
                    id="model-name"
                    data-testid="model-name-input"
                    placeholder="codellama:latest"
                    value={config.model_name}
                    onChange={(e) => setConfig({ ...config, model_name: e.target.value })}
                    className="border-gray-300 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Examples: codellama:7b, deepseek-coder:6.7b, llama3:8b
                  </p>
                </div>

                <div>
                  <Label htmlFor="endpoint" className="text-gray-700 font-semibold mb-2 block">Endpoint URL</Label>
                  <Input
                    id="endpoint"
                    data-testid="endpoint-url-input"
                    placeholder="http://localhost:11434/api/generate"
                    value={config.endpoint_url}
                    onChange={(e) => setConfig({ ...config, endpoint_url: e.target.value })}
                    className="border-gray-300 focus:border-blue-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Default Ollama endpoint: http://localhost:11434/api/generate
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="temperature" className="text-gray-700 font-semibold mb-2 block">Temperature</Label>
                    <Input
                      id="temperature"
                      data-testid="temperature-input"
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={config.temperature}
                      onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                      className="border-gray-300 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Controls randomness (0-2)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="max-tokens" className="text-gray-700 font-semibold mb-2 block">Max Tokens</Label>
                    <Input
                      id="max-tokens"
                      data-testid="max-tokens-input"
                      type="number"
                      value={config.max_tokens}
                      onChange={(e) => setConfig({ ...config, max_tokens: parseInt(e.target.value) })}
                      className="border-gray-300 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Maximum response length
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    data-testid="save-config-btn"
                    onClick={saveConfig}
                    disabled={saving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 spin" />
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
                    data-testid="check-model-btn"
                    onClick={checkModel}
                    disabled={checkingModel}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 font-semibold"
                  >
                    {checkingModel ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Cpu className="w-4 h-4 mr-2" />
                        Check Model
                      </>
                    )}
                  </Button>
                </div>

                {modelStatus && (
                  <div
                    className={`p-5 rounded-lg border-2 ${
                      modelStatus.available
                        ? "bg-green-50 border-green-300"
                        : "bg-red-50 border-red-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {modelStatus.available ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Server className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`font-semibold ${modelStatus.available ? 'text-green-900' : 'text-red-900'}`}>
                        {modelStatus.message}
                      </span>
                    </div>
                    {modelStatus.models && modelStatus.models.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-700 font-medium mb-2">Available models:</p>
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

            {/* Setup Guide */}
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
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
                    Install Ollama
                  </h4>
                  <code className="block bg-slate-900 text-green-400 p-3 rounded text-sm font-mono">
                    curl -fsSL https://ollama.com/install.sh | sh
                  </code>
                </div>

                <div className="bg-white p-5 rounded-lg border border-blue-200 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
                    Pull a Code Model
                  </h4>
                  <code className="block bg-slate-900 text-green-400 p-3 rounded text-sm font-mono">
                    ollama pull codellama
                  </code>
                </div>

                <div className="bg-white p-5 rounded-lg border border-blue-200 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
                    Verify Ollama is Running
                  </h4>
                  <code className="block bg-slate-900 text-green-400 p-3 rounded text-sm font-mono">
                    ollama list
                  </code>
                </div>

                <div className="bg-blue-100 border border-blue-300 p-4 rounded-lg">
                  <p className="text-sm text-gray-800">
                    <strong>💡 Pro Tip:</strong> For faster generation, use <code className="bg-white px-2 py-1 rounded text-blue-600 font-mono text-xs">codellama:7b</code> model with Max Tokens set to 2000-4000
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default LLMConfigPage;
