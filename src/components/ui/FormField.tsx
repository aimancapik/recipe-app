import React from 'react';

interface FormFieldProps {
    label?: string;
    icon?: string;
    children: React.ReactNode;
    hint?: string;
}

const FormField: React.FC<FormFieldProps> = ({ label, icon, children, hint }) => (
    <label className="block">
        {label && (
            <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-base-content/45">
                {icon && <span className="material-symbols-outlined text-[16px] text-primary">{icon}</span>}
                {label}
            </span>
        )}
        <div className="rounded-2xl border border-base-200 bg-base-100 px-4 py-3 transition-colors focus-within:border-primary/40 focus-within:bg-base-100">
            {children}
        </div>
        {hint && <p className="mt-1.5 text-xs font-medium text-base-content/40">{hint}</p>}
    </label>
);

export default FormField;
