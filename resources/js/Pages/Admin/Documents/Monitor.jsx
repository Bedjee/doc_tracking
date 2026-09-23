import { useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    CheckCircle2,
    Clock,
    Eye,
    FileText,
    Filter,
    Flag,
    Loader2,
    MapPin,
    Search,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';
import DocumentStatusBadge from '@/Components/Documents/DocumentStatusBadge';
import { formatDuration } from '@/lib/formatDuration';

const SCOPES = [
    { id: 'active',    label: 'In Progress', icon: Clock },
    { id: 'completed', label: 'Completed',   icon: CheckCircle2 },
    { id: 'all',       label: 'All',         icon: Filter },
];

export default function AdminMonitor({
    documents,
    scope = 'active',
    filters = {},
    summary = {},
    offices = [],
    categories = [],
    statuses = [],
}) {
    const [form, setForm] = useState({
        search: filters.search ?? '',
        status: filters.status ?? '',
        current_office_id: filters.current_office_id ?? '',
        destination_office_id: filters.destination_office_id ?? '',
        transaction_category_id: filters.transaction_category_id ?? '',
        overdue_only: !!filters.overdue_only,
    });
    const [showFilters, setShowFilters] = useState(false);

    function goScope(next) {
        setForm({ ...form, status: '', overdue_only: false });
        router.get(
            route('admin.monitor.index'),
            { scope: next },
            { preserveState: true, replace: true }
        );
    }

    function apply(overrides = {}) {
        const merged = { ...form, ...overrides };
        const params = { scope };
        Object.keys(merged).forEach((k) => {
            const v = merged[k];
            if (v === '' || v === false || v === undefined || v === null)
                return;
            params[k] = v;
        });
        router.get(route('admin.monitor.index'), params, {
            preserveState: true,
            replace: true,
        });
    }

    function reset() {
        const empty = {
            search: '',
            status: '',
            current_office_id: '',
            destination_office_id: '',
            transaction_category_id: '',
            overdue_only: false,
        };
        setForm(empty);
        router.get(route('admin.monitor.index'), { scope });
    }

    const hasFilters = Object.values(form).some(Boolean);
    const advancedCount = [
        form.status,
        form.current_office_id,
        form.destination_office_id,
        form.transaction_category_id,
        form.overdue_only,
    ].filter(Boolean).length;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-slate-800 sm:text-lg">
                            Live Monitor
                        </h2>
                        <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">
                            Real-time routing overview of every document
                        </p>
                    </div>
                    <Link
                        href={route('admin.documents.index')}
                        className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">
                            Full document list
                        </span>
                    </Link>
                </div>
            }
        >
            <Head title="Live Monitor" />

            <div className="mx-auto max-w-7xl space-y-3 px-3 py-3 sm:space-y-4 sm:px-6 sm:py-5 lg:px-8">
                {/* Summary tiles */}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                    <SummaryTile
                        label="In Progress"
                        value={summary.active ?? 0}
                        icon={Clock}
                        tone="sky"
                        onClick={() => goScope('active')}
                        active={scope === 'active'}
                    />
                    <SummaryTile
                        label="Overdue"
                        value={summary.overdue ?? 0}
                        icon={AlertTriangle}
                        tone="red"
                        onClick={() =>
                            router.get(route('admin.monitor.index'), {
                                scope: 'active',
                                overdue_only: 1,
                            })
                        }
                        active={!!form.overdue_only}
                    />
                    <SummaryTile
                        label="Completed"
                        value={summary.completed ?? 0}
                        icon={CheckCircle2}
                        tone="emerald"
                        onClick={() => goScope('completed')}
                        active={scope === 'completed'}
                    />
                    <SummaryTile
                        label="Total"
                        value={summary.all ?? 0}
                        icon={Filter}
                        tone="slate"
                        onClick={() => goScope('all')}
                        active={scope === 'all'}
                    />
                </div>

                {/* Scope tabs */}
                <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
                    {SCOPES.map(({ id, label, icon: Icon }) => {
                        const active = scope === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => goScope(id)}
                                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition sm:gap-2 sm:px-3 sm:py-2 sm:text-sm ${
                                    active
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* Filters */}
                <div className="rounded-lg border border-slate-200 bg-white">
                    <div className="flex gap-2 p-2.5 lg:hidden">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={form.search}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        search: e.target.value,
                                    })
                                }
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        apply();
                                    }
                                }}
                                placeholder="Search documents"
                                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowFilters((v) => !v)}
                            className={`relative flex-shrink-0 rounded-lg border px-3 transition ${
                                showFilters || advancedCount > 0
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-300 bg-white text-slate-600'
                            }`}
                            aria-label="Toggle filters"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            {advancedCount > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                                    {advancedCount}
                                </span>
                            )}
                        </button>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            apply();
                        }}
                        className={`${
                            showFilters ? 'block' : 'hidden'
                        } space-y-3 border-t border-slate-100 p-3 lg:block lg:border-t-0 lg:p-4`}
                    >
                        <div className="grid gap-3 lg:grid-cols-4">
                            <div className="hidden lg:col-span-2 lg:block">
                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                    Search
                                </label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={form.search}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                search: e.target.value,
                                            })
                                        }
                                        placeholder="Tracking no., title, or reference"
                                        className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                    />
                                </div>
                            </div>

                            <Select
                                label="Status"
                                value={form.status}
                                onChange={(v) =>
                                    setForm({ ...form, status: v })
                                }
                            >
                                {scope === 'completed' ? (
                                    <>
                                        <option value="">All</option>
                                        <option value="COMPLETED">
                                            COMPLETED
                                        </option>
                                        <option value="CANCELLED">
                                            CANCELLED
                                        </option>
                                    </>
                                ) : (
                                    <>
                                        <option value="">All statuses</option>
                                        {statuses
                                            .filter(
                                                (s) =>
                                                    s !== 'COMPLETED' &&
                                                    s !== 'CANCELLED'
                                            )
                                            .map((s) => (
                                                <option key={s} value={s}>
                                                    {s}
                                                </option>
                                            ))}
                                    </>
                                )}
                            </Select>

                            <Select
                                label="Current Office"
                                value={form.current_office_id}
                                onChange={(v) =>
                                    setForm({
                                        ...form,
                                        current_office_id: v,
                                    })
                                }
                            >
                                <option value="">Any</option>
                                {offices.map((o) => (
                                    <option key={o.id} value={o.id}>
                                        {o.name}
                                    </option>
                                ))}
                            </Select>

                            <Select
                                label="Destination"
                                value={form.destination_office_id}
                                onChange={(v) =>
                                    setForm({
                                        ...form,
                                        destination_office_id: v,
                                    })
                                }
                            >
                                <option value="">Any</option>
                                {offices.map((o) => (
                                    <option key={o.id} value={o.id}>
                                        {o.name}
                                    </option>
                                ))}
                            </Select>

                            <Select
                                label="Category"
                                value={form.transaction_category_id}
                                onChange={(v) =>
                                    setForm({
                                        ...form,
                                        transaction_category_id: v,
                                    })
                                }
                            >
                                <option value="">Any</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </Select>

                            {scope !== 'completed' && (
                                <label className="flex cursor-pointer select-none items-center gap-2 self-end rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={form.overdue_only}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                overdue_only:
                                                    e.target.checked,
                                            })
                                        }
                                        className="rounded border-slate-300"
                                    />
                                    <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                                    Overdue only
                                </label>
                            )}

                            <div className="flex items-end gap-2 lg:col-span-4">
                                <Button type="submit" variant="secondary">
                                    <Filter className="h-4 w-4" /> Apply
                                </Button>
                                {hasFilters && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            reset();
                                            setShowFilters(false);
                                        }}
                                    >
                                        <X className="h-4 w-4" /> Clear
                                    </Button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Document cards */}
                <div className="space-y-3">
                    {documents.data.map((doc) => (
                        <DocumentProgressCard
                            key={doc.id}
                            doc={doc}
                            scope={scope}
                        />
                    ))}
                    {documents.data.length === 0 && (
                        <div className="rounded-xl border border-slate-200 bg-white">
                            <EmptyState scope={scope} />
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {documents.links?.length > 3 && (
                    <nav className="flex flex-wrap justify-center gap-1">
                        {documents.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                preserveScroll
                                className={`rounded-md px-2.5 py-1.5 text-xs transition sm:px-3 sm:text-sm ${
                                    link.active
                                        ? 'bg-slate-900 text-white'
                                        : link.url
                                          ? 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                                          : 'cursor-not-allowed bg-slate-50 text-slate-300'
                                }`}
                                dangerouslySetInnerHTML={{
                                    __html: link.label,
                                }}
                            />
                        ))}
                    </nav>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

/* ================================================================== */
/*  Document card with progress track                                  */
/* ================================================================== */
function DocumentProgressCard({ doc, scope }) {
    const routes = doc.routes ?? [];
    const origin = doc.originating_office;

    const auth = usePage().props.auth;
    const myOfficeId = auth?.user?.office_id ?? null;

    const isCancelled = doc.status === 'CANCELLED';
    const isCompleted = doc.status === 'COMPLETED';
    const isFinished = isCompleted || isCancelled;

    // =============================================================
    //  Build the visible step list.
    //  (Same as before: dedupe consecutive same-office rows, tag
    //   routes[0] as origin.)
    // =============================================================
    const steps = useMemo(() => {
        if (routes.length === 0) return [];

        const out = [];
        for (const r of routes) {
            const lastOfficeId = out[out.length - 1]?.office?.id;
            if (lastOfficeId != null && lastOfficeId === r.office?.id) {
                continue;
            }
            out.push(r);
        }

        return out.map((r, idx) => ({ ...r, is_origin: idx === 0 }));
    }, [routes]);

    // =============================================================
    //  Progress state.
    //
    //  positionIdx  — float. Where to draw the moving icon and fill
    //                 bar. Integer i = sitting exactly on step i.
    //                 i + 0.5 = halfway between step i and step i+1
    //                 (in transit).
    //
    //  highlightIdx — integer. Which marker gets the "current" pulse,
    //                 or -1 to indicate nothing is being held right
    //                 now (the document is between offices).
    //
    //  currentStep  — used only for timing info in the footer
    //                 (due/overdue). Never used to highlight a marker.
    // =============================================================
    const progress = useMemo(() => {
        if (steps.length === 0) {
            return { positionIdx: 0, highlightIdx: -1, currentStep: null };
        }

        if (isFinished) {
            return {
                positionIdx: steps.length - 1,
                highlightIdx: -1,
                currentStep: null,
            };
        }

        // 1. Held by an office (received, not yet forwarded)
        const heldIdx = steps.findIndex(
            (r) => r.received_at && !r.forwarded_at
        );
        if (heldIdx >= 0) {
            return {
                positionIdx: heldIdx,
                highlightIdx: heldIdx,
                currentStep: steps[heldIdx],
            };
        }

        // 2. In transit — the destination is marked CURRENT but has
        //    not been received yet. Position the indicator halfway
        //    between the previous step and the destination. No marker
        //    is highlighted, because the document is not at any office.
        const nextIdx = steps.findIndex((r) => r.status === 'CURRENT');
        if (nextIdx > 0) {
            return {
                positionIdx: nextIdx - 0.5,
                highlightIdx: -1,
                currentStep: steps[nextIdx],
            };
        }

        // 3. Fallback — origin (single-step docs or unusual data)
        return {
            positionIdx: 0,
            highlightIdx: 0,
            currentStep: steps[0],
        };
    }, [steps, isFinished]);

    const { positionIdx, highlightIdx, currentStep } = progress;

    const isOverdue = !isFinished && currentStep?.is_overdue;

    // Counts match the visible steps.
    const total = steps.length;
    const doneCount = steps.filter((r) => r.forwarded_at).length;

    return (
        <article
            className={`overflow-hidden rounded-xl border bg-white shadow-sm transition ${
                isOverdue
                    ? 'border-red-200 shadow-red-100/60 ring-1 ring-red-100'
                    : 'border-slate-200'
            }`}
        >
            {/* HEADER — unchanged */}
            <div className="flex items-start justify-between gap-3 px-4 pt-3.5 sm:px-5">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                        <span className="font-mono">
                            {doc.tracking_number}
                        </span>
                        {doc.transaction_category?.name && (
                            <>
                                <span aria-hidden>·</span>
                                <span className="truncate">
                                    {doc.transaction_category.name}
                                </span>
                            </>
                        )}
                        <span aria-hidden>·</span>
                        <span className="tabular-nums">
                            {doneCount}/{total} steps
                        </span>
                    </div>

                    <h3 className="mt-1 truncate text-sm font-semibold text-slate-800 sm:text-base">
                        {doc.title}
                    </h3>

                    <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
                        <Building2
                            className="h-3.5 w-3.5 flex-shrink-0 text-slate-500"
                            strokeWidth={2}
                        />
                        <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            Origin
                        </span>
                        <span className="truncate text-xs font-semibold text-slate-900">
                            {origin?.name ?? '—'}
                        </span>
                    </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                    <DocumentStatusBadge status={doc.status} />
                </div>
            </div>

            {/* PROGRESS TRACK */}
            {steps.length > 0 ? (
                <ProgressTrack
                    steps={steps}
                    positionIdx={positionIdx}
                    highlightIdx={highlightIdx}
                    isCompleted={isCompleted}
                    isCancelled={isCancelled}
                    myOfficeId={myOfficeId}
                />
            ) : null}

            {/* FOOTER — unchanged */}
            <div
                className={`flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5 text-xs sm:px-5 ${
                    isOverdue
                        ? 'border-red-100 bg-red-50/60'
                        : 'border-slate-100 bg-slate-50/60'
                }`}
            >
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                    <MapPin
                        className={`h-3.5 w-3.5 flex-shrink-0 ${
                            isOverdue ? 'text-red-500' : 'text-slate-400'
                        }`}
                    />
                    <span className="text-slate-500">
                        {isFinished ? 'Ended at' : 'Currently at'}
                    </span>
                    <span className="truncate font-medium text-slate-700">
                        {doc.current_office?.name ?? '—'}
                    </span>
                    {!isFinished && doc.current_destination?.name && (
                        <>
                            <span className="text-slate-300" aria-hidden>
                                →
                            </span>
                            <span className="text-slate-500">Next</span>
                            <span className="truncate font-medium text-slate-700">
                                {doc.current_destination.name}
                            </span>
                        </>
                    )}
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                    {isFinished ? (
                        doc.completed_at && (
                            <span className="inline-flex items-center gap-1 font-medium tabular-nums text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {formatDuration(
                                    Math.max(
                                        0,
                                        Math.floor(
                                            (new Date(doc.completed_at) -
                                                new Date(doc.created_at)) /
                                                1000
                                        )
                                    )
                                )}
                            </span>
                        )
                    ) : currentStep?.received_at &&
                      currentStep.remaining_seconds !== undefined ? (
                        isOverdue ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 font-semibold tabular-nums text-red-700">
                                <AlertTriangle className="h-3 w-3" />
                                Overdue{' '}
                                {formatDuration(
                                    Math.abs(currentStep.remaining_seconds)
                                )}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-slate-600">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                Due in{' '}
                                {formatDuration(
                                    Math.abs(currentStep.remaining_seconds)
                                )}
                            </span>
                        )
                    ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400">
                            <Loader2 className="h-3 w-3" />
                            Awaiting receipt
                        </span>
                    )}

                    <Link
                        href={route('admin.documents.show', doc.id)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">View</span>
                    </Link>
                </div>
            </div>
        </article>
    );
}


