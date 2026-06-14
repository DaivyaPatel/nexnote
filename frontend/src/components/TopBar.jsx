import { Search, User, LogOut } from 'lucide-react';

function TopBar({ user, workspace, onLogout, onSearch }) {
  return (
    <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-background">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-text-primary">
          {workspace?.icon && <span className="mr-2">{workspace.icon}</span>}
          {workspace?.name || 'NexNote'}
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        <button
          onClick={onSearch}
          className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border text-text-secondary text-sm hover:bg-border transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
          <kbd className="mono ml-2">⌘K</kbd>
        </button>
        
        <div className="flex items-center gap-3">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded" />
          ) : (
            <div className="w-8 h-8 bg-surface border border-border flex items-center justify-center text-text-secondary">
              <User className="w-4 h-4" />
            </div>
          )}
          <button
            onClick={onLogout}
            className="text-text-muted hover:text-text-primary transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default TopBar;
