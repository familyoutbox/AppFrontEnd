import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const OllamaTest = () => {
  const [prompt, setPrompt] = useState('Write a simple Python function to add two numbers');
  const [model, setModel] = useState('deepseek-v3.1:671b-cloud');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(200);
  const [response, setResponse] = useState('');
  const [loadingBackend, setLoadingBackend] = useState(false);
  const [loadingDirect, setLoadingDirect] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  const testOllama = async () => {
    setLoadingBackend(true);
    setError('');
    setResponse('');
    setStats(null);

    try {
      const startTime = Date.now();
      
      const res = await fetch('http://localhost:8001/api/llm/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          model: model,
          temperature: parseFloat(temperature),
          max_tokens: parseInt(maxTokens),
          stream: false
        })
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setResponse(data.content || data.response || JSON.stringify(data, null, 2));
      setStats({
        duration: `${duration}ms`,
        model: data.model || model,
        status: 'Success'
      });
    } catch (err) {
      setError(err.message);
      setStats({
        status: 'Failed',
        error: err.message
      });
    } finally {
      setLoadingBackend(false);
    }
  };

  const testOllamaDirect = async () => {
    setLoadingDirect(true);
    setError('');
    setResponse('');
    setStats(null);

    try {
      const startTime = Date.now();
      
      console.log('Testing Ollama with:', { model, prompt, temperature, maxTokens });
      
      // Test via backend proxy to Ollama
      const res = await fetch('http://localhost:8001/api/llm/test-ollama', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: parseFloat(temperature),
            num_predict: parseInt(maxTokens)
          }
        })
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log('Response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      console.log('Ollama response:', data);
      
      setResponse(data.response || JSON.stringify(data, null, 2));
      setStats({
        duration: `${duration}ms`,
        model: data.model,
        remoteHost: data.remote_host,
        promptTokens: data.prompt_eval_count,
        responseTokens: data.eval_count,
        totalDuration: data.total_duration ? `${(data.total_duration / 1000000).toFixed(0)}ms` : 'N/A',
        status: 'Success ✅'
      });
    } catch (err) {
      console.error('Test failed:', err);
      setError(err.message);
      setStats({
        status: 'Failed ❌',
        error: err.message
      });
    } finally {
      setLoadingDirect(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Ollama API Test</h1>

        <div className="grid gap-6">
          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="deepseek-v3.1:671b-cloud"
                />
              </div>

              <div>
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  placeholder="Enter your prompt here..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature">Temperature: {temperature}</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="1"
                    max="4096"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    testOllama();
                  }}
                  disabled={loadingBackend || loadingDirect || !prompt}
                  className="flex-1"
                >
                  {loadingBackend ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test via Backend API'
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    testOllamaDirect();
                  }}
                  disabled={loadingBackend || loadingDirect || !prompt}
                  variant="outline"
                  className="flex-1"
                >
                  {loadingDirect ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing Direct...
                    </>
                  ) : (
                    'Test Ollama Direct (Proxy)'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Response */}
          {(response || error) && (
            <Card>
              <CardHeader>
                <CardTitle>Response</CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                    <p className="text-red-800 font-semibold">Error:</p>
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {response && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">{response}</pre>
                  </div>
                )}

                {stats && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-semibold text-blue-900 mb-2">Stats:</p>
                    {Object.entries(stats).map(([key, value]) => (
                      <div key={key} className="text-sm text-blue-800">
                        <span className="font-medium">{key}:</span> {value}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>Backend API:</strong> http://localhost:8001/api/llm/generate
              </p>
              <p>
                <strong>Ollama Direct Proxy:</strong> http://localhost:8001/api/llm/test-ollama
              </p>
              <p>
                <strong>Ollama Endpoint (backend):</strong> http://host.docker.internal:11434/api/generate
              </p>
              <p>
                <strong>Current Model:</strong> {model}
              </p>
              <p className="text-blue-600">
                ℹ️ Both test methods now work - they route through the backend to avoid CORS issues.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OllamaTest;