/* ================================================================== */
/*  Progress track with moving document icon                           */
/* ================================================================== */
function ProgressTrack({
    steps,
    positionIdx,
    highlightIdx,
    isCompleted,
    isCancelled,
    myOfficeId,
}) {
    const total = steps.length;
    const lastIdx = total - 1;
    const isFinished = isCompleted || isCancelled;

    const highlightStep = highlightIdx >= 0 ? steps[highlightIdx] : null;
    const isOverdue = !isFinished && highlightStep?.is_overdue;
    const isReturn = !isFinished && highlightStep?.is_return;

    /* ---- moving icon colors ---- */
    const iconBg = isCancelled
        ? 'bg-slate-500 shadow-slate-500/40'
        : isCompleted
          ? 'bg-emerald-500 shadow-emerald-500/40'
          : isOverdue
            ? 'bg-red-500 shadow-red-500/40'
            : isReturn
              ? 'bg-amber-500 shadow-amber-500/40'
              : 'bg-blue-500 shadow-blue-500/40';

    const tailBg = isCancelled
        ? 'bg-slate-500'
        : isCompleted
          ? 'bg-emerald-500'
          : isOverdue
            ? 'bg-red-500'
            : isReturn
              ? 'bg-amber-500'
              : 'bg-blue-500';

    const fillGradient = isCancelled
        ? 'bg-gradient-to-r from-emerald-500 to-slate-400'
        : isCompleted
          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
          : isOverdue
            ? 'bg-gradient-to-r from-emerald-500 via-emerald-500 to-red-500'
            : 'bg-gradient-to-r from-emerald-500 to-blue-500';

    /* ---- positions ---- */

    // Icon left as a % of the container width.
    //   positionIdx = i       → step i's marker centre
    //   positionIdx = i + 0.5 → midpoint between step i and i+1
    const iconLeftPct = total > 0 ? (50 + positionIdx * 100) / total : 50;

    // Fill bar width as a % of the track.
    const fillPct = isFinished
        ? 100
        : total > 1
          ? Math.max(
                0,
                Math.min(100, (positionIdx / (total - 1)) * 100)
            )
          : 0;

    // Is the icon currently sitting exactly on a step? (integer positionIdx)
    const isIconOnStep = Number.isInteger(positionIdx);
    const iconStepIdx = isIconOnStep ? Math.round(positionIdx) : -1;

    const showMovingIcon = !isFinished && total > 0;

    return (
        <div className="px-4 pt-14 pb-4 sm:px-5 sm:pt-16">
            <div className="relative flex">
                {/* -------- track + fill -------- */}
                <div
                    className="absolute top-[6px] h-1.5 -translate-y-1/2 rounded-full bg-slate-200"
                    style={{
                        left: `${50 / total}%`,
                        right: `${50 / total}%`,
                    }}
                >
                    <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${fillGradient}`}
                        style={{ width: `${fillPct}%` }}
                    />
                </div>

                {/* -------- step markers -------- */}
                {steps.map((step, i) => {
                    const isOrigin = !!step.is_origin;
                    const isEndpoint = !isOrigin && i === lastIdx;
                    const isPassed = !!step.forwarded_at;
                    const isHighlighted = i === highlightIdx;
                    const stepOverdue = isHighlighted && step.is_overdue;
                    const stepReturn = isHighlighted && step.is_return;

                    const isMyOffice =
                        myOfficeId != null &&
                        step.office?.id != null &&
                        Number(step.office.id) === Number(myOfficeId);

                    let markerClass = 'bg-slate-300';
                    if (isPassed || isFinished) {
                        markerClass = 'bg-emerald-500';
                    } else if (isHighlighted) {
                        markerClass = stepOverdue
                            ? 'bg-red-500 animate-pulse'
                            : stepReturn
                              ? 'bg-amber-500'
                              : 'bg-blue-500';
                    } else if (isOrigin) {
                        markerClass = 'bg-slate-500';
                    }

                    const showLabelMobile =
                        isOrigin || isEndpoint || isHighlighted || isMyOffice;

                    // Hide the static origin/endpoint icon when the moving
                    // icon is sitting exactly on top of it.
                    const hideStaticIcon = iconStepIdx === i;

                    return (
                        <div
                            key={step.id ?? `${step.sequence}-${i}`}
                            className="relative flex min-w-0 flex-1 flex-col items-center"
                        >
                            {/* Static icons for origin and endpoint */}
                            <div className="pointer-events-none absolute -top-9 left-1/2 flex h-8 w-8 -translate-x-1/2 items-end justify-center">
                                {isOrigin && !hideStaticIcon && (
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-white shadow-md ring-2 ring-white">
                                        <Building2
                                            className="h-3 w-3"
                                            strokeWidth={2.4}
                                        />
                                    </div>
                                )}
                                {isEndpoint && !hideStaticIcon && (
                                    <div
                                        className={`flex h-6 w-6 items-center justify-center rounded-full text-white shadow-md ring-2 ring-white ${
                                            isFinished
                                                ? 'bg-emerald-600'
                                                : 'bg-slate-400'
                                        }`}
                                    >
                                        <Flag
                                            className="h-3 w-3"
                                            strokeWidth={2.4}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Marker dot */}
                            <div
                                className={`h-3 w-3 flex-shrink-0 rounded-full ring-2 ring-white transition-all duration-300 ${markerClass}`}
                                title={`${step.sequence}. ${
                                    step.office?.name ?? '—'
                                }`}
                            />

                            {/* Office name */}
                            <p
                                className={`mt-2 w-full max-w-full truncate text-center text-[10px] leading-tight ${
                                    showLabelMobile ? '' : 'hidden md:block'
                                } ${
                                    isOrigin
                                        ? 'font-semibold text-slate-900'
                                        : isHighlighted
                                          ? 'font-medium text-slate-800'
                                          : isPassed || isFinished
                                            ? 'text-slate-500'
                                            : 'text-slate-400'
                                }`}
                                title={step.office?.name ?? ''}
                            >
                                {step.office?.name ?? '—'}
                            </p>

                            {/* Badges */}
                            <span className="mt-0.5 flex h-3.5 items-center justify-center gap-1">
                                {isOrigin && (
                                    <span className="hidden rounded bg-slate-700 px-1 py-px text-[8px] font-bold uppercase tracking-wider text-white sm:inline-block">
                                        Origin
                                    </span>
                                )}
                                {isMyOffice && !isOrigin && (
                                    <span className="hidden rounded bg-blue-600 px-1 py-px text-[8px] font-bold uppercase tracking-wider text-white sm:inline-block">
                                        Your Office
                                    </span>
                                )}
                                {isEndpoint && (
                                    <span
                                        className={`hidden rounded px-1 py-px text-[8px] font-bold uppercase tracking-wider sm:inline-block ${
                                            isFinished
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        Final
                                    </span>
                                )}
                            </span>
                        </div>
                    );
                })}

                {/* -------- moving document icon -------- */}
                {showMovingIcon && (
                    <>
                        <div
                            className="pointer-events-none absolute -top-9 flex h-8 w-8 -translate-x-1/2 items-end justify-center"
                            style={{ left: `${iconLeftPct}%` }}
                        >
                            <div
                                className={`flex h-7 w-7 items-center justify-center rounded-xl shadow-lg ring-2 ring-white ${iconBg}`}
                            >
                                <FileText
                                    className="h-3.5 w-3.5 text-white"
                                    strokeWidth={2.4}
                                />
                            </div>
                        </div>

                        {/* Tail — only when the icon sits exactly on a
                            step's marker. Omits itself during transit. */}
                        {isIconOnStep && highlightIdx >= 0 && (
                            <div
                                className={`pointer-events-none absolute -translate-x-1/2 ${tailBg}`}
                                style={{
                                    left: `${iconLeftPct}%`,
                                    top: '-8px',
                                    height: '14px',
                                    width: '2px',
                                }}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

/* ================================================================== */
/*  Small components                                                   */
/* ================================================================== */

function SummaryTile({ label, value, icon: Icon, tone, onClick, active }) {
    const TONES = {
        sky: 'text-sky-700 bg-sky-50',
        red: 'text-red-700 bg-red-50',
        emerald: 'text-emerald-700 bg-emerald-50',
        slate: 'text-slate-700 bg-slate-100',
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-2.5 rounded-lg border bg-white p-3 text-left transition hover:shadow-sm sm:gap-3 sm:p-4 ${
                active
                    ? 'border-slate-900 ring-1 ring-slate-900'
                    : 'border-slate-200'
            }`}
        >
            <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${
                    TONES[tone] ?? TONES.slate
                }`}
            >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
                <p className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
                    {label}
                </p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900 sm:text-2xl">
                    {value.toLocaleString()}
                </p>
            </div>
        </button>
    );
}

function Select({ label, value, onChange, children }) {
    return (
        <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
                {children}
            </select>
        </div>
    );
}

function EmptyState({ scope }) {
    const MESSAGES = {
        active: 'No documents are currently being routed. Everything is clear.',
        completed: 'No completed or cancelled documents match your filters.',
        all: 'No documents match your filters.',
    };

    return (
        <div className="py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">
                {MESSAGES[scope] ?? MESSAGES.all}
            </p>
        </div>
    );
}