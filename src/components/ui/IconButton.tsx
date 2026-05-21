import React from 'react';

type IconButtonVariant = 'ghost' | 'soft' | 'primary' | 'neutral';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: string;
    label: string;
    variant?: IconButtonVariant;
}

const variants: Record<IconButtonVariant, string> = {
    ghost: 'bg-transparent text-base-content/70 hover:bg-base-200',
    soft: 'bg-base-200/80 text-base-content hover:bg-base-300',
    primary: 'bg-primary text-primary-content shadow-lg shadow-primary/25 hover:bg-primary/90',
    neutral: 'bg-neutral text-neutral-content hover:bg-neutral/90',
};

const IconButton: React.FC<IconButtonProps> = ({ icon, label, variant = 'soft', className = '', ...props }) => (
    <button
        aria-label={label}
        title={label}
        className={`inline-flex size-10 items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-50 ${variants[variant]} ${className}`}
        {...props}
    >
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </button>
);

export default IconButton;
