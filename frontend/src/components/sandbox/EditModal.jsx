import React, { useState } from 'react';
import { X, Wand2, Loader, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const EditModal = ({ element, onClose, onApplyChanges, projectId }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);

  const handleAIEdit = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter what you want to change');
      return;
    }

    try {
      setLoading(true);
      setSuggestion(null);

      const response = await fetch(`/api/projects/${projectId}/ai-edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selector: element.selector,
          currentHTML: element.outerHTML,
          prompt: prompt,
          context: {
            tagName: element.tagName,
            className: element.className,
            id: element.id,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI suggestions');
      }

      const data = await response.json();
      setSuggestion(data);
      toast.success('AI suggestions ready!');
    } catch (err) {
      console.error('AI edit error:', err);
      toast.error(err.message || 'Failed to get AI suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (suggestion) {
      onApplyChanges(suggestion);
      toast.success('Changes applied!');
      onClose();
    }
  };

  const suggestedPrompts = [
    'Change the button color to blue',
    'Make this text larger and bold',
    'Add a hover effect',
    'Center this element',
    'Add a border and shadow',
    'Change the layout to flexbox',
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            <h2 className="text-lg font-semibold">AI Visual Editor</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Element Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Element</h3>
            <code className="text-xs bg-white px-3 py-2 rounded block break-all border border-gray-200">
              {element.selector}
            </code>
          </div>

          {/* AI Prompt Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What would you like to change?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your changes in natural language..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
            />

            {/* Quick Suggestions */}
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Quick suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(suggestion)}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Suggestion Result */}
          {suggestion && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3 text-green-700">
                <Sparkles className="w-4 h-4" />
                <h3 className="font-medium">AI Suggestion</h3>
              </div>

              <div className="space-y-3">
                {suggestion.explanation && (
                  <div>
                    <p className="text-sm text-gray-700 mb-2">{suggestion.explanation}</p>
                  </div>
                )}

                {suggestion.newHTML && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1 font-medium">New Code:</p>
                    <pre className="bg-white p-3 rounded text-xs overflow-auto max-h-40 border border-green-300">
                      {suggestion.newHTML}
                    </pre>
                  </div>
                )}

                {suggestion.styles && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1 font-medium">Style Changes:</p>
                    <pre className="bg-white p-3 rounded text-xs overflow-auto max-h-32 border border-green-300">
                      {JSON.stringify(suggestion.styles, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
          >
            Cancel
          </button>
          
          <div className="flex gap-2">
            {!suggestion ? (
              <button
                onClick={handleAIEdit}
                disabled={loading || !prompt.trim()}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded font-medium hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate Changes
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleApply}
                className="px-6 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition"
              >
                Apply Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
