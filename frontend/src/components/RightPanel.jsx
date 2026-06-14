import { useState, useEffect } from 'react';
import { Tag, Link2, Calendar, Hash } from 'lucide-react';
import api from '../lib/api';

function RightPanel({ node, nodes, onAddTag, onRemoveTag, onCreateLink, onNodeSelect }) {
  const [backlinks, setBacklinks] = useState([]);
  const [linkedNodes, setLinkedNodes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (node) {
      fetchBacklinks();
      fetchLinkedNodes();
    }
  }, [node]);

  const fetchBacklinks = async () => {
    if (!node) return;
    try {
      const response = await api.get(`/links/node/${node.id}/backlinks`);
      setBacklinks(response.data.links);
    } catch (error) {
      console.error('Failed to fetch backlinks:', error);
    }
  };

  const fetchLinkedNodes = async () => {
    if (!node) return;
    try {
      const response = await api.get(`/links/node/${node.id}/outgoing`);
      setLinkedNodes(response.data.links);
    } catch (error) {
      console.error('Failed to fetch linked nodes:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!node) {
    return (
      <div className="w-panel border-l border-border bg-background p-4">
        <div className="text-text-muted text-sm">Select a node to view metadata</div>
      </div>
    );
  }

  return (
    <div className="w-panel border-l border-border bg-background flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Metadata
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        {/* Node Type */}
        <div>
          <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Type</div>
          <div className="text-sm text-text-primary capitalize">{node.type}</div>
        </div>

        {/* Created Date */}
        <div>
          <div className="text-xs text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            Created
          </div>
          <div className="mono text-sm text-text-primary">
            {formatDate(node.createdAt)}
          </div>
        </div>

        {/* Updated Date */}
        <div>
          <div className="text-xs text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            Updated
          </div>
          <div className="mono text-sm text-text-primary">
            {formatDate(node.updatedAt)}
          </div>
        </div>

        {/* Node ID */}
        <div>
          <div className="text-xs text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
            <Hash className="w-3 h-3" />
            ID
          </div>
          <div className="mono text-xs text-text-muted break-all">
            {node.id}
          </div>
        </div>

        {/* Tags */}
        <div>
          <div className="text-xs text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
            <Tag className="w-3 h-3" />
            Tags
          </div>
          <div className="flex flex-wrap gap-2">
            {node.tags?.map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-1 text-xs border border-border text-text-primary flex items-center gap-1"
                style={{ borderColor: tag.color }}
              >
                {tag.name}
                <button
                  onClick={() => onRemoveTag(tag.id)}
                  className="text-text-muted hover:text-text-primary"
                >
                  ×
                </button>
              </span>
            ))}
            <button
              onClick={() => onAddTag()}
              className="px-2 py-1 text-xs border border-dashed border-border text-text-muted hover:text-text-primary hover:border-text-muted transition-colors"
            >
              + Add tag
            </button>
          </div>
        </div>

        {/* Linked Nodes */}
        <div>
          <div className="text-xs text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
            <Link2 className="w-3 h-3" />
            Linked Nodes
          </div>
          {linkedNodes.length === 0 ? (
            <div className="text-sm text-text-muted">No linked nodes</div>
          ) : (
            <div className="space-y-2">
              {linkedNodes.map((link) => (
                <button
                  key={link.id}
                  onClick={() => onNodeSelect(link.targetNode)}
                  className="w-full text-left text-sm text-text-primary hover:text-accent transition-colors"
                >
                  {link.targetNode?.title || 'Unknown'}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => onCreateLink()}
            className="mt-2 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            + Link to node
          </button>
        </div>

        {/* Backlinks */}
        <div>
          <div className="text-xs text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
            <Link2 className="w-3 h-3" />
            Backlinks
          </div>
          {backlinks.length === 0 ? (
            <div className="text-sm text-text-muted">No backlinks</div>
          ) : (
            <div className="space-y-2">
              {backlinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => onNodeSelect(link.sourceNode)}
                  className="w-full text-left text-sm text-text-primary hover:text-accent transition-colors"
                >
                  {link.sourceNode?.title || 'Unknown'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RightPanel;
