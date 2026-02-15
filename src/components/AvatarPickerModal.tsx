import React, { useState } from 'react';
import { AVATAR_OPTIONS } from '@/data/avatars';

interface AvatarPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (id: string) => void;
    currentAvatarId?: string;
}

const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({ isOpen, onClose, onSelect, currentAvatarId }) => {
    const [selectedId, setSelectedId] = useState(currentAvatarId || '');

    if (!isOpen) return null;

    const handleSave = () => {
        if (selectedId) {
            onSelect(selectedId);
            onClose();
        }
    };

    return (
        <dialog className={`modal modal-bottom sm:modal-middle ${isOpen ? 'modal-open' : ''}`} onClick={onClose}>
            <div
                className="modal-box p-0 max-w-md bg-white overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
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
                    <p className="text-[#181711]/70 text-sm font-normal mt-2">Select a chef that matches your style.</p>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar min-h-[300px]">
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
                                            <div className="absolute -bottom-1 -right-1 bg-primary text-[#181711] rounded-full p-0.5 border-2 border-white animate-in zoom-in duration-200">
                                                <span className="material-symbols-outlined text-xs font-bold leading-none block">check</span>
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
                        disabled={!selectedId}
                        onClick={handleSave}
                        className="w-full bg-primary text-[#181711] py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                    >
                        Save Avatar
                    </button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </dialog>
    );
};

export default AvatarPickerModal;
