import { useState } from 'react';
import { ChevronRight, Plus, Check, Calendar, AlertCircle, Folder } from 'lucide-react';
import ContentBlock from './ContentBlock';

function MainPanel({ node, nodes, onNodeSelect, onAddBlock, onUpdateBlock, onDeleteBlock, onReorderBlocks, onUpdateNode }) {
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [newBlockType, setNewBlockType] = useState('text');
  const [taskCompleted, setTaskCompleted] = useState(node.completed || false);
  const [taskPriority, setTaskPriority] = useState(node.priority || 'medium');
  const [taskDueDate, setTaskDueDate] = useState(node.dueDate || '');

  if (!node) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-text-muted text-sm">Select a node to view</div>
      </div>
    );
  }

  const getBreadcrumbs = () => {
    const breadcrumbs = [];
    let currentNode = node;
    while (currentNode) {
      breadcrumbs.unshift(currentNode);
      currentNode = nodes.find((n) => n.id === currentNode.parentId);
    }
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const children = nodes.filter((n) => n.parentId === node.id);

  const handleAddBlock = () => {
    onAddBlock(node.id, newBlockType);
    setShowAddBlock(false);
    setNewBlockType('text');
  };

  const handleTaskToggle = async () => {
    const newCompleted = !taskCompleted;
    setTaskCompleted(newCompleted);
    await onUpdateNode(node.id, { completed: newCompleted });
  };

  const handlePriorityChange = async (priority) => {
    setTaskPriority(priority);
    await onUpdateNode(node.id, { priority });
  };

  const handleDueDateChange = async (dueDate) => {
    setTaskDueDate(dueDate);
    await onUpdateNode(node.id, { dueDate });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-accent';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-text-muted';
      default:
        return 'text-text-muted';
    }
  };

  const renderNodeHeader = () => {
    switch (node.type) {
      case 'task':
        return (
          <div className="flex items-start gap-4 mb-6">
            <button
              onClick={handleTaskToggle}
              className={`mt-1 w-5 h-5 border-2 flex items-center justify-center transition-colors ${
                taskCompleted ? 'bg-accent border-accent' : 'border-border hover:border-accent'
              }`}
            >
              {taskCompleted && <Check className="w-3 h-3 text-white" />}
            </button>
            <div className="flex-1">
              <h1 className={`text-3xl font-bold ${taskCompleted ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                {node.title}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted uppercase">Priority:</span>
                  <select
                    value={taskPriority}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                    className="bg-transparent border-none text-sm focus:outline-none"
                  >
                    <option value="low" className="bg-surface">Low</option>
                    <option value="medium" className="bg-surface">Medium</option>
                    <option value="high" className="bg-surface">High</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-text-muted" />
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => handleDueDateChange(e.target.value)}
                    className="bg-transparent border-none text-sm text-text-muted focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'section':
        return (
          <div className="flex items-start gap-3 mb-6">
            <Folder className="w-6 h-6 text-text-muted mt-1" />
            <h1 className="text-3xl font-bold text-text-primary">{node.title}</h1>
          </div>
        );

      case 'note':
      default:
        return (
          <h1 className="text-3xl font-bold text-text-primary mb-6">{node.title}</h1>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-3xl mx-auto p-8">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 mb-4 text-sm text-text-muted animate-fade-in">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.id} className="flex items-center gap-2 animate-slide-in" style={{ animationDelay: `${index * 50}ms` }}>
                {index > 0 && <ChevronRight className="w-4 h-4" />}
                <button
                  onClick={() => onNodeSelect(crumb)}
                  className="hover:text-text-primary transition-colors"
                >
                  {crumb.title}
                </button>
              </div>
            ))}
          </div>

          {/* Node Header */}
          {renderNodeHeader()}

          {/* Content Blocks */}
          <div className="space-y-4 mb-8">
            {node.content?.map((block, index) => (
              <ContentBlock
                key={block.id || index}
                block={block}
                onUpdate={(content) => onUpdateBlock(block.id, content)}
                onDelete={() => onDeleteBlock(block.id)}
                onReorder={(direction) => onReorderBlocks(block.id, direction)}
                nodes={nodes}
                onNodeSelect={onNodeSelect}
              />
            ))}
          </div>

          {/* Add Block Button */}
          {node.type !== 'section' && (
            <div className="mb-8">
              {showAddBlock ? (
                <div className="flex items-center gap-2">
                  <select
                    value={newBlockType}
                    onChange={(e) => setNewBlockType(e.target.value)}
                    className="input flex-1"
                  >
                    <option value="text">Text</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                    <option value="link">Link</option>
                    <option value="file">File</option>
                  </select>
                  <button onClick={handleAddBlock} className="btn btn-primary">
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddBlock(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddBlock(true)}
                  className="flex items-center gap-2 text-text-muted hover:text-text-primary text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add block
                </button>
              )}
            </div>
          )}

          {/* Child Nodes */}
          {children.length > 0 && (
            <div className="border-t border-border pt-8">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
                {node.type === 'section' ? 'Contents' : 'Child Nodes'}
              </h3>
              <div className="space-y-2">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => onNodeSelect(child)}
                    className="node-item w-full text-left"
                  >
                    <span className="text-sm text-text-primary">{child.title}</span>
                    <span className="mono text-text-muted capitalize ml-2">
                      {child.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainPanel;
