import React, { useState } from 'react';
import { useComments, Comment } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import LoadingAnimation from './LoadingAnimation';
import { getAvatarUrl } from '@/data/avatars';

interface CommentsSectionProps {
    recipeId: string;
    recipeOwnerId?: string;
    onCountChange?: (count: number) => void;
}

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

interface AvatarProps {
    avatarUrl: string | null;
    fullName: string;
    size?: 'sm' | 'md';
}

const Avatar: React.FC<AvatarProps> = ({ avatarUrl, fullName, size = 'md' }) => {
    const url = getAvatarUrl(avatarUrl);
    const initial = (fullName || '?').charAt(0).toUpperCase();
    const sizeClass = size === 'sm' ? 'w-7 h-7' : 'w-10 h-10';
    const textClass = size === 'sm' ? 'text-xs' : 'text-base';

    return url ? (
        <div className={`${sizeClass} rounded-full bg-primary shrink-0 overflow-hidden`}>
            <img src={url} alt={fullName} className="w-full h-full object-cover" />
        </div>
    ) : (
        <div className={`${sizeClass} rounded-full bg-primary flex items-center justify-center shrink-0`}>
            <span className={`text-primary-content font-black ${textClass}`}>{initial}</span>
        </div>
    );
};

interface ReplyFormProps {
    authorName: string;
    currentUser: { user_metadata?: any; email?: string } | null;
    onSubmit: (text: string) => Promise<void>;
    onCancel: () => void;
}

const ReplyForm: React.FC<ReplyFormProps> = ({ authorName, currentUser, onSubmit, onCancel }) => {
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!text.trim()) return;
        setIsSubmitting(true);
        await onSubmit(text);
        setText('');
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="ml-10 mt-3 flex gap-2">
            <Avatar
                avatarUrl={currentUser?.user_metadata?.avatar_id || currentUser?.user_metadata?.avatar_url || null}
                fullName={currentUser?.user_metadata?.full_name || currentUser?.email || '?'}
                size="sm"
            />
            <div className="flex-1 flex flex-col gap-2">
                <textarea
                    autoFocus
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={`Reply to ${authorName}...`}
                    className="w-full bg-base-100 border border-primary/40 rounded-xl p-2.5 text-sm focus:outline-none focus:border-primary resize-none min-h-[64px]"
                    disabled={isSubmitting}
                />
                <div className="flex gap-2 justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn btn-ghost btn-xs rounded-full px-4 normal-case"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!text.trim() || isSubmitting}
                        className="btn btn-primary btn-xs rounded-full px-4 normal-case disabled:opacity-50"
                    >
                        {isSubmitting ? <span className="loading loading-spinner loading-xs"></span> : 'Reply'}
                    </button>
                </div>
            </div>
        </form>
    );
};

