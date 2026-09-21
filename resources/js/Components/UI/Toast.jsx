import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

const VARIANTS = {
    success: {
        icon: CheckCircle2,
        ring: 'border-emerald-200',
        bar: 'bg-emerald-500',
        text: 'text-emerald-700',
    },
    error: {
        icon: XCircle,
        ring: 'border-red-200',
        bar: 'bg-red-500',
        text: 'text-red-700',
    },
    warning: {
        icon: AlertTriangle,
        ring: 'border-amber-200',
        bar: 'bg-amber-500',
        text: 'text-amber-700',
    },
    info: {
        icon: Info,
        ring: 'border-sky-200',
        bar: 'bg-sky-500',
        text: 'text-sky-700',
    },
};

let nextId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef(new Map());

    const dismiss = useCallback((id) => {
        setToasts((list) => list.filter((t) => t.id !== id));
        const timer = timers.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timers.current.delete(id);
        }
    }, []);

    const push = useCallback(
        (type, message, options = {}) => {
            const id = ++nextId;
            setToasts((list) => [
                ...list.slice(-4),
                { id, type, message, title: options.title },
            ]);

            const duration = options.duration ?? 4200;
            if (duration > 0) {
                timers.current.set(
                    id,
                    setTimeout(() => dismiss(id), duration)
                );
            }
            return id;
        },
        [dismiss]
    );

    const api = useMemo(
        () => ({
            success: (m, o) => push('success', m, o),
            error: (m, o) => push('error', m, o),
            warning: (m, o) => push('warning', m, o),
            info: (m, o) => push('info', m, o),
            dismiss,
        }),
        [push, dismiss]
    );

    useEffect(
        () => () => {
            timers.current.forEach(clearTimeout);
            timers.current.clear();
        },
        []
    );

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onDismiss }) {
    const variant = VARIANTS[toast.type] ?? VARIANTS.info;
    const Icon = variant.icon;

    return (
        <div
            role="status"
            className={`pointer-events-auto flex items-start gap-3 overflow-hidden rounded-lg border bg-white p-3 shadow-lg shadow-slate-900/5 transition-all duration-200 ${variant.ring}`}
        >
            <span
                className={`mt-0.5 h-full w-1 self-stretch rounded-full ${variant.bar}`}
                aria-hidden
            />
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${variant.text}`} aria-hidden />
            <div className="min-w-0 flex-1">
                {toast.title && (
                    <p className="text-sm font-semibold text-slate-900">
                        {toast.title}
                    </p>
                )}
                <p className="break-words text-sm text-slate-700">{toast.message}</p>
            </div>
            <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Dismiss notification"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used inside <ToastProvider>.');
    }
    return ctx;
}