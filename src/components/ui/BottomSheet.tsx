import React from 'react';

interface BottomSheetProps {
    open: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ open, title, onClose, children, footer }) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
            <section
                className="relative flex max-h-[86vh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-base-100 shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-center pt-3">
                    <div className="h-1 w-10 rounded-full bg-base-300" />
                </div>
                <div className="flex items-center justify-between border-b border-base-200 px-5 py-4">
                    <h2 className="text-lg font-black">{title}</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5">{children}</div>
                {footer && <div className="border-t border-base-200 p-4">{footer}</div>}
            </section>
        </div>
    );
};

export default BottomSheet;
