import React, { useState, useEffect } from 'react';
import { Plus, Users, Settings, Trash2, UserPlus, Shield } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/api/teams/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeams(response.data);
      if (response.data.length > 0 && !selectedTeam) {
        setSelectedTeam(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
    }
  };

  const handleCreateTeam = async (teamData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_URL}/api/teams/`, teamData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadTeams();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create team:', error);
      toast.error('Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
                <p className="text-sm text-gray-600 mt-1">Manage your teams and collaborate</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Team
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Your Teams</h2>
                <p className="text-sm text-gray-600 mt-1">{teams.length} {teams.length === 1 ? 'team' : 'teams'}</p>
              </div>
              <div className="divide-y divide-gray-100">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedTeam?.id === team.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{team.name}</h3>
                        {team.description && (
                          <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
                {teams.length === 0 && (
                  <div className="p-8 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No teams yet</p>
                    <p className="text-sm text-gray-500 mt-1">Create your first team to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Team Details */}
          <div className="lg:col-span-2">
            {selectedTeam ? (
              <TeamDetails
                team={selectedTeam}
                onUpdate={loadTeams}
                onInvite={() => setShowInviteModal(true)}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Select a team</h3>
                <p className="text-gray-600 mt-2">Choose a team from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateTeamModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTeam}
          loading={loading}
        />
      )}
      {showInviteModal && selectedTeam && (
        <InviteMemberModal
          team={selectedTeam}
          onClose={() => setShowInviteModal(false)}
          onSuccess={loadTeams}
        />
      )}
    </div>
  );
};

const TeamDetails = ({ team, onUpdate, onInvite }) => {
  const [activeTab, setActiveTab] = useState('members');
  const [auditLogs, setAuditLogs] = useState([]);
  const [invites, setInvites] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadCurrentUser();
    if (activeTab === 'audit') {
      loadAuditLogs();
    } else if (activeTab === 'invites') {
      loadInvites();
    }
  }, [activeTab, team.id]);

  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/api/teams/${team.id}/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuditLogs(response.data);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  };

  const loadInvites = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/api/teams/${team.id}/invites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvites(response.data);
    } catch (error) {
      console.error('Failed to load invites:', error);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_URL}/api/teams/${team.id}/members/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onUpdate();
      toast.success('Member removed');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to remove member');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(
        `${API_URL}/api/teams/${team.id}/members/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update role');
    }
  };

  const isAdmin = currentUser && team.members.some(
    m => m.user_id === currentUser.id && m.role === 'admin'
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{team.name}</h2>
            {team.description && (
              <p className="text-gray-600 mt-1">{team.description}</p>
            )}
          </div>
          {isAdmin && (
            <button
              onClick={onInvite}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Invite Member
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'members'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Members ({team.members.length})
        </button>
        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('invites')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'invites'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Invites
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'audit'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Audit Log
            </button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'members' && (
          <MembersTab
            members={team.members}
            isAdmin={isAdmin}
            currentUserId={currentUser?.id}
            onRemove={handleRemoveMember}
            onUpdateRole={handleUpdateRole}
          />
        )}
        {activeTab === 'invites' && isAdmin && (
          <InvitesTab invites={invites} />
        )}
        {activeTab === 'audit' && isAdmin && (
          <AuditLogTab logs={auditLogs} />
        )}
      </div>
    </div>
  );
};

const MembersTab = ({ members, isAdmin, currentUserId, onRemove, onUpdateRole }) => {
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'developer':
        return 'bg-blue-100 text-blue-700';
      case 'viewer':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div key={member.user_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
              {(member.user_id && member.user_id.length > 0)
                ? member.user_id.charAt(0).toUpperCase()
                : '?'}
            </div>
            <div>
              <p className="font-medium text-gray-900">{member.user_id}</p>
              <p className="text-sm text-gray-600">
                Joined {new Date(member.joined_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && member.user_id !== currentUserId ? (
              <select
                value={member.role}
                onChange={(e) => onUpdateRole(member.user_id, e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="admin">Admin</option>
                <option value="developer">Developer</option>
                <option value="viewer">Viewer</option>
              </select>
            ) : (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(member.role)}`}>
                {member.role}
              </span>
            )}
            {isAdmin && member.user_id !== currentUserId && (
              <button
                onClick={() => onRemove(member.user_id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const InvitesTab = ({ invites }) => {
  return (
    <div className="space-y-3">
      {invites.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No pending invites</p>
        </div>
      ) : (
        invites.map((invite) => (
          <div key={invite.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">{invite.email}</p>
              <p className="text-sm text-gray-600 mt-1">
                Role: {invite.role} • Expires: {new Date(invite.expires_at).toLocaleDateString()}
              </p>
            </div>
            <div className="text-xs text-gray-500 font-mono bg-white px-3 py-1 rounded border border-gray-200">
              {invite.token.slice(0, 8)}...
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const AuditLogTab = ({ logs }) => {
  const getActionIcon = (action) => {
    if (action.includes('created')) return '+';
    if (action.includes('deleted')) return '-';
    if (action.includes('updated')) return '~';
    return '•';
  };

  return (
    <div className="space-y-2">
      {logs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No audit logs</p>
        </div>
      ) : (
        logs.map((log) => (
          <div key={log.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-mono text-gray-600">
              {getActionIcon(log.action)}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{log.action.replace('_', ' ')}</span>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {new Date(log.timestamp).toLocaleString()}
              </p>
              {Object.keys(log.details).length > 0 && (
                <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  {JSON.stringify(log.details, null, 2)}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const CreateTeamModal = ({ onClose, onCreate, loading }) => {
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Create New Team</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="My Awesome Team"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="What's this team for?"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InviteMemberModal = ({ team, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ email: '', role: 'developer' });
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_URL}/api/teams/${team.id}/invites`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInviteLink(`${window.location.origin}/accept-invite/${response.data.token}`);
      onSuccess();
      toast.success('Invite created');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Invite Team Member</h3>
        </div>
        {!inviteLink ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="colleague@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="admin">Admin - Full access</option>
                <option value="developer">Developer - Can edit</option>
                <option value="viewer">Viewer - Read only</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">Invite created successfully!</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Share this link:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    toast.success('Copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamManagement;
