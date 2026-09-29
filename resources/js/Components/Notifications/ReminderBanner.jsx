import { useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    AlertOctagon,
    AlertTriangle,
    BellRing,
    ChevronDown,
    ChevronUp,
    Clock,
    Volume2,
    VolumeX,
    X,
} from 'lucide-react';
import { useReminderSound } from '@/hooks/useReminderSound';
import { useToast } from '@/Components/UI/Toast';

/* ---------------- tier theme ---------------- */

const TIER_THEME = {
    info: {
        wrapper: 'border-sky-300 bg-sky-50',
        ring: 'ring-sky-300/40',
        text: 'text-sky-900',
        subtext: 'text-sky-700',
        accent: 'text-sky-600',
        dot: 'bg-sky-500',
        icon: Clock,
    },
    warning: {
        wrapper: 'border-amber-300 bg-amber-50',
        ring: 'ring-amber-300/50',
        text: 'text-amber-900',
        subtext: 'text-amber-700',
        accent: 'text-amber-600',
        dot: 'bg-amber-500',
        icon: AlertTriangle,
    },
    urgent: {
        wrapper: 'border-amber-400 bg-amber-50',
        ring: 'ring-amber-400/60',
        text: 'text-amber-900',
        subtext: 'text-amber-800',
        accent: 'text-amber-700',
        dot: 'bg-amber-600',
        icon: AlertTriangle,
    },
    overdue: {
        wrapper: 'border-red-300 bg-red-50',
        ring: 'ring-red-300/60',
        text: 'text-red-900',
        subtext: 'text-red-700',
        accent: 'text-red-600',
        dot: 'bg-red-500',
        icon: AlertOctagon,
    },
};

const TIER_ORDER = { overdue: 4, urgent: 3, warning: 2, info: 1 };

/* ---------------- main component ---------------- */

