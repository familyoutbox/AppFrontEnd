import React from 'react';
import { History, Layers, Eye, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ project, isOpen }) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
      {/* Project Info */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Project Info</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-600">Status:</span>
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {project?.status || 'draft'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Modules:</span>
            <span className="ml-2 font-medium text-gray-900">
              {project?.modules?.length || 0}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Pages:</span>
            <span className="ml-2 font-medium text-gray-900">
              {project?.pages?.length || 0}
            </span>
          </div>
        </div>
        <button
          className="mt-4 flex items-center gap-2 text-blue-600 hover:underline text-sm"
          onClick={() => navigate('/settings')}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* Modules */}
      {project?.modules && project.modules.length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">Modules</h3>
          </div>
          <div className="space-y-2">
            {project.modules.map((module) => (
              <div
                key={module.id}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <p className="text-sm font-medium text-gray-900">{module.name}</p>
                <p className="text-xs text-gray-600 mt-1">{module.description}</p>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      module.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : module.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {module.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pages */}
      {project?.pages && project.pages.length > 0 && (
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">UI Pages</h3>
          </div>
          <div className="space-y-2">
            {project.pages.map((page) => (
              <div
                key={page.id}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <p className="text-sm font-medium text-gray-900">{page.title}</p>
                <p className="text-xs text-gray-600 mt-1 font-mono">{page.route}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
