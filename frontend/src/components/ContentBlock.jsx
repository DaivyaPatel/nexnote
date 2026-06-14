import { useState } from 'react';
import { Type, Image, Video, Music, Link as LinkIcon, File, GripVertical, Trash2 } from 'lucide-react';
import TextBlock from './TextBlock';

function ContentBlock({ block, onUpdate, onDelete, onReorder, nodes, onNodeSelect }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(block.content);

  const getIcon = () => {
    switch (block.contentType) {
      case 'text':
        return <Type className="w-4 h-4 text-text-muted" />;
      case 'image':
        return <Image className="w-4 h-4 text-text-muted" />;
      case 'video':
        return <Video className="w-4 h-4 text-text-muted" />;
      case 'audio':
        return <Music className="w-4 h-4 text-text-muted" />;
      case 'link':
        return <LinkIcon className="w-4 h-4 text-text-muted" />;
      case 'file':
        return <File className="w-4 h-4 text-text-muted" />;
      default:
        return <Type className="w-4 h-4 text-text-muted" />;
    }
  };

  const handleSave = () => {
    onUpdate(content);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setContent(block.content);
      setIsEditing(false);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const renderContent = () => {
    switch (block.contentType) {
      case 'text':
        return (
          <TextBlock
            content={content}
            onUpdate={onUpdate}
            nodes={nodes}
            onNodeSelect={onNodeSelect}
          />
        );

      case 'image':
        return (
          <div className="space-y-2">
            {content.url ? (
              <img src={content.url} alt="" className="max-w-full rounded" />
            ) : (
              <div className="border-2 border-dashed border-border p-8 text-center text-text-muted">
                No image
              </div>
            )}
            <input
              type="url"
              value={content.url || ''}
              onChange={(e) => onUpdate({ ...content, url: e.target.value })}
              placeholder="Image URL"
              className="input w-full"
            />
          </div>
        );

      case 'video':
        if (content.url?.includes('youtube.com') || content.url?.includes('youtu.be')) {
          const videoId = content.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
          if (videoId) {
            return (
              <div className="space-y-2">
                <iframe
                  width="100%"
                  height="315"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <input
                  type="url"
                  value={content.url || ''}
                  onChange={(e) => onUpdate({ ...content, url: e.target.value })}
                  placeholder="YouTube URL"
                  className="input w-full"
                />
              </div>
            );
          }
        }
        return (
          <div className="space-y-2">
            {content.url ? (
              <video controls className="max-w-full">
                <source src={content.url} />
              </video>
            ) : (
              <div className="border-2 border-dashed border-border p-8 text-center text-text-muted">
                No video
              </div>
            )}
            <input
              type="url"
              value={content.url || ''}
              onChange={(e) => onUpdate({ ...content, url: e.target.value })}
              placeholder="Video URL"
              className="input w-full"
            />
          </div>
        );

      case 'audio':
        return (
          <div className="space-y-2">
            {content.url ? (
              <audio controls className="w-full">
                <source src={content.url} />
              </audio>
            ) : (
              <div className="border-2 border-dashed border-border p-8 text-center text-text-muted">
                No audio
              </div>
            )}
            <input
              type="url"
              value={content.url || ''}
              onChange={(e) => onUpdate({ ...content, url: e.target.value })}
              placeholder="Audio URL (Spotify, SoundCloud, or direct link)"
              className="input w-full"
            />
          </div>
        );

      case 'link':
        return (
          <div className="space-y-2">
            {content.url ? (
              <a
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 border border-border hover:border-accent transition-colors"
              >
                <div className="text-text-primary font-medium">{content.title || content.url}</div>
                {content.description && (
                  <div className="text-sm text-text-muted mt-1">{content.description}</div>
                )}
              </a>
            ) : (
              <div className="border-2 border-dashed border-border p-4 text-center text-text-muted">
                No link
              </div>
            )}
            <input
              type="url"
              value={content.url || ''}
              onChange={(e) => onUpdate({ ...content, url: e.target.value })}
              placeholder="URL"
              className="input w-full"
            />
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            {content.url ? (
              <a
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 border border-border hover:border-accent transition-colors"
              >
                <File className="w-8 h-8 text-text-muted" />
                <div>
                  <div className="text-text-primary">{content.filename || 'File'}</div>
                  <div className="mono text-xs text-text-muted">{content.url}</div>
                </div>
              </a>
            ) : (
              <div className="border-2 border-dashed border-border p-8 text-center text-text-muted">
                No file
              </div>
            )}
            <input
              type="url"
              value={content.url || ''}
              onChange={(e) => onUpdate({ ...content, url: e.target.value })}
              placeholder="File URL"
              className="input w-full"
            />
          </div>
        );

      default:
        return <div className="text-text-muted">Unknown block type</div>;
    }
  };

  return (
    <div className="group relative flex items-start gap-3">
      <div className="flex flex-col gap-1 pt-1">
        <button
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-border rounded cursor-grab"
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', block.id);
          }}
        >
          <GripVertical className="w-4 h-4 text-text-muted" />
        </button>
        <div className="text-text-muted">{getIcon()}</div>
      </div>
      
      <div className="flex-1 min-w-0">
        {renderContent()}
      </div>
      
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-border rounded text-text-muted hover:text-accent transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default ContentBlock;
