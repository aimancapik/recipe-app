import React from 'react';
import { Toast } from '@/hooks/ui/useToast';

interface ToastContainerProps {
    toasts: Toast[];
    onDismiss: (id: number) => void;
}

const icons = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
};

const colors = {
    success: 'bg-success text-success-content',
    error: 'bg-error text-error-content',
    info: 'bg-neutral text-neutral-content',
};

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl pointer-events-auto animate-in slide-in-from-top-4 duration-300 ${colors[toast.type]}`}
                    onClick={() => onDismiss(toast.id)}
                >
                    <span className="material-symbols-outlined text-[20px] flex-shrink-0">
                        {icons[toast.type]}
                    </span>
                    <p className="text-sm font-medium flex-1">{toast.message}</p>
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
