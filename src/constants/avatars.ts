export interface AvatarOption {
    id: string;
    url: string;
    label: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
    { id: 'avatar-1', label: 'Chef 1', url: '/profile-pics/avatar-1.jpg' },
    { id: 'avatar-2', label: 'Chef 2', url: '/profile-pics/avatar-2.jpg' },
    { id: 'avatar-3', label: 'Chef 3', url: '/profile-pics/avatar-3.jpg' },
    { id: 'avatar-4', label: 'Chef 4', url: '/profile-pics/avatar-4.jpg' },
    { id: 'avatar-5', label: 'Chef 5', url: '/profile-pics/avatar-5.jpg' },
    { id: 'avatar-6', label: 'Chef 6', url: '/profile-pics/avatar-6.jpg' },
    { id: 'avatar-7', label: 'Chef 7', url: '/profile-pics/avatar-7.jpg' },
    { id: 'avatar-8', label: 'Chef 8', url: '/profile-pics/avatar-8.jpg' },
    { id: 'avatar-9', label: 'Chef 9', url: '/profile-pics/avatar-9.jpg' },
    { id: 'avatar-10', label: 'Chef 10', url: '/profile-pics/avatar-10.jpg' },
];

export const getAvatarUrl = (id: string | null | undefined): string | null => {
    if (!id) return null;

    // If the id is already a full URL (e.g. from user upload), return it directly
    if (id.startsWith('http://') || id.startsWith('https://') || id.startsWith('blob:')) {
        return id;
    }

    const avatar = AVATAR_OPTIONS.find(a => a.id === id);
    return avatar ? avatar.url : null;
};
