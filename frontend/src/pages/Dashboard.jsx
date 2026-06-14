import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, Folder } from 'lucide-react';
import api from '../lib/api';

function Dashboard({ user, onLogout }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', icon: '' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const response = await api.get('/workspaces');
      setWorkspaces(response.data.workspaces);
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    try {
      await api.post('/workspaces', newWorkspace);
      setShowCreateModal(false);
      setNewWorkspace({ name: '', icon: '' });
      fetchWorkspaces();
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  const handleLogout = async () => {
    await onLogout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="h-14 border-b border-border flex items-center justify-between px-4 bg-background">
        <h1 className="text-lg font-semibold text-text-primary">NexNote</h1>
        <div className="flex items-center gap-4">
          <span className="text-text-secondary">Welcome, {user.name}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold text-text-primary">Your Workspaces</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Workspace
          </button>
        </div>

        {workspaces.length === 0 ? (
          <div className="text-center py-16 border border-border">
            <Folder className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted">No workspaces yet. Create your first workspace to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                onClick={() => navigate(`/workspace/${workspace.id}`)}
                className="p-6 border border-border hover:border-accent cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  {workspace.icon && <span className="text-2xl">{workspace.icon}</span>}
                  <h3 className="text-lg font-semibold text-text-primary">{workspace.name}</h3>
                </div>
                <p className="mono text-xs text-text-muted capitalize">Role: {workspace.role}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface border border-border w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Create New Workspace</h3>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Name</label>
                <input
                  type="text"
                  value={newWorkspace.name}
                  onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Icon (emoji)</label>
                <input
                  type="text"
                  value={newWorkspace.icon}
                  onChange={(e) => setNewWorkspace({ ...newWorkspace, icon: e.target.value })}
                  className="input w-full"
                  placeholder="📁"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary flex-1">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
