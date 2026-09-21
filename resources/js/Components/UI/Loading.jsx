import { Loader2 } from 'lucide-react';

export default function Loading({ label = 'Loading…', full = false }) {
    return (
        <div className={`flex items-center justify-center gap-2 text-sm text-slate-500 ${full ? 'min-h-[60vh]' : 'py-10'}`}>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{label}</span>
        </div>
    );
}