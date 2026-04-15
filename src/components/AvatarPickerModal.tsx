import React, { useState, useRef, useEffect } from 'react';
import { AVATAR_OPTIONS } from '@/data/avatars';
import { uploadOptimizedImage } from '@/lib/storage';

interface AvatarPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (id: string) => void;
    currentAvatarId?: string;
}

const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({ isOpen, onClose, onSelect, currentAvatarId }) => {
    const [selectedId, setSelectedId] = useState(currentAvatarId || '');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Animation states
    const [isMounted, setIsMounted] = useState(isOpen);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (isOpen && currentAvatarId) {
            setSelectedId(currentAvatarId);
        }
    }, [isOpen, currentAvatarId]);

    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            const timer = setTimeout(() => setShowModal(true), 10);
            return () => clearTimeout(timer);
        } else {
            setShowModal(false);
            const timer = setTimeout(() => setIsMounted(false), 300); // 300ms matches exit animation
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isMounted) return null;

    const handleSave = () => {
        if (selectedId) {
            onSelect(selectedId);
            onClose();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            // Upload to the 'avatars' folder
            const { url } = await uploadOptimizedImage(file, 'avatars');
            setSelectedId(url);
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            alert(`Failed to upload image: ${error.message || 'Unknown error'}`);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const isCustomUrl = selectedId && (selectedId.startsWith('http://') || selectedId.startsWith('https://'));

    return (
        <dialog 
            className={`modal modal-bottom sm:modal-middle transition-all duration-300 ${showModal ? 'modal-open opacity-100' : 'opacity-0 pointer-events-none'}`} 
            onClick={onClose}
        >
            <div
                className={`modal-box p-0 max-w-md bg-white overflow-hidden shadow-2xl flex flex-col max-h-[90vh] transition-all duration-300 transform ${showModal ? 'translate-y-0 scale-100' : 'translate-y-full sm:translate-y-10 sm:scale-95'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Bottom Sheet Handle */}
                <div className="flex h-6 w-full items-center justify-center sm:hidden">
                    <div className="h-1.5 w-12 rounded-full bg-primary/30"></div>
                </div>

                {/* Modal Header */}
                <div className="px-6 pt-4 pb-2 text-center relative">
                    <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    <h2 className="text-[#181711] text-2xl font-bold leading-tight tracking-tight">Choose Your Avatar</h2>
                    <p className="text-[#181711]/70 text-sm font-normal mt-2">Select a chef that matches your style or upload your own.</p>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar min-h-[300px]">
                    
                    {/* Upload Custom option */}
                    <div className="mb-6">
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 transition-all group disabled:opacity-50"
                        >
                            {uploading ? (
                                <span className="loading loading-spinner text-primary"></span>
                            ) : (
                                <div className="size-10 rounded-full bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                    <span className="material-symbols-outlined text-gray-500 group-hover:text-primary transition-colors">upload</span>
                                </div>
                            )}
                            <div className="text-left">
                                <p className="text-sm font-bold text-[#181711]">{uploading ? 'Uploading...' : 'Upload own photo'}</p>
                                <p className="text-xs text-gray-500 font-medium">JPEG, PNG, WEBP (Max 10MB)</p>
                            </div>
                        </button>
                        
                        {/* Preview custom selection if any */}
                        {isCustomUrl && (
                            <div className="mt-4 flex items-center gap-4 p-4 rounded-2xl bg-primary/10 border border-primary/20">
                                <div className="relative size-16 shrink-0">
                                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-primary shadow-md">
                                        <img src={selectedId} alt="Custom Avatar" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-primary text-[#181711] rounded-full w-6 h-6 flex items-center justify-center border-2 border-white animate-in zoom-in duration-200 shadow-sm">
                                        <span className="material-symbols-outlined text-[14px] font-bold leading-none">check</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="font-bold text-primary text-sm">Custom Photo Selected</p>
                                    <button 
                                        className="text-xs text-red-500 font-bold hover:underline mt-1"
                                        onClick={() => setSelectedId(AVATAR_OPTIONS[0].id)}
                                    >
                                        Remove & Choose Default
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Or pick a default</h3>
                    <div className="grid grid-cols-3 gap-6">
                        {AVATAR_OPTIONS.map((avatar) => {
                            const isSelected = selectedId === avatar.id;
                            return (
                                <div
                                    key={avatar.id}
                                    className="group cursor-pointer flex flex-col items-center"
                                    onClick={() => setSelectedId(avatar.id)}
                                >
                                    <div className={`relative w-full aspect-square rounded-full border-4 transition-all duration-300 hover:scale-105 p-1 ${isSelected ? 'border-primary bg-primary/5' : 'border-transparent bg-gray-50'
                                        }`}>
                                        <div
                                            className="w-full h-full rounded-full bg-center bg-no-repeat bg-cover overflow-hidden"
                                            style={{ backgroundImage: `url("${avatar.url}")` }}
                                        />
                                        {isSelected && (
                                            <div className="absolute -bottom-1 -right-1 bg-primary text-[#181711] rounded-full w-6 h-6 flex items-center justify-center border-2 border-white animate-in zoom-in duration-200 shadow-sm">
                                                <span className="material-symbols-outlined text-[14px] font-bold leading-none">check</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className={`mt-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${isSelected ? 'text-primary' : 'text-gray-400'}`}>
                                        {avatar.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-5 bg-white border-t border-gray-100">
                    <button
                        disabled={!selectedId || uploading}
                        onClick={handleSave}
                        className="w-full bg-primary text-[#181711] py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                    >
                        Save Avatar
                    </button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose} disabled={uploading}>close</button>
            </form>
        </dialog>
    );
};

export default AvatarPickerModal;
