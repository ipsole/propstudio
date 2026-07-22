import React, { useState } from 'react';
import { Comment } from '../types';
import { MessageSquare, Trash, Check, CornerDownRight, X } from 'lucide-react';

interface CommentSystemProps {
  comments: Comment[];
  onAddComment: (pageId: string, author: string, text: string) => void;
  onResolveComment: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  pages: { id: string; title: string }[];
  activePageId?: string;
  isOpen: boolean;
  onClose: () => void;
  defaultAuthor?: string;
}

export const CommentSystem: React.FC<CommentSystemProps> = ({
  comments,
  onAddComment,
  onResolveComment,
  onDeleteComment,
  pages,
  activePageId,
  isOpen,
  onClose,
  defaultAuthor = "Author"
}) => {
  const [authorName, setAuthorName] = useState(defaultAuthor);
  const [newCommentText, setNewCommentText] = useState('');
  const [selectedPageId, setSelectedPageId] = useState(activePageId || pages[0]?.id || '');
  const [showResolved, setShowResolved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !authorName.trim()) return;
    onAddComment(selectedPageId, authorName, newCommentText.trim());
    setNewCommentText('');
  };

  const pageMap = pages.reduce((acc, p) => {
    acc[p.id] = p.title;
    return acc;
  }, {} as Record<string, string>);

  const filteredComments = comments.filter(c => {
    const statusMatch = showResolved ? c.resolved : !c.resolved;
    return statusMatch;
  });

  if (!isOpen) return null;

  return (
    <aside className="w-80 border-l border-gray-200 bg-white flex flex-col h-full shrink-0 shadow-lg z-40 no-print animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-gray-500" />
          <h3 className="font-semibold text-gray-900 text-sm tracking-tight">Collaboration Feed</h3>
          <span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {comments.filter(c => !c.resolved).length}
          </span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Write Comment Form */}
      <form onSubmit={handleSubmit} className="p-4 border-b border-gray-100 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Your Name</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your name"
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-black text-gray-900 bg-white"
              required
            />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Target Page</label>
            <select
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
              className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-black text-gray-900 bg-white cursor-pointer"
            >
              {pages.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Type feedback, suggestions, or design questions..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-black resize-none text-gray-900 bg-white"
            required
          />
          <button
            type="submit"
            className="w-full py-1.5 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Post Comment
          </button>
        </div>
      </form>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-100 px-3 bg-gray-50/50">
        <button
          onClick={() => setShowResolved(false)}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${
            !showResolved ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setShowResolved(true)}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${
            showResolved ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Resolved
        </button>
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredComments.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare size={32} className="mb-2 stroke-1" />
            <p className="text-xs font-medium">No {showResolved ? 'resolved' : 'active'} comments</p>
            <p className="text-[10px] text-gray-300">Feedback will appear here.</p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 border rounded-2xl transition-all ${
                comment.resolved ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-100 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <h4 className="text-xs font-semibold text-gray-900">{comment.author}</h4>
                  <span className="text-[9px] text-indigo-500 font-bold bg-indigo-50 px-1 rounded block w-max mt-0.5">
                    {pageMap[comment.pageId] || "Document"}
                  </span>
                </div>
                <span className="text-[9px] text-gray-400 shrink-0">{comment.timestamp}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap mb-2">{comment.text}</p>
              
              <div className="flex items-center justify-end gap-1.5 border-t border-gray-50 pt-2 mt-2">
                {!comment.resolved && (
                  <button
                    onClick={() => onResolveComment(comment.id)}
                    className="flex items-center gap-0.5 px-2 py-0.5 bg-green-50 hover:bg-green-100 text-green-700 rounded text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    title="Resolve comment"
                  >
                    <Check size={10} />
                    Resolve
                  </button>
                )}
                <button
                  onClick={() => onDeleteComment(comment.id)}
                  className="p-1 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded transition-colors cursor-pointer animate-none"
                  title="Delete comment"
                >
                  <Trash size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};
