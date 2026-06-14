import { useState, useEffect, useRef } from 'react';
import { Search, X, Filter } from 'lucide-react';

function SearchModal({ isOpen, onClose, nodes, onNodeSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim()) {
      const filtered = nodes.filter((node) => {
        const matchesQuery = 
          node.title.toLowerCase().includes(query.toLowerCase()) ||
          (node.content?.some(block => 
            block.content?.text?.toLowerCase().includes(query.toLowerCase())
          ));
        
        const matchesType = typeFilter === 'all' || node.type === typeFilter;
        
        return matchesQuery && matchesType;
      });
      
      const resultsWithExcerpts = filtered.map(node => {
        let excerpt = '';
        const textContent = node.content?.find(block => block.contentType === 'text');
        if (textContent?.content?.text) {
          const text = textContent.content.text;
          const queryIndex = text.toLowerCase().indexOf(query.toLowerCase());
          if (queryIndex !== -1) {
            const start = Math.max(0, queryIndex - 30);
            const end = Math.min(text.length, queryIndex + query.length + 30);
            excerpt = (start > 0 ? '...' : '') + text.substring(start, end) + (end < text.length ? '...' : '');
          }
        }
        
        return {
          ...node,
          excerpt,
        };
      });
      
      setResults(resultsWithExcerpts);
      setSelectedIndex(0);
    } else {
      setResults([]);
      setSelectedIndex(0);
    }
  }, [query, nodes, typeFilter]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        onNodeSelect(results[selectedIndex]);
        onClose();
        setQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNodeSelect, results, selectedIndex]);

  const getBreadcrumbs = (node) => {
    const breadcrumbs = [];
    let currentNode = node;
    while (currentNode) {
      breadcrumbs.unshift(currentNode);
      currentNode = nodes.find((n) => n.id === currentNode.parentId);
    }
    return breadcrumbs.map(b => b.title).join(' > ');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50">
      <div className="w-full max-w-2xl bg-surface border border-border">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Search className="w-5 h-5 text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search nodes..."
            className="flex-1 bg-transparent border-none text-text-primary text-lg focus:outline-none"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1 hover:bg-border rounded ${showFilters ? 'text-accent' : 'text-text-muted'}`}
            title="Filters"
          >
            <Filter className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-border rounded text-text-muted hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-border flex items-center gap-4">
            <span className="text-sm text-text-secondary">Type:</span>
            <div className="flex gap-2">
              {['all', 'section', 'task', 'note'].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1 text-sm capitalize ${
                    typeFilter === type
                      ? 'bg-accent text-white'
                      : 'bg-surface border border-border text-text-primary hover:bg-border'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          {results.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              {query.trim() ? 'No results found' : 'Type to search...'}
            </div>
          ) : (
            results.map((node, index) => (
              <button
                key={node.id}
                onClick={() => {
                  onNodeSelect(node);
                  onClose();
                  setQuery('');
                }}
                className={`w-full text-left px-4 py-3 hover:bg-border transition-colors ${
                  index === selectedIndex ? 'bg-border' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-text-primary font-medium">{node.title}</div>
                    {node.excerpt && (
                      <div className="text-sm text-text-muted mt-1 line-clamp-2">
                        {node.excerpt}
                      </div>
                    )}
                    <div className="mono text-xs text-text-muted mt-2 capitalize">
                      {node.type}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-text-muted mt-2 truncate">
                  {getBreadcrumbs(node)}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-4">
            <span><kbd className="px-1.5 py-0.5 bg-border rounded">↑↓</kbd> to navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-border rounded">↵</kbd> to select</span>
          </div>
          <div className="flex items-center gap-4">
            <span><kbd className="px-1.5 py-0.5 bg-border rounded">/</kbd> for filters</span>
            <span><kbd className="px-1.5 py-0.5 bg-border rounded">ESC</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchModal;
