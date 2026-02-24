import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface FollowersModalProps {
  userId: string;
  type: 'followers' | 'following';
  isOpen: boolean;
  onClose: () => void;
  onUserClick?: (userId: string) => void;
}

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  bio?: string;
}

const FollowersModal: React.FC<FollowersModalProps> = ({ userId, type, isOpen, onClose, onUserClick }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        if (type === 'followers') {
          // Get users who follow this user
          const { data, error } = await supabase
            .from('follows')
            .select(`
              follower_id,
              profiles:follower_id (
                id,
                full_name,
                avatar_url,
                bio
              )
            `)
            .eq('following_id', userId);

          if (error) throw error;
          setUsers(data?.map((item: any) => item.profiles).filter(Boolean) || []);
        } else {
          // Get users this user follows
          const { data, error } = await supabase
            .from('follows')
            .select(`
              following_id,
              profiles:following_id (
                id,
                full_name,
                avatar_url,
                bio
              )
            `)
            .eq('follower_id', userId);

          if (error) throw error;
          setUsers(data?.map((item: any) => item.profiles).filter(Boolean) || []);
        }
      } catch (err) {
        console.error(`Error fetching ${type}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [userId, type, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-base-100 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-200">
          <h2 className="text-xl font-bold text-base-content">
            {type === 'followers' ? 'Followers' : 'Following'}
          </h2>
          <button
            onClick={onClose}
            className="btn btn-circle btn-sm btn-ghost"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="material-symbols-outlined text-6xl text-base-content/20 mb-3">
                {type === 'followers' ? 'group_off' : 'person_search'}
              </span>
              <p className="text-base-content/60 font-medium">
                {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => {
                    onUserClick?.(user.id);
                    onClose();
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-base-200 transition-colors cursor-pointer group"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="size-12 rounded-full object-cover border-2 border-base-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent && !parent.querySelector('.default-avatar-follower')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'size-12 rounded-full bg-primary/10 flex items-center justify-center default-avatar-follower';
                          fallback.innerHTML = '<span class="material-symbols-outlined text-primary text-xl">person</span>';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-xl">person</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base-content truncate group-hover:text-primary transition-colors">
                      {user.full_name}
                    </p>
                    {user.bio && (
                      <p className="text-sm text-base-content/60 truncate">
                        {user.bio}
                      </p>
                    )}
                  </div>

                  <span className="material-symbols-outlined text-base-content/30 group-hover:text-primary transition-colors">
                    chevron_right
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersModal;
