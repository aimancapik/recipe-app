import React, { useMemo } from 'react';
import { AppNotification, useNotifications } from '@/hooks/social/useNotifications';
import { getAvatarUrl } from '@/constants/avatars';

interface NotificationScreenProps {
    onBack: () => void;
    onRecipeClick?: (recipeId: string) => void;
    onProfileClick?: (userId: string) => void;
}

const NotificationScreen: React.FC<NotificationScreenProps> = ({
    onBack,
    onRecipeClick,
    onProfileClick
}) => {
    const { notifications, loading, markAllAsRead, markAsRead } = useNotifications();

    const getIconForType = (type: AppNotification['type']) => {
        switch (type) {
            case 'like': return <span className="material-symbols-outlined text-error fill-icon text-xl">favorite</span>;
            case 'comment': return <span className="material-symbols-outlined text-primary text-xl">chat_bubble</span>;
            case 'follow': return <span className="material-symbols-outlined text-info text-xl">person_add</span>;
            case 'system': return <span className="material-symbols-outlined text-warning text-xl">notifications</span>;
            default: return <span className="material-symbols-outlined text-base-content/50 text-xl">notifications</span>;
        }
    };

    const getBgColorForType = (type: AppNotification['type']) => {
        switch (type) {
            case 'like': return 'bg-error/10';
            case 'comment': return 'bg-primary/10';
            case 'follow': return 'bg-info/10';
            case 'system': return 'bg-warning/10';
            default: return 'bg-base-200';
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins || 1}m`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d`;
        return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const sortedNotifications = useMemo(() => {
        return [...notifications].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }, [notifications]);

    const handleNotificationClick = (notification: AppNotification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }

        if (notification.recipe_id && onRecipeClick) {
            onRecipeClick(notification.recipe_id);
        } else if (notification.source_user_id && onProfileClick) {
            onProfileClick(notification.source_user_id);
        }
    };

    const hasUnread = notifications.some(n => !n.is_read);

    return (
        <div className="flex flex-col min-h-screen bg-base-200">
            <header className="sticky top-0 z-20 bg-base-100/80 backdrop-blur-xl border-b border-base-200/50">
                <div className="flex items-center justify-between px-4 h-16">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="btn btn-ghost btn-sm btn-circle hover:bg-base-200"
                        >
                            <span className="material-symbols-outlined text-xl">arrow_back</span>
                        </button>
                        <h1 className="text-xl font-bold">Activity</h1>
                    </div>
                    {hasUnread && (
                        <button
                            onClick={markAllAsRead}
                            className="btn btn-ghost btn-sm text-primary font-medium"
                        >
                            Mark all read
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto pb-20 p-4">
                {loading && notifications.length === 0 ? (
                    <div className="flex justify-center py-12">
                        <span className="loading loading-spinner text-primary loading-lg"></span>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                        <div className="w-32 h-32 bg-base-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-base-200">
                            <span className="material-symbols-outlined text-6xl text-base-content/20">notifications_off</span>
                        </div>
                        <h3 className="text-xl font-bold text-base-content mb-2">No activity yet</h3>
                        <p className="text-sm text-base-content/60 max-w-xs">
                            When someone interacts with your recipes or follows you, you'll see it here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sortedNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`flex items-start gap-4 p-4 rounded-2xl transition-all cursor-pointer ${notification.is_read
                                    ? 'bg-base-100/50 hover:bg-base-100'
                                    : 'bg-base-100 shadow-sm border border-primary/20 relative'
                                    }`}
                            >
                                {!notification.is_read && (
                                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary" />
                                )}

                                <div className="relative flex-shrink-0">
                                    {notification.source_user ? (() => {
                                        const url = getAvatarUrl(notification.source_user.avatar_url ?? '');
                                        const initial = (notification.source_user.full_name || '?').charAt(0).toUpperCase();
                                        return url ? (
                                            <img src={url} alt={notification.source_user.full_name} className="w-12 h-12 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                                                <span className="text-primary-content font-black text-lg">{initial}</span>
                                            </div>
                                        );
                                    })() : (
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getBgColorForType(notification.type)}`}>
                                            {getIconForType(notification.type)}
                                        </div>
                                    )}
                                    {notification.source_user && (
                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-base-100 ${getBgColorForType(notification.type)}`}>
                                            {React.cloneElement(getIconForType(notification.type) as React.ReactElement, { className: 'text-[11px]' })}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 pr-6">
                                    <p className={`text-sm ${notification.is_read ? 'text-base-content/70' : 'text-base-content font-medium'}`}>
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-base-content/50 mt-1.5 font-medium">
                                        {formatTimeAgo(notification.created_at)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default NotificationScreen;
