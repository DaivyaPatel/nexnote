import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

function TextBlock({ content, onUpdate, nodes, onNodeSelect }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(content.text || '');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [filteredNodes, setFilteredNodes] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (autocompleteQuery) {
      const filtered = nodes.filter((node) =>
        node.title.toLowerCase().includes(autocompleteQuery.toLowerCase())
      );
      setFilteredNodes(filtered);
      setSelectedIndex(0);
    } else {
      setFilteredNodes(nodes);
      setSelectedIndex(0);
    }
  }, [autocompleteQuery, nodes]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAutocomplete(false);
      }
    };

    if (showAutocomplete) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAutocomplete]);

  const handleSave = () => {
    onUpdate({ text });
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (showAutocomplete) {
        setShowAutocomplete(false);
        setAutocompleteQuery('');
      } else {
        setText(content.text || '');
        setIsEditing(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      if (showAutocomplete) {
        e.preventDefault();
        handleSelectNode(filteredNodes[selectedIndex]);
      } else {
        e.preventDefault();
        handleSave();
      }
    } else if (showAutocomplete) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredNodes.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      }
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Check if user typed [[
    const beforeCursor = value.substring(0, cursorPosition);
    const lastDoubleBracket = beforeCursor.lastIndexOf('[[');
    
    if (lastDoubleBracket !== -1) {
      const afterDoubleBracket = beforeCursor.substring(lastDoubleBracket + 2);
      const nextClosingBracket = afterDoubleBracket.indexOf(']]');
      
      if (nextClosingBracket === -1) {
        // User is typing inside [[ ]]
        setShowAutocomplete(true);
        setAutocompleteQuery(afterDoubleBracket);
      } else {
        setShowAutocomplete(false);
        setAutocompleteQuery('');
      }
    } else {
      setShowAutocomplete(false);
      setAutocompleteQuery('');
    }
    
    setText(value);
  };

  const handleSelectNode = (node) => {
    const cursorPosition = textareaRef.current.selectionStart;
    const beforeCursor = text.substring(0, cursorPosition);
    const lastDoubleBracket = beforeCursor.lastIndexOf('[[');
    
    if (lastDoubleBracket !== -1) {
      const newText = 
        text.substring(0, lastDoubleBracket) +
        `[[${node.title}]]` +
        text.substring(cursorPosition);
      
      setText(newText);
      setShowAutocomplete(false);
      setAutocompleteQuery('');
      
      // Create the link
      onCreateLink(node.id);
    }
  };

  const onCreateLink = async (targetNodeId) => {
    // This will be handled by the parent component
    // For now, we'll just update the text
  };

  const parseText = (text) => {
    // Parse [[Node Title]] patterns and convert to link chips
    const parts = text.split(/\[\[([^\]]+)\]\]/g);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a node title inside [[ ]]
        const node = nodes.find((n) => n.title === part);
        if (node) {
          return (
            <button
              key={index}
              onClick={() => onNodeSelect(node)}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface border border-accent text-accent text-sm rounded hover:bg-border transition-colors"
            >
              {part}
            </button>
          );
        }
      }
      return part;
    });
  };

  return (
    <div className="relative">
      {isEditing ? (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full bg-surface border border-border text-text-primary px-3 py-2 text-sm focus:outline-none focus:border-accent min-h-[80px] resize-y"
            placeholder="Type [[ to link to a node..."
          />
          
          {showAutocomplete && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto custom-scrollbar bg-surface border border-border z-10"
            >
              {filteredNodes.length === 0 ? (
                <div className="p-3 text-sm text-text-muted">No nodes found</div>
              ) : (
                filteredNodes.map((node, index) => (
                  <button
                    key={node.id}
                    onClick={() => handleSelectNode(node)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-border transition-colors ${
                      index === selectedIndex ? 'bg-border' : ''
                    }`}
                  >
                    <div className="text-text-primary">{node.title}</div>
                    <div className="mono text-xs text-text-muted capitalize">
                      {node.type}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="text-text-primary whitespace-pre-wrap cursor-text"
        >
          {text ? parseText(text) : <span className="text-text-muted">Empty text block</span>}
        </div>
      )}
    </div>
  );
}

export default TextBlock;
