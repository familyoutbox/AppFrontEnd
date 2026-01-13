import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const ProjectHeader = ({ project, isSidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/projects')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {project?.name || 'Loading...'}
            </h1>
            {project?.description && (
              <p className="text-sm text-gray-600 mt-0.5">
                {project.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-gray-700 font-medium text-sm">{user.name}</span>
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user.name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;