export default function ReminderBanner() {
    const reminders = usePage().props.reminders ?? [];

    const { muted, setMuted } = useReminderSound(reminders);

    const [expanded, setExpanded] = useState(false);
    const [dismissing, setDismissing] = useState(false);
    const [collapsedFloating, setCollapsedFloating] = useState(false);

    const toast = useToast();

    const sorted = useMemo(
        () =>
            [...reminders].sort(
                (a, b) =>
                    (TIER_ORDER[b.tier] ?? 0) - (TIER_ORDER[a.tier] ?? 0)
            ),
        [reminders]
    );

    if (sorted.length === 0) return null;

    const worstTier = sorted[0].tier;
    const theme = TIER_THEME[worstTier] ?? TIER_THEME.info;
    const Icon = theme.icon;

    const visible = expanded ? sorted : sorted.slice(0, 2);
    const hiddenCount = sorted.length - visible.length;
    const overdueCount = sorted.filter((r) => r.tier === 'overdue').length;

    /* ---- headline text ---- */
    const headline = (() => {
        const n = sorted.length;
        if (worstTier === 'overdue') {
            return overdueCount === 1
                ? '1 document is overdue at your office'
                : `${overdueCount} documents are overdue at your office`;
        }
        if (worstTier === 'urgent') {
            return n === 1
                ? '1 document is due very soon'
                : `${n} documents are due very soon`;
        }
        if (worstTier === 'warning') {
            return n === 1
                ? '1 document is approaching its deadline'
                : `${n} documents are approaching their deadline`;
        }
        return n === 1
            ? '1 document is still in progress at your office'
            : `${n} documents are still in progress at your office`;
    })();

    /* ---- actions ---- */

    function dismissAll() {
        if (dismissing) return;
        setDismissing(true);

        router.post(
            route('notifications.read-all'),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.info('Reminders hidden until tomorrow.');
                },
                onError: () => {
                    toast.error('Could not dismiss reminders.');
                },
                onFinish: () => setDismissing(false),
            }
        );
    }

    /* =============================================================
     *  Collapsed floating pill
     *  (shown when the user collapses the full banner)
     * ============================================================= */
    if (collapsedFloating) {
        return (
            <button
                type="button"
                onClick={() => setCollapsedFloating(false)}
                className={`fixed right-3 top-16 z-40 flex items-center gap-2 rounded-full border px-3 py-2 shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] sm:right-6 sm:top-20 ${
                    theme.wrapper
                } ${theme.text} ring-2 ${theme.ring}`}
                aria-label="Show reminders"
            >
                <span className="relative flex h-2.5 w-2.5">
                    <span
                        className={`absolute inline-flex h-full w-full animate-ping rounded-full ${theme.dot} opacity-60`}
                    />
                    <span
                        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${theme.dot}`}
                    />
                </span>
                <BellRing className="h-4 w-4" strokeWidth={2.2} />
                <span className="text-xs font-semibold">
                    {sorted.length}
                </span>
            </button>
        );
    }

    /* =============================================================
     *  Full floating banner
     * ============================================================= */
    return (
        <div
            className={`fixed inset-x-3 top-16 z-40 mx-auto max-w-3xl rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 sm:inset-x-6 sm:top-20 ${
                theme.wrapper
            } ${theme.text} ring-4 ${theme.ring}`}
            role="alert"
            aria-live="polite"
        >
            <div className="p-3 sm:p-4">
                {/* ---- Headline row ---- */}
                <div className="flex items-start gap-2.5 sm:gap-3">
                    <div
                        className={`relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/70 ring-1 ring-inset ring-black/5 sm:h-9 sm:w-9 ${theme.accent}`}
                    >
                        <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.2} />
                        {/* Pulse for high-severity tiers */}
                        {(worstTier === 'urgent' || worstTier === 'overdue') && (
                            <span
                                className={`absolute inline-flex h-full w-full animate-ping rounded-lg ${theme.dot} opacity-30`}
                            />
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold leading-snug sm:text-sm">
                            {headline}
                        </p>
                        <p
                            className={`mt-0.5 hidden text-[11px] leading-snug sm:block ${theme.subtext}`}
                        >
                            Forward or return these documents before the
                            deadline to clear the reminder.
                        </p>
                    </div>

                    {/* ---- Top-right controls ---- */}
                    <div className="flex flex-shrink-0 items-center gap-0.5">
                        <button
                            type="button"
                            onClick={() => setMuted(!muted)}
                            title={
                                muted
                                    ? 'Unmute reminder sounds'
                                    : 'Mute reminder sounds'
                            }
                            aria-label={
                                muted ? 'Unmute sounds' : 'Mute sounds'
                            }
                            className={`rounded-md p-1.5 transition hover:bg-white/60 ${theme.text}`}
                        >
                            {muted ? (
                                <VolumeX className="h-3.5 w-3.5" />
                            ) : (
                                <Volume2 className="h-3.5 w-3.5" />
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setCollapsedFloating(true)}
                            aria-label="Minimize reminders"
                            title="Minimize"
                            className={`hidden rounded-md p-1.5 transition hover:bg-white/60 sm:block ${theme.text}`}
                        >
                            <ChevronUp className="h-3.5 w-3.5" />
                        </button>

                        <button
                            type="button"
                            onClick={dismissAll}
                            disabled={dismissing}
                            aria-label="Dismiss reminders until tomorrow"
                            title="Dismiss until tomorrow"
                            className={`rounded-md p-1.5 transition hover:bg-white/60 disabled:opacity-40 ${theme.text}`}
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                {/* ---- Items ---- */}
                <ul className="mt-2.5 space-y-1 sm:mt-3 sm:pl-12">
                    {visible.map((r) => (
                        <li key={r.key}>
                            <Link
                                href={r.show_url}
                                className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-white/70"
                            >
                                <span
                                    className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                                        r.tier === 'overdue'
                                            ? 'bg-red-500'
                                            : r.tier === 'urgent'
                                              ? 'bg-amber-600'
                                              : r.tier === 'warning'
                                                ? 'bg-amber-400'
                                                : 'bg-sky-400'
                                    }`}
                                />

                                <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">
                                    {r.title}
                                </span>

                                <span
                                    className={`hidden flex-shrink-0 font-mono text-[10px] opacity-70 sm:inline ${theme.text}`}
                                >
                                    {r.tracking_number}
                                </span>

                                <span
                                    className={`flex-shrink-0 text-[11px] font-bold ${theme.accent}`}
                                >
                                    {formatRemaining(r)}
                                </span>
                            </Link>
                        </li>
                    ))}

                    {!expanded && hiddenCount > 0 && (
                        <li className="pl-2 pt-0.5">
                            <button
                                type="button"
                                onClick={() => setExpanded(true)}
                                className={`text-[11px] font-semibold underline-offset-2 hover:underline ${theme.accent}`}
                            >
                                +{hiddenCount} more
                            </button>
                        </li>
                    )}

                    {expanded && sorted.length > 2 && (
                        <li className="pl-2 pt-0.5">
                            <button
                                type="button"
                                onClick={() => setExpanded(false)}
                                className={`inline-flex items-center gap-1 text-[11px] font-semibold ${theme.accent}`}
                            >
                                <ChevronUp className="h-3 w-3" /> Show less
                            </button>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}

/* ---------------- helpers ---------------- */

function formatRemaining(r) {
    if (r.tier === 'overdue') {
        return 'overdue ' + humanDuration(Math.abs(r.remaining_seconds));
    }
    return 'due in ' + humanDuration(r.remaining_seconds);
}

function humanDuration(seconds) {
    const abs = Math.abs(seconds);
    const days = Math.floor(abs / 86400);
    const hours = Math.floor((abs % 86400) / 3600);
    const mins = Math.floor((abs % 3600) / 60);

    if (days >= 1) return days === 1 ? '1 day' : `${days} days`;
    if (hours >= 1) return hours === 1 ? '1 hr' : `${hours} hrs`;
    if (mins >= 1) return `${mins} min`;
    return 'now';
}