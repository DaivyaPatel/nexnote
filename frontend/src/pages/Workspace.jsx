import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import api from '../lib/api';
import { initSocket, disconnectSocket } from '../lib/socket';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import MainPanel from '../components/MainPanel';
import RightPanel from '../components/RightPanel';
import SearchModal from '../components/SearchModal';

function Workspace({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showCreateNode, setShowCreateNode] = useState(false);
  const [newNode, setNewNode] = useState({ title: '', type: 'note' });
  const [draggedNode, setDraggedNode] = useState(null);

  useEffect(() => {
    fetchWorkspace();
    fetchNodes();

    const socket = initSocket();
    socket.emit('join-workspace', id);

    socket.on('node-created', (node) => {
      setNodes((prev) => [...prev, node]);
    });

    socket.on('node-updated', (node) => {
      setNodes((prev) => prev.map((n) => (n.id === node.id ? node : n)));
      if (selectedNode?.id === node.id) {
        setSelectedNode(node);
      }
    });

    socket.on('node-deleted', (nodeId) => {
      setNodes((prev) => prev.filter((n) => n.id !== nodeId));
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    });

    return () => {
      socket.emit('leave-workspace', id);
      disconnectSocket();
    };
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchWorkspace = async () => {
    try {
      const response = await api.get(`/workspaces/${id}`);
      setWorkspace(response.data.workspace);
    } catch (error) {
      console.error('Failed to fetch workspace:', error);
    }
  };

  const fetchNodes = async () => {
    try {
      const response = await api.get(`/nodes/workspace/${id}`);
      setNodes(response.data.nodes);
    } catch (error) {
      console.error('Failed to fetch nodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeSelect = (node) => {
    setSelectedNode(node);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleNodeAction = async (action, node) => {
    switch (action) {
      case 'addChild':
        setNewNode({ title: 'New child', type: 'note' });
        await handleCreateNode(null, node.id);
        break;
      case 'rename':
        const newTitle = prompt('Enter new title:', node.title);
        if (newTitle) {
          await handleUpdateNode(node.id, { title: newTitle });
        }
        break;
      case 'delete':
        if (confirm('Delete this node?')) {
          await handleDeleteNode(node.id);
        }
        break;
      case 'changeType':
        const newType = prompt('Enter type (section/task/note):', node.type);
        if (newType && ['section', 'task', 'note'].includes(newType)) {
          await handleUpdateNode(node.id, { type: newType });
        }
        break;
      case 'addTag':
        alert('Tag functionality coming soon');
        break;
      case 'link':
        alert('Link functionality coming soon');
        break;
    }
  };

  const handleCreateNode = async (e, parentId = null) => {
    if (e) e.preventDefault();
    try {
      const response = await api.post('/nodes', {
        workspaceId: id,
        parentId,
        title: newNode.title,
        type: newNode.type,
        position: 0,
      });
      setNodes([...nodes, response.data.node]);
      setShowCreateNode(false);
      setNewNode({ title: '', type: 'note' });
    } catch (error) {
      console.error('Failed to create node:', error);
    }
  };

  const handleUpdateNode = async (nodeId, updates) => {
    try {
      const response = await api.put(`/nodes/${nodeId}`, updates);
      setNodes(nodes.map((n) => (n.id === nodeId ? response.data.node : n)));
      if (selectedNode?.id === nodeId) {
        setSelectedNode(response.data.node);
      }
    } catch (error) {
      console.error('Failed to update node:', error);
    }
  };

  const handleDeleteNode = async (nodeId) => {
    try {
      await api.delete(`/nodes/${nodeId}`);
      setNodes(nodes.filter((n) => n.id !== nodeId));
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    } catch (error) {
      console.error('Failed to delete node:', error);
    }
  };

  const handleAddBlock = async (nodeId, blockType) => {
    try {
      const response = await api.post(`/content/node/${nodeId}`, {
        contentType: blockType,
        content: {},
      });
      setSelectedNode({
        ...selectedNode,
        content: [...(selectedNode.content || []), response.data.content],
      });
    } catch (error) {
      console.error('Failed to add block:', error);
    }
  };

  const handleUpdateBlock = async (blockId, content) => {
    try {
      await api.put(`/content/${blockId}`, { content });
      setSelectedNode({
        ...selectedNode,
        content: selectedNode.content.map((b) =>
          b.id === blockId ? { ...b, content } : b
        ),
      });
    } catch (error) {
      console.error('Failed to update block:', error);
    }
  };

  const handleDeleteBlock = async (blockId) => {
    try {
      await api.delete(`/content/${blockId}`);
      setSelectedNode({
        ...selectedNode,
        content: selectedNode.content.filter((b) => b.id !== blockId),
      });
    } catch (error) {
      console.error('Failed to delete block:', error);
    }
  };

  const handleDragStart = (e, node) => {
    setDraggedNode(node);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetNode) => {
    e.preventDefault();
    if (draggedNode && draggedNode.id !== targetNode.id) {
      await handleUpdateNode(draggedNode.id, { parentId: targetNode.id });
    }
    setDraggedNode(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopBar
        user={user}
        workspace={workspace}
        onLogout={onLogout}
        onSearch={() => setSearchOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed bottom-4 left-4 z-30 p-3 bg-accent text-white rounded"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Sidebar */}
        <div
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-20 transition-transform duration-200`}
        >
          <Sidebar
            nodes={nodes}
            selectedNode={selectedNode}
            onNodeSelect={handleNodeSelect}
            onNodeAction={handleNodeAction}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        </div>

        {/* Main Panel */}
        <div className="flex-1 flex overflow-hidden">
          <MainPanel
            node={selectedNode}
            nodes={nodes}
            onNodeSelect={handleNodeSelect}
            onAddBlock={handleAddBlock}
            onUpdateBlock={handleUpdateBlock}
            onDeleteBlock={handleDeleteBlock}
            onReorderBlocks={() => {}}
            onUpdateNode={handleUpdateNode}
          />

          {/* Right Panel */}
          {rightPanelOpen && (
            <div className="hidden lg:block">
              <RightPanel
                node={selectedNode}
                nodes={nodes}
                onAddTag={() => {}}
                onRemoveTag={() => {}}
                onCreateLink={() => {}}
                onNodeSelect={handleNodeSelect}
              />
            </div>
          )}
        </div>

        {/* Right panel toggle */}
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-surface border border-l-0 border-border text-text-muted hover:text-text-primary"
        >
          {rightPanelOpen ? '›' : '‹'}
        </button>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        nodes={nodes}
        onNodeSelect={handleNodeSelect}
      />

      {/* Create Node Modal */}
      {showCreateNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface border border-border w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Create New Node</h3>
            <form onSubmit={(e) => handleCreateNode(e)} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Title</label>
                <input
                  type="text"
                  value={newNode.title}
                  onChange={(e) => setNewNode({ ...newNode, title: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Type</label>
                <select
                  value={newNode.type}
                  onChange={(e) => setNewNode({ ...newNode, type: e.target.value })}
                  className="input w-full"
                >
                  <option value="note">Note</option>
                  <option value="task">Task</option>
                  <option value="section">Section</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary flex-1">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateNode(false)}
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

export default Workspace;
