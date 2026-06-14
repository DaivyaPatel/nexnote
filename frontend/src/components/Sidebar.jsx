import { useState } from 'react';
import { ChevronDown, ChevronRight, GripVertical, Folder, CheckSquare, FileText } from 'lucide-react';

function Sidebar({ nodes, selectedNode, onNodeSelect, onNodeAction, onDragStart, onDragOver, onDrop }) {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [contextMenu, setContextMenu] = useState(null);

  const toggleExpand = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleContextMenu = (e, node) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node,
    });
  };

  const handleContextAction = (action, node) => {
    onNodeAction(action, node);
    setContextMenu(null);
  };

  const renderNode = (node, level = 0) => {
    const children = nodes.filter((n) => n.parentId === node.id);
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode?.id === node.id;

    const getIcon = () => {
      switch (node.type) {
        case 'section':
          return <Folder className="w-4 h-4 text-text-muted" />;
        case 'task':
          return <CheckSquare className="w-4 h-4 text-text-muted" />;
        case 'note':
          return <FileText className="w-4 h-4 text-text-muted" />;
        default:
          return <FileText className="w-4 h-4 text-text-muted" />;
      }
    };

    return (
      <div key={node.id}>
        <div
          className={`node-item ${isSelected ? 'bg-surface' : ''}`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onNodeSelect(node)}
          onContextMenu={(e) => handleContextMenu(e, node)}
          draggable
          onDragStart={(e) => onDragStart(e, node)}
          onDragOver={(e) => onDragOver(e)}
          onDrop={(e) => onDrop(e, node)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(node.id);
            }}
            className="p-0.5 hover:bg-border rounded"
          >
            {children.length > 0 ? (
              isExpanded ? (
                <ChevronDown className="w-3 h-3 text-text-muted" />
              ) : (
                <ChevronRight className="w-3 h-3 text-text-muted" />
              )
            ) : (
              <span className="w-3 h-3" />
            )}
          </button>
          
          <button
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-border rounded cursor-grab"
            onDragStart={(e) => onDragStart(e, node)}
          >
            <GripVertical className="w-3 h-3 text-text-muted" />
          </button>
          
          {getIcon()}
          
          <span className="flex-1 text-sm text-text-primary truncate">{node.title}</span>
        </div>
        
        {isExpanded && children.map((child) => renderNode(child, level + 1))}
      </div>
    );
  };

  const rootNodes = nodes.filter((n) => !n.parentId);

  return (
    <div className="w-sidebar border-r border-border bg-background flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Nodes</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {rootNodes.length === 0 ? (
          <div className="p-4 text-sm text-text-muted text-center">
            No nodes yet
          </div>
        ) : (
          rootNodes.map((node) => renderNode(node))
        )}
      </div>

      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="context-menu fixed z-20"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <div
              className="context-menu-item"
              onClick={() => handleContextAction('addChild', contextMenu.node)}
            >
              Add child
            </div>
            <div
              className="context-menu-item"
              onClick={() => handleContextAction('rename', contextMenu.node)}
            >
              Rename
            </div>
            <div
              className="context-menu-item"
              onClick={() => handleContextAction('changeType', contextMenu.node)}
            >
              Change type
            </div>
            <div
              className="context-menu-item"
              onClick={() => handleContextAction('addTag', contextMenu.node)}
            >
              Add tag
            </div>
            <div
              className="context-menu-item"
              onClick={() => handleContextAction('link', contextMenu.node)}
            >
              Link to node
            </div>
            <div className="border-t border-border my-1" />
            <div
              className="context-menu-item text-accent"
              onClick={() => handleContextAction('delete', contextMenu.node)}
            >
              Delete
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Sidebar;
