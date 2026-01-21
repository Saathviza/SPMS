import React from 'react';

export function RadioGroup({ className, onValueChange, defaultValue, children, ...props }) {
    return <div className={`grid gap-2 ${className}`} {...props}>{children}</div>;
}

export function RadioGroupItem({ value, id, className, ...props }) {
    return <input type="radio" value={value} id={id} className={`aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />;
}
