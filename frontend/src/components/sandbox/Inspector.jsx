import React, { useState, useEffect } from 'react';
import { X, Code, Mouse, Eye, Wand2 } from 'lucide-react';

const Inspector = ({ iframeRef, onElementSelect }) => {
  const [inspectMode, setInspectMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [hoveredElement, setHoveredElement] = useState(null);

  useEffect(() => {
    if (!iframeRef?.current?.contentWindow) return;

    const iframeDoc = iframeRef.current.contentDocument;
    if (!iframeDoc) return;

    const handleMouseOver = (e) => {
      if (!inspectMode) return;
      e.preventDefault();
      e.stopPropagation();
      
      const element = e.target;
      setHoveredElement({
        tagName: element.tagName.toLowerCase(),
        className: element.className,
        id: element.id,
        selector: generateSelector(element),
        rect: element.getBoundingClientRect(),
        element: element,
      });

      // Highlight element
      highlightElement(element, iframeDoc);
    };

    const handleClick = (e) => {
      if (!inspectMode) return;
      e.preventDefault();
      e.stopPropagation();

      const element = e.target;
      const elementData = {
        tagName: element.tagName.toLowerCase(),
        className: element.className,
        id: element.id,
        selector: generateSelector(element),
        innerHTML: element.innerHTML,
        outerHTML: element.outerHTML,
        styles: window.getComputedStyle(element),
        attributes: Array.from(element.attributes).reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {}),
      };

      setSelectedElement(elementData);
      onElementSelect?.(elementData);
      setInspectMode(false);
      removeHighlight(iframeDoc);
    };

    if (inspectMode) {
      iframeDoc.addEventListener('mouseover', handleMouseOver);
      iframeDoc.addEventListener('click', handleClick);
      iframeDoc.body.style.cursor = 'crosshair';
    }

    return () => {
      if (iframeDoc) {
        iframeDoc.removeEventListener('mouseover', handleMouseOver);
        iframeDoc.removeEventListener('click', handleClick);
        iframeDoc.body.style.cursor = '';
        removeHighlight(iframeDoc);
      }
    };
  }, [inspectMode, iframeRef, onElementSelect]);

  const generateSelector = (element) => {
    if (element.id) return `#${element.id}`;
    
    let path = [];
    let current = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.className) {
        selector += '.' + current.className.split(' ').join('.');
      }
      
      // Add nth-child if needed for specificity
      const siblings = current.parentNode?.children;
      if (siblings && siblings.length > 1) {
        const index = Array.from(siblings).indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }
      
      path.unshift(selector);
      current = current.parentNode;
      
      if (path.length > 5) break; // Limit selector depth
    }
    
    return path.join(' > ');
  };

  const highlightElement = (element, doc) => {
    removeHighlight(doc);
    
    const overlay = doc.createElement('div');
    overlay.id = 'inspector-overlay';
    overlay.style.cssText = `
      position: absolute;
      pointer-events: none;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      z-index: 999999;
    `;
    
    const rect = element.getBoundingClientRect();
    overlay.style.top = rect.top + 'px';
    overlay.style.left = rect.left + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
    
    doc.body.appendChild(overlay);
  };

  const removeHighlight = (doc) => {
    const existing = doc.getElementById('inspector-overlay');
    if (existing) {
      existing.remove();
    }
  };

  return (
    <div className="absolute top-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Inspector Toggle */}
        <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600">
          <button
            onClick={() => setInspectMode(!inspectMode)}
            className={`w-full px-4 py-2 rounded font-medium transition ${
              inspectMode
                ? 'bg-white text-blue-600'
                : 'bg-blue-700 text-white hover:bg-blue-800'
            }`}
          >
            <Mouse className="w-4 h-4 inline mr-2" />
            {inspectMode ? 'Inspecting...' : 'Inspect Element'}
          </button>
        </div>

        {/* Hovered Element Info */}
        {inspectMode && hoveredElement && (
          <div className="p-3 bg-blue-50 border-t border-blue-100 text-sm">
            <div className="flex items-center gap-2 text-blue-700 font-medium mb-1">
              <Eye className="w-4 h-4" />
              Hovering
            </div>
            <div className="font-mono text-xs text-gray-700">
              {hoveredElement.selector}
            </div>
          </div>
        )}

        {/* Selected Element Info */}
        {selectedElement && !inspectMode && (
          <div className="p-4 max-w-sm max-h-96 overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <Code className="w-4 h-4" />
                Selected Element
              </div>
              <button
                onClick={() => setSelectedElement(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500 font-medium">Tag:</span>
                <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                  {selectedElement.tagName}
                </code>
              </div>

              {selectedElement.id && (
                <div>
                  <span className="text-gray-500 font-medium">ID:</span>
                  <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                    {selectedElement.id}
                  </code>
                </div>
              )}

              {selectedElement.className && (
                <div>
                  <span className="text-gray-500 font-medium">Class:</span>
                  <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs break-all">
                    {selectedElement.className}
                  </code>
                </div>
              )}

              <div>
                <span className="text-gray-500 font-medium">Selector:</span>
                <code className="block mt-1 px-2 py-1 bg-gray-100 rounded text-xs break-all">
                  {selectedElement.selector}
                </code>
              </div>

              {Object.keys(selectedElement.attributes).length > 0 && (
                <div>
                  <span className="text-gray-500 font-medium">Attributes:</span>
                  <div className="mt-1 space-y-1">
                    {Object.entries(selectedElement.attributes).map(([key, value]) => (
                      <div key={key} className="flex gap-2 text-xs">
                        <span className="text-gray-600">{key}:</span>
                        <span className="text-gray-800 break-all">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Edit Button */}
            <button
              onClick={() => onElementSelect?.(selectedElement)}
              className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded font-medium hover:from-purple-600 hover:to-purple-700 transition"
            >
              <Wand2 className="w-4 h-4 inline mr-2" />
              Edit with AI
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inspector;
