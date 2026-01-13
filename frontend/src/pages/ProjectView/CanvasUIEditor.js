import React, { useState, useEffect } from 'react';
import { uiLayoutAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { 
  Wand2, 
  MousePointer, 
  Code, 
  Eye,
  Palette,
  Type,
  Layout,
  X
} from 'lucide-react';

const CanvasUIEditor = ({ projectId }) => {
  const [screens, setScreens] = useState([]);
  const [selectedScreen, setSelectedScreen] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [editMode, setEditMode] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredElement, setHoveredElement] = useState(null);

  useEffect(() => {
    loadScreens();
  }, [projectId]);

  const loadScreens = async () => {
    try {
      const response = await uiLayoutAPI.getScreens(projectId);
      setScreens(response.data);
      if (response.data.length > 0) {
        setSelectedScreen(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load screens:', error);
    }
  };

  const handleElementClick = (elementId) => {
    if (editMode) {
      setSelectedElement(elementId);
      setPrompt('');
    }
  };

  const handleApplyChanges = async () => {
    if (!selectedScreen || !selectedElement || !prompt.trim()) return;

    setLoading(true);
    try {
      await uiLayoutAPI.updateElement({
        project_id: projectId,
        screen_id: selectedScreen.id,
        element_id: selectedElement,
        instruction: prompt,
      });
      setPrompt('');
      alert('✨ Changes queued! AI will update the element.');
    } catch (error) {
      console.error('Failed to update element:', error);
      alert('Failed to update element');
    } finally {
      setLoading(false);
    }
  };

  const getElementStyle = (elementId) => {
    const baseStyle = {
      transition: 'all 0.2s ease',
      cursor: editMode ? 'pointer' : 'default',
    };

    if (selectedElement === elementId) {
      return {
        ...baseStyle,
        outline: '3px solid #2563EB',
        outlineOffset: '2px',
        backgroundColor: 'rgba(37, 99, 235, 0.05)',
      };
    }

    if (hoveredElement === elementId && editMode) {
      return {
        ...baseStyle,
        outline: '2px dashed #60A5FA',
        outlineOffset: '2px',
      };
    }

    return baseStyle;
  };

  const quickActions = [
    { label: 'Change to button', prompt: 'Convert this element to a button' },
    { label: 'Make it blue', prompt: 'Change the color of this element to blue' },
    { label: 'Increase size', prompt: 'Make this element larger' },
    { label: 'Add shadow', prompt: 'Add a shadow effect to this element' },
  ];

  return (
    <div className="h-full flex">
      {/* Canvas Area */}
      <div className="flex-1 bg-gray-50 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* Toolbar */}
          <div className="mb-6 flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-4">
              <Button
                variant={editMode ? "default" : "outline"}
                size="sm"
                onClick={() => setEditMode(!editMode)}
                className={editMode ? "bg-blue-600" : ""}
              >
                <MousePointer className="h-4 w-4 mr-2" />
                {editMode ? 'Edit Mode' : 'View Mode'}
              </Button>

              {selectedElement && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-sm text-blue-700">
                  <span className="font-medium">Selected:</span>
                  <code className="font-mono">{selectedElement}</code>
                  <button onClick={() => setSelectedElement(null)} className="ml-2">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedScreen?.id || ''}
                onChange={(e) => {
                  const screen = screens.find(s => s.id === e.target.value);
                  setSelectedScreen(screen);
                  setSelectedElement(null);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {screens.map(screen => (
                  <option key={screen.id} value={screen.id}>
                    {screen.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Canvas */}
          {selectedScreen ? (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Browser Chrome */}
              <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-500">
                  {selectedScreen.route}
                </div>
              </div>

              {/* Page Content */}
              <div className="p-12">
                {/* Title */}
                <h1
                  data-element-id="page_title"
                  onClick={() => handleElementClick('page_title')}
                  onMouseEnter={() => editMode && setHoveredElement('page_title')}
                  onMouseLeave={() => setHoveredElement(null)}
                  style={getElementStyle('page_title')}
                  className="text-4xl font-bold text-gray-900 mb-4 p-2 rounded"
                >
                  {selectedScreen.name}
                </h1>

                {/* Subtitle */}
                <p
                  data-element-id="page_subtitle"
                  onClick={() => handleElementClick('page_subtitle')}
                  onMouseEnter={() => editMode && setHoveredElement('page_subtitle')}
                  onMouseLeave={() => setHoveredElement(null)}
                  style={getElementStyle('page_subtitle')}
                  className="text-lg text-gray-600 mb-8 p-2 rounded"
                >
                  {selectedScreen.route}
                </p>

                {/* Sample Components */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div
                    data-element-id="card_1"
                    onClick={() => handleElementClick('card_1')}
                    onMouseEnter={() => editMode && setHoveredElement('card_1')}
                    onMouseLeave={() => setHoveredElement(null)}
                    style={getElementStyle('card_1')}
                    className="p-6 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <h3 className="text-xl font-semibold text-blue-900 mb-2">Feature Card</h3>
                    <p className="text-blue-700">This is a sample feature card component.</p>
                  </div>

                  <div
                    data-element-id="card_2"
                    onClick={() => handleElementClick('card_2')}
                    onMouseEnter={() => editMode && setHoveredElement('card_2')}
                    onMouseLeave={() => setHoveredElement(null)}
                    style={getElementStyle('card_2')}
                    className="p-6 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <h3 className="text-xl font-semibold text-green-900 mb-2">Another Card</h3>
                    <p className="text-green-700">Sample component with different styling.</p>
                  </div>
                </div>

                {/* Button Group */}
                <div className="flex gap-4 mb-8">
                  <button
                    data-element-id="primary_button"
                    onClick={() => handleElementClick('primary_button')}
                    onMouseEnter={() => editMode && setHoveredElement('primary_button')}
                    onMouseLeave={() => setHoveredElement(null)}
                    style={getElementStyle('primary_button')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    Primary Button
                  </button>

                  <button
                    data-element-id="secondary_button"
                    onClick={() => handleElementClick('secondary_button')}
                    onMouseEnter={() => editMode && setHoveredElement('secondary_button')}
                    onMouseLeave={() => setHoveredElement(null)}
                    style={getElementStyle('secondary_button')}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Secondary Button
                  </button>
                </div>

                {/* Form Example */}
                <div
                  data-element-id="form_container"
                  onClick={() => handleElementClick('form_container')}
                  onMouseEnter={() => editMode && setHoveredElement('form_container')}
                  onMouseLeave={() => setHoveredElement(null)}
                  style={getElementStyle('form_container')}
                  className="p-6 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Sample Form</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No screens available. Create one first!
            </div>
          )}
        </div>
      </div>

      {/* Edit Panel */}
      {selectedElement && (
        <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-auto">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Edit Element</h3>
            <p className="text-sm text-gray-500">
              Selected: <code className="font-mono text-blue-600">{selectedElement}</code>
            </p>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Quick Actions
            </label>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(action.prompt)}
                  className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-left"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              <Wand2 className="h-4 w-4 inline mr-1" />
              Tell AI what to change
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., 'Make this button green and add a hover effect' or 'Convert this to a dropdown menu'"
              rows={4}
              className="resize-none"
            />
          </div>

          <Button
            onClick={handleApplyChanges}
            disabled={!prompt.trim() || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Applying...' : 'Apply Changes'}
          </Button>

          {/* Element Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Element Info</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div><span className="font-medium">Type:</span> Component</div>
              <div><span className="font-medium">Screen:</span> {selectedScreen?.name}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasUIEditor;