interface CommentItemProps {
    comment: Comment;
    recipeOwnerId?: string;
    currentUser: any;
    onAddReply: (parentId: string, text: string) => Promise<void>;
    onDelete: (commentId: string, parentId?: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, recipeOwnerId, currentUser, onAddReply, onDelete }) => {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; parentId?: string } | null>(null);
    const isOwner = comment.user_id === recipeOwnerId;
    const isMyComment = comment.user_id === currentUser?.id;

    const handleReplySubmit = async (text: string) => {
        await onAddReply(comment.id, text);
        setShowReplyForm(false);
    };

    return (
        <div>
            {/* Delete confirmation modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
                    <div className="bg-base-100 rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="size-14 rounded-full bg-error/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-error text-3xl">delete</span>
                            </div>
                            <h3 className="font-bold text-lg text-base-content">Delete comment?</h3>
                            <p className="text-sm text-base-content/50">This can't be undone.</p>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="btn flex-1 rounded-2xl btn-ghost border border-base-200 normal-case font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { onDelete(confirmDelete.id, confirmDelete.parentId); setConfirmDelete(null); }}
                                className="btn flex-1 rounded-2xl btn-error normal-case font-bold text-white"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main comment */}
            <div className="flex gap-3">
                <Avatar
                    avatarUrl={comment.user?.avatar_url || null}
                    fullName={comment.user?.full_name || '?'}
                />
                <div className="flex-1 min-w-0">
                    <div className="bg-base-100 border border-base-200 p-3 rounded-2xl rounded-tl-none">
                        <div className="flex justify-between items-start mb-1 gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                <span className="font-semibold text-sm truncate">
                                    {comment.user?.full_name || 'Anonymous'}
                                </span>
                                {isOwner && (
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide shrink-0">
                                        Chef
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] text-base-content/50">
                                    {formatDate(comment.created_at)}
                                </span>
                                {isMyComment && (
                                    <button
                                        onClick={() => setConfirmDelete({ id: comment.id })}
                                        className="text-error/50 hover:text-error transition-colors"
                                        title="Delete comment"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-base-content/80 whitespace-pre-wrap leading-relaxed">
                            {comment.text}
                        </p>
                    </div>

                    {/* Reply button */}
                    {currentUser && (
                        <button
                            onClick={() => setShowReplyForm(v => !v)}
                            className="mt-1 ml-1 text-[11px] text-base-content/40 hover:text-primary font-semibold transition-colors flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-[14px]">reply</span>
                            {showReplyForm ? 'Cancel' : 'Reply'}
                        </button>
                    )}
                </div>
            </div>

            {/* Inline reply form */}
            {showReplyForm && currentUser && (
                <ReplyForm
                    authorName={comment.user?.full_name || 'Anonymous'}
                    currentUser={currentUser}
                    onSubmit={handleReplySubmit}
                    onCancel={() => setShowReplyForm(false)}
                />
            )}

            {/* Replies */}
            {(comment.replies || []).length > 0 && (
                <div className="mt-3 space-y-3">
                    {comment.replies!.map(reply => (
                        <div key={reply.id} className="ml-10 flex gap-2">
                            <Avatar
                                avatarUrl={reply.user?.avatar_url || null}
                                fullName={reply.user?.full_name || '?'}
                                size="sm"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="bg-base-100 border border-base-200 p-3 rounded-2xl rounded-tl-none">
                                    <div className="flex justify-between items-start mb-1 gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-xs truncate">
                                                {reply.user?.full_name || 'Anonymous'}
                                            </span>
                                            {reply.user_id === recipeOwnerId && (
                                                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide shrink-0">
                                                    Chef
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[11px] text-base-content/50">
                                                {formatDate(reply.created_at)}
                                            </span>
                                            {reply.user_id === currentUser?.id && (
                                                <button
                                                    onClick={() => setConfirmDelete({ id: reply.id, parentId: comment.id })}
                                                    className="text-error/50 hover:text-error transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-base-content/80 whitespace-pre-wrap leading-relaxed">
                                        {reply.text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CommentsSection: React.FC<CommentsSectionProps> = ({ recipeId, recipeOwnerId, onCountChange }) => {
    const { comments, loading, addComment, deleteComment } = useComments(recipeId);
    const { user } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

    React.useEffect(() => {
        if (onCountChange) {
            onCountChange(totalCount);
        }
    }, [totalCount, onCountChange]);

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;
        setIsSubmitting(true);
        await addComment(recipeId, newComment);
        setNewComment('');
        setIsSubmitting(false);
    };

    const handleAddReply = async (parentId: string, text: string) => {
        await addComment(recipeId, text, parentId);
    };

    const handleDelete = (commentId: string, parentId?: string) => {
        deleteComment(commentId, parentId);
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-base-content">
                Q&A <span className="text-base-content/50 text-base font-normal">({totalCount})</span>
            </h3>

            {/* New comment form */}
            {user ? (
                <form onSubmit={handleSubmit} className="flex gap-3">
                    <Avatar
                        avatarUrl={user.user_metadata?.avatar_id || user.user_metadata?.avatar_url || null}
                        fullName={user.user_metadata?.full_name || user.email || '?'}
                    />
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
                            className="btn btn-primary btn-sm rounded-full px-6 disabled:opacity-50"
                        >
                            {isSubmitting ? <span className="loading loading-spinner loading-xs text-white"></span> : 'Post'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="bg-base-200/50 rounded-xl p-4 text-center">
                    <p className="text-sm text-base-content/70">Sign in to join the conversation.</p>
                </div>
            )}

            {/* Comments list */}
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
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            recipeOwnerId={recipeOwnerId}
                            currentUser={user}
                            onAddReply={handleAddReply}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CommentsSection;
