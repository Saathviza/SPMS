import React from 'react';

export function Select({ children, onValueChange, defaultValue, ...props }) {
    return <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" onChange={(e) => onValueChange && onValueChange(e.target.value)} defaultValue={defaultValue} {...props}>{children}</select>;
}

export function SelectTrigger({ children, className, ...props }) {
    return <div className={className} {...props}>{children}</div>;
}

export function SelectValue({ placeholder, ...props }) {
    return <span {...props}>{placeholder}</span>;
}

export function SelectContent({ children, ...props }) {
    return <div {...props}>{children}</div>;
}

export function SelectItem({ value, children, ...props }) {
    return <option value={value} {...props}>{children}</option>;
}
