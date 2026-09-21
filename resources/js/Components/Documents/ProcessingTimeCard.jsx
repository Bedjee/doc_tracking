import { AlertTriangle, CheckCircle2, Clock, Timer } from 'lucide-react';
import { formatDuration, formatDurationLong } from '@/lib/formatDuration';

export default function ProcessingTimeCard({ route, frozen = false }) {
    if (!route) return null;

    const hasTiming = route.processing_seconds != null;
    const received = !!route.received_at;
    const isOpen = !route.forwarded_at && !frozen;
    const isOverdue = !frozen && route.is_overdue;
    const percent = route.progress_percent ?? 0;
    const remaining = route.remaining_seconds;
    const elapsed = route.elapsed_seconds;

    // Colour state — nothing red/amber once the document is terminal.
    let tone = 'slate';
    if (frozen) tone = 'emerald';
    else if (isOpen && isOverdue) tone = 'red';
    else if (isOpen && percent >= 80) tone = 'amber';
    else if (!isOpen && isOverdue) tone = 'amber';
    else if (!isOpen) tone = 'emerald';

    const TONES = {
        slate:   { bar: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-700 ring-slate-200',      text: 'text-slate-700',   icon: Clock },
        emerald: { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', text: 'text-emerald-700', icon: CheckCircle2 },
        amber:   { bar: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 ring-amber-200',       text: 'text-amber-700',   icon: AlertTriangle },
        red:     { bar: 'bg-red-500',     badge: 'bg-red-50 text-red-700 ring-red-200',             text: 'text-red-700',     icon: AlertTriangle },
    };
    const t = TONES[tone];
    const Icon = t.icon;
    const visiblePercent = Math.min(100, percent);

    if (!hasTiming) {
        return (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                No processing time configured for this step.
            </div>
        );
    }

    const badgeLabel = frozen
        ? 'Closed'
        : isOverdue
          ? 'Overdue'
          : isOpen
            ? 'On Track'
            : 'Closed';

    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Processing Time
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                        {formatDurationLong(route.processing_seconds)}
                    </p>
                </div>

                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${t.badge}`}>
                    <Icon className="h-3 w-3" />
                    {badgeLabel}
                </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                    className={`h-full rounded-full transition-all ${t.bar}`}
                    style={{ width: `${visiblePercent}%` }}
                />
            </div>

            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        Allowed
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold text-slate-800">
                        {route.processing_days}d
                    </dd>
                </div>
                <div>
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        Elapsed
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold text-slate-800">
                        {received ? formatDuration(elapsed) : '—'}
                    </dd>
                </div>
                <div>
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        {isOverdue ? 'Overdue By' : 'Remaining'}
                    </dt>
                    <dd className={`mt-0.5 text-sm font-semibold ${t.text}`}>
                        {received ? formatDuration(remaining) : '—'}
                    </dd>
                </div>
            </dl>

            {received && route.due_at && !frozen && (
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Timer className="h-3 w-3" />
                    Due{' '}
                    <span className="font-medium text-slate-700">
                        {new Date(route.due_at).toLocaleString()}
                    </span>
                </p>
            )}

            {!received && (
                <p className="mt-3 text-[11px] italic text-slate-400">
                    Deadline is calculated the moment the office receives the document.
                </p>
            )}
        </div>
    );
}