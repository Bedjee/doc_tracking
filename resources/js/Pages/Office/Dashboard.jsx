import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    ChevronRight,
    FileText,
    Inbox,
    Plus,
    RotateCcw,
    ScanLine,
    Send,
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';

/* ------------------------------------------------------------------ */
/*  Stat definitions                                                   */
/* ------------------------------------------------------------------ */

const STAT_CARDS = [
    { id: 'total',     label: 'Total',     icon: FileText,     tone: 'slate' },
    { id: 'ongoing',   label: 'Ongoing',   icon: Send,         tone: 'sky' },
    { id: 'received',  label: 'Received',  icon: Inbox,        tone: 'indigo' },
    { id: 'completed', label: 'Completed', icon: CheckCircle2, tone: 'emerald' },
    { id: 'returned',  label: 'Returned',  icon: RotateCcw,    tone: 'amber' },
];

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export default function OfficeDashboard({
    counts = {},
    myOffice = {},
    toReceive = [],
    inHand = [],
}) {
    const awaitingReceipt = myOffice.awaiting_receipt ?? 0;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-slate-800 sm:text-lg">
                            Dashboard
                        </h2>
                        <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">
                            Overview for your office
                        </p>
                    </div>
                    <Button
                        onClick={() =>
                            router.visit(route('documents.create'))
                        }
                        aria-label="New Document"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">
                            New Document
                        </span>
                    </Button>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="mx-auto max-w-5xl space-y-3 px-3 py-3 sm:space-y-4 sm:px-6 sm:py-5 lg:px-8">
                {/* ======================================== */}
                {/*  HERO SCAN CTA                            */}
                {/* ======================================== */}
                <ScanHero awaitingCount={awaitingReceipt} />

                {/* ======================================== */}
                {/*  TWO PRIORITY ACTION TILES                */}
                {/* ======================================== */}
                <div className="grid gap-3 sm:grid-cols-2">
                    <ActionTile
                        label="To receive"
                        count={awaitingReceipt}
                        documents={toReceive}
                        href={route('documents.index', {
                            scope: 'my_office',
                        })}
                        tone="blue"
                        icon={Inbox}
                        emptyText="Nothing inbound right now."
                        cta="Scan to receive"
                        ctaHref={route('scan.index')}
                    />
                    <ActionTile
                        label="In hand"
                        count={myOffice.in_hand ?? 0}
                        documents={inHand}
                        href={route('documents.index', {
                            scope: 'my_office',
                        })}
                        tone="emerald"
                        icon={FileText}
                        emptyText="No documents currently held."
                        cta="Open my office queue"
                    />
                </div>

                {/* ======================================== */}
                {/*  COMPACT STATS                            */}
                {/* ======================================== */}
                <section>
                    {/* Mobile: horizontal scroll strip */}
                    <div className="-mx-3 flex gap-2.5 overflow-x-auto px-3 pb-1 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {STAT_CARDS.map(({ id, label, icon, tone }) => (
                            <MobileStatPill
                                key={id}
                                value={counts[id] ?? 0}
                                label={label}
                                icon={icon}
                                tone={tone}
                            />
                        ))}
                    </div>

                    {/* Desktop: single-row grid */}
                    <div className="hidden grid-cols-5 gap-2.5 sm:grid">
                        {STAT_CARDS.map(({ id, label, icon, tone }) => (
                            <CompactStatCard
                                key={id}
                                value={counts[id] ?? 0}
                                label={label}
                                icon={icon}
                                tone={tone}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

/* ================================================================== */
/*  HERO SCAN CARD                                                     */
/* ================================================================== */

function ScanHero({ awaitingCount }) {
    const hasAwaiting = awaitingCount > 0;

    return (
        <Link
            href={route('scan.index')}
            className="group relative block overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-5 text-white shadow-lg shadow-blue-900/20 transition-all duration-200 hover:shadow-xl hover:shadow-blue-900/30 sm:p-7"
        >
            {/* Decorative blurs */}
            <div
                className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute -bottom-14 -left-10 h-44 w-44 rounded-full bg-indigo-400/20 blur-2xl"
                aria-hidden
            />

            <div className="relative flex items-center gap-4 sm:gap-6">
                {/* Icon */}
                <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20 sm:h-20 sm:w-20">
                    <ScanLine
                        className="h-8 w-8 sm:h-10 sm:w-10"
                        strokeWidth={2}
                    />
                    {hasAwaiting && (
                        <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white ring-2 ring-blue-700">
                            {awaitingCount}
                        </span>
                    )}
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-100/90 sm:text-[11px]">
                        Primary action
                    </p>
                    <h3 className="mt-1 text-lg font-bold leading-tight sm:text-2xl">
                        Scan incoming document
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-blue-100/85 sm:text-sm">
                        {hasAwaiting
                            ? `${awaitingCount} document${
                                  awaitingCount > 1 ? 's' : ''
                              } waiting to be received at your office.`
                            : 'Point the QR code to receive it into your office.'}
                    </p>
                </div>

                {/* Arrow */}
                <div className="hidden flex-shrink-0 items-center justify-center sm:flex">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:bg-white/20">
                        <ArrowRight
                            className="h-5 w-5"
                            strokeWidth={2.4}
                        />
                    </span>
                </div>
            </div>
        </Link>
    );
}

/* ================================================================== */
/*  ACTION TILE                                                        */
/* ================================================================== */

function ActionTile({
    label,
    count,
    documents = [],
    href,
    tone = 'blue',
    icon: Icon,
    emptyText = 'Nothing here.',
    cta,
    ctaHref,
}) {
    const TONES = {
        blue: {
            chip: 'bg-blue-50 text-blue-700',
            bar: 'bg-blue-500',
            cta: 'text-blue-700 hover:text-blue-900',
        },
        emerald: {
            chip: 'bg-emerald-50 text-emerald-700',
            bar: 'bg-emerald-500',
            cta: 'text-emerald-700 hover:text-emerald-900',
        },
    };
    const t = TONES[tone] ?? TONES.blue;
    const safe = typeof count === 'number' ? count : 0;
    const preview = documents.slice(0, 3);

    return (
        <section className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
            {/* Header */}
            <header className="relative flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <span
                    className={`absolute inset-y-0 left-0 w-1 ${t.bar}`}
                    aria-hidden
                />
                <div className="flex min-w-0 items-center gap-3 pl-1.5">
                    <span
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${t.chip}`}
                    >
                        <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                            {label}
                        </p>
                        <p className="text-2xl font-semibold leading-tight tabular-nums text-slate-900">
                            {safe.toLocaleString()}
                        </p>
                    </div>
                </div>

                <Link
                    href={href}
                    className="flex flex-shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                    View all
                    <ChevronRight className="h-3 w-3" />
                </Link>
            </header>

            {/* Preview list */}
            <ul className="flex-1 divide-y divide-slate-100">
                {preview.map((doc) => (
                    <li key={doc.id}>
                        <Link
                            href={route('documents.show', doc.id)}
                            className="block px-4 py-2.5 transition hover:bg-slate-50/70"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <p className="truncate text-sm font-medium text-slate-800">
                                    {doc.title}
                                </p>
                                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-300" />
                            </div>
                            <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500">
                                {doc.tracking_number}
                            </p>
                        </Link>
                    </li>
                ))}

                {preview.length === 0 && (
                    <li className="flex items-center gap-2 px-4 py-6 text-xs text-slate-400">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                        {emptyText}
                    </li>
                )}
            </ul>

            {/* Overflow link */}
            {safe > preview.length && (
                <div className="border-t border-slate-100 px-4 py-2">
                    <Link
                        href={href}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 transition hover:text-slate-900"
                    >
                        +{safe - preview.length} more
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            )}

            {/* Footer CTA */}
            {cta && (
                <div className="border-t border-slate-100 px-4 py-2.5">
                    <Link
                        href={ctaHref ?? href}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold transition ${t.cta}`}
                    >
                        {tone === 'blue' && (
                            <ScanLine className="h-3.5 w-3.5" />
                        )}
                        {cta}
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            )}
        </section>
    );
}

