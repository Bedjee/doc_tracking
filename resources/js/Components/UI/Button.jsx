import { Loader2 } from 'lucide-react';

const VARIANTS = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900 disabled:bg-slate-400',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-400',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-600 disabled:bg-emerald-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 disabled:bg-red-300',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500 disabled:bg-amber-300',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-300',
};

const SIZES = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3.5 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
};

export default function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
    children,
    ...props
}) {
    return (
        <button
            {...props}
            disabled={disabled || loading}
            className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
        >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
}