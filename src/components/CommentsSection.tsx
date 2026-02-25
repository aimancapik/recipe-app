import React, { useState } from 'react';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import LoadingAnimation from './LoadingAnimation';

interface CommentsSectionProps {
    recipeId: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ recipeId }) => {
    const { comments, loading, addComment, deleteComment } = useComments(recipeId);
    const { user } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        setIsSubmitting(true);
        await addComment(recipeId, newComment);
        setNewComment('');
        setIsSubmitting(false);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSeconds < 60) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-base-content">
                Comments & Q&A <span className="text-base-content/50 text-base font-normal">({comments.length})</span>
            </h3>

            {/* Comment Form */}
            {user ? (
                <form onSubmit={handleSubmit} className="flex gap-3">
                    <div className="flex-shrink-0">
                        {user.user_metadata?.avatar_url ? (
                            <img
                                src={user.user_metadata.avatar_url}
                                alt="Your avatar"
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-xl">person</span>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 flex flex-col items-end gap-2">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Ask a question or share your thoughts..."
                            className="w-full bg-base-100 border border-base-200 rounded-xl p-3 text-sm focus:outline-none focus:border-primary resize-none min-h-[80px]"
                            disabled={isSubmitting}
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || isSubmitting}
                            className={`btn btn-primary btn-sm rounded-full px-6 ${isSubmitting || !newComment.trim() ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {isSubmitting ? (
                                <span className="loading loading-spinner loading-xs text-white"></span>
                            ) : (
                                'Post'
                            )}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="bg-base-200/50 rounded-xl p-4 text-center">
                    <p className="text-sm text-base-content/70">Sign in to join the conversation.</p>
                </div>
            )}

            {/* Comments List */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <LoadingAnimation size={30} />
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-8 opacity-60 flex flex-col items-center">
                    <span className="material-symbols-outlined text-4xl mb-2">forum</span>
                    <p className="text-sm">No comments yet. Be the first to ask!</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                            <div className="flex-shrink-0">
                                {comment.user?.avatar_url ? (
                                    <img
                                        src={comment.user.avatar_url}
                                        alt={comment.user.full_name}
                                        className="w-10 h-10 rounded-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            const parent = (e.target as HTMLImageElement).parentElement;
                                            if (parent && !parent.querySelector('.default-avatar')) {
                                                const fallback = document.createElement('div');
                                                fallback.className = 'w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center default-avatar';
                                                fallback.innerHTML = '<span class="material-symbols-outlined text-primary text-xl">person</span>';
                                                parent.appendChild(fallback);
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary text-xl">person</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 bg-base-100 border border-base-200 p-3 rounded-2xl rounded-tl-none">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold text-sm">
                                        {comment.user?.full_name || 'Anonymous'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-base-content/50">
                                            {formatDate(comment.created_at)}
                                        </span>
                                        {user?.id === comment.user_id && (
                                            <button
                                                onClick={() => deleteComment(comment.id)}
                                                className="text-error/70 hover:text-error transition-colors"
                                                title="Delete comment"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-base-content/80 whitespace-pre-wrap leading-relaxed">
                                    {comment.content}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CommentsSection;