/* ================================================================== */
/*  COMPACT STATS                                                      */
/* ================================================================== */

const TONES = {
    slate: 'text-slate-700 bg-slate-100',
    sky: 'text-sky-700 bg-sky-50',
    indigo: 'text-indigo-700 bg-indigo-50',
    emerald: 'text-emerald-700 bg-emerald-50',
    amber: 'text-amber-700 bg-amber-50',
    red: 'text-red-700 bg-red-50',
};

function CompactStatCard({ value, label, icon: Icon, tone = 'slate' }) {
    const safe = typeof value === 'number' ? value : 0;

    return (
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3">
            <span
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                    TONES[tone] ?? TONES.slate
                }`}
            >
                <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
                <p className="text-lg font-semibold leading-none tabular-nums text-slate-900">
                    {safe.toLocaleString()}
                </p>
                <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    {label}
                </p>
            </div>
        </div>
    );
}

function MobileStatPill({ value, label, icon: Icon, tone = 'slate' }) {
    const safe = typeof value === 'number' ? value : 0;

    return (
        <div className="flex w-[124px] flex-shrink-0 flex-col rounded-xl border border-slate-200 bg-white p-3">
            <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${
                    TONES[tone] ?? TONES.slate
                }`}
            >
                <Icon className="h-3.5 w-3.5" />
            </span>
            <p className="mt-1.5 text-base font-semibold leading-none tabular-nums text-slate-900">
                {safe.toLocaleString()}
            </p>
            <p className="mt-1 truncate text-[10px] font-medium uppercase tracking-wide text-slate-500">
                {label}
            </p>
        </div>
    );
}