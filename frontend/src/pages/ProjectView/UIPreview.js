import React, { useState, useEffect } from 'react';
import { uiLayoutAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Monitor, Wand2, Loader2 } from 'lucide-react';

const UIPreview = ({ projectId }) => {
  const [screens, setScreens] = useState([]);
  const [selectedScreen, setSelectedScreen] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [clickMode, setClickMode] = useState(false);
  const [hoveredElement, setHoveredElement] = useState(null);

  useEffect(() => {
    loadScreens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadScreens = async () => {
    try {
      const response = await uiLayoutAPI.listScreens(projectId);
      setScreens(response.data);
      if (response.data.length > 0) {
        setSelectedScreen(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load screens:', error);
    }
  };

  const updateElement = async () => {
    if (!selectedScreen || !selectedElement || !instruction) return;

    setLoading(true);
    try {
      await uiLayoutAPI.updateElement({
        project_id: projectId,
        screen_id: selectedScreen.id,
        element_id: selectedElement,
        instruction: instruction,
      });
      setInstruction('');
      setSelectedElement(null);
      setClickMode(false);
      alert('Element update queued! The AI will process your request.');
    } catch (error) {
      console.error('Failed to update element:', error);
      alert('Failed to update element');
    } finally {
      setLoading(false);
    }
  };

  const handleElementClick = (elementId) => {
    if (clickMode) {
      setSelectedElement(elementId);
      setClickMode(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Screens List */}
      <div className="lg:col-span-1">
        <Card className="bg-slate-800/50 border-slate-700" data-testid="screens-list-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Monitor className="h-5 w-5 text-purple-500" />
              UI Screens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {screens.length === 0 ? (
                <p className="text-slate-400 text-sm">No screens yet</p>
              ) : (
                <div className="space-y-2">
                  {screens.map(screen => (
                    <Button
                      key={screen.id}
                      variant="ghost"
                      className={`w-full justify-start ${
                        selectedScreen?.id === screen.id ? 'bg-purple-500/20' : ''
                      }`}
                      onClick={() => setSelectedScreen(screen)}
                      data-testid={`screen-${screen.id}`}
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      {screen.name}
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Element Editor */}
        <Card className="bg-slate-800/50 border-slate-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-purple-500" />
              Edit UI Element
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={clickMode ? "default" : "outline"}
                onClick={() => setClickMode(!clickMode)}
                className="flex-1"
                data-testid="click-mode-toggle"
              >
                {clickMode ? '🎯 Click Mode: ON' : '🎯 Enable Click Mode'}
              </Button>
            </div>
            <div>
              <Label htmlFor="elementId" className="text-slate-300">
                Element ID {clickMode && <span className="text-purple-400">(or click an element)</span>}
              </Label>
              <Input
                id="elementId"
                value={selectedElement || ''}
                onChange={(e) => setSelectedElement(e.target.value)}
                placeholder="e.g., btn_123, header_nav"
                className="bg-slate-900 border-slate-700 text-white"
                data-testid="element-id-input"
                readOnly={clickMode}
              />
            </div>
            <div>
              <Label htmlFor="instruction" className="text-slate-300">Instruction</Label>
              <Textarea
                id="instruction"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="e.g., Make this button larger and primary colored"
                rows={4}
                className="bg-slate-900 border-slate-700 text-white"
                data-testid="element-instruction-input"
              />
            </div>
            <Button
              onClick={updateElement}
              disabled={!selectedScreen || !selectedElement || !instruction || loading}
              className="w-full"
              data-testid="update-element-button"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
              ) : (
                <><Wand2 className="mr-2 h-4 w-4" /> Update Element</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right: Preview */}
      <div className="lg:col-span-2">
        <Card className="bg-slate-800/50 border-slate-700" data-testid="preview-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Monitor className="h-5 w-5 text-purple-500" />
              Preview: {selectedScreen?.name || 'No screen selected'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedScreen ? (
              <div className="bg-slate-900 rounded border border-slate-700 p-8">
                {clickMode && (
                  <div className="mb-4 p-3 bg-purple-900/30 border border-purple-700 rounded text-purple-300 text-sm">
                    🎯 Click Mode Active: Click on any element below to select it for editing
                  </div>
                )}
                <div 
                  className={`bg-white rounded shadow-lg ${clickMode ? 'cursor-crosshair' : ''}`} 
                  style={{ minHeight: '500px' }}
                >
                  <div className="p-8 text-center">
                    <h2 
                      className="text-2xl font-bold mb-4 hover:bg-yellow-100 transition-colors p-2 rounded"
                      onClick={() => handleElementClick('screen_title')}
                      onMouseEnter={() => clickMode && setHoveredElement('screen_title')}
                      onMouseLeave={() => setHoveredElement(null)}
                      style={{ outline: hoveredElement === 'screen_title' ? '2px solid #8b5cf6' : 'none' }}
                      data-element-id="screen_title"
                    >
                      {selectedScreen.name}
                    </h2>
                    <p 
                      className="text-gray-600 mb-4 hover:bg-yellow-100 transition-colors p-2 rounded"
                      onClick={() => handleElementClick('screen_route')}
                      onMouseEnter={() => clickMode && setHoveredElement('screen_route')}
                      onMouseLeave={() => setHoveredElement(null)}
                      style={{ outline: hoveredElement === 'screen_route' ? '2px solid #8b5cf6' : 'none' }}
                      data-element-id="screen_route"
                    >
                      Route: {selectedScreen.route}
                    </p>
                    <div 
                      className="bg-blue-50 border border-blue-200 rounded p-4 text-left hover:bg-blue-100 transition-colors"
                      onClick={() => handleElementClick('ast_data_box')}
                      onMouseEnter={() => clickMode && setHoveredElement('ast_data_box')}
                      onMouseLeave={() => setHoveredElement(null)}
                      style={{ outline: hoveredElement === 'ast_data_box' ? '2px solid #8b5cf6' : 'none' }}
                      data-element-id="ast_data_box"
                    >
                      <p className="text-sm font-mono text-gray-700">
                        AST Data: {JSON.stringify(selectedScreen.ast, null, 2).slice(0, 200)}...
                      </p>
                    </div>
                    <p 
                      className="text-sm text-gray-500 mt-4 hover:bg-yellow-100 transition-colors p-2 rounded"
                      onClick={() => handleElementClick('preview_note')}
                      onMouseEnter={() => clickMode && setHoveredElement('preview_note')}
                      onMouseLeave={() => setHoveredElement(null)}
                      style={{ outline: hoveredElement === 'preview_note' ? '2px solid #8b5cf6' : 'none' }}
                      data-element-id="preview_note"
                    >
                      💡 UI preview will render the actual component once code generation is complete
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Monitor className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Select a screen to preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UIPreview;
