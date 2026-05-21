import React from 'react';

export interface SegmentOption<T extends string> {
    value: T;
    label: string;
    icon?: string;
}

interface SegmentedControlProps<T extends string> {
    value: T;
    options: SegmentOption<T>[];
    onChange: (value: T) => void;
    className?: string;
}

function SegmentedControl<T extends string>({ value, options, onChange, className = '' }: SegmentedControlProps<T>) {
    return (
        <div className={`flex gap-1 rounded-2xl bg-base-200/80 p-1 ${className}`}>
            {options.map(option => {
                const active = value === option.value;
                return (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-black transition-all ${
                            active ? 'bg-primary text-primary-content shadow-md shadow-primary/20' : 'text-base-content/50 hover:text-base-content'
                        }`}
                    >
                        {option.icon && <span className={`material-symbols-outlined text-[18px] ${active ? 'fill-1' : ''}`}>{option.icon}</span>}
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

export default SegmentedControl;
