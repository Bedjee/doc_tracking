import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ show, onClose, title, children, footer, maxWidth = 'max-w-lg' }) {
    useEffect(() => {
        if (!show) return undefined;
        const onKey = (e) => e.key === 'Escape' && onClose?.();
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [show, onClose]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-t-xl bg-white shadow-xl sm:rounded-xl`}>
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
                    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="px-5 py-4">{children}</div>
                {footer && (
                    <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3.5 sm:flex-row sm:justify-end">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}