import { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
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
    RotateCcw,
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

    const isCancelled = doc.status === 'CANCELLED';
    const isCompleted = doc.status === 'COMPLETED';
    const isFinished = isCompleted || isCancelled;

    // =============================================================
    //  Unified steps array: [origin, ...destinations]
    //  Origin is a synthetic step — the doc always starts there.
    // =============================================================
    const steps = useMemo(() => {
        const originStep = {
            id: '__origin__',
            office: origin,
            sequence: 0,
            is_origin: true,
            received_at: doc.created_at,
            // Origin is "passed" once the first destination has received it
            forwarded_at:
                routes.length > 0 && routes[0].received_at
                    ? doc.created_at
                    : null,
        };
        return [originStep, ...routes];
    }, [origin, routes, doc.created_at]);

    // =============================================================
    //  Locate the current step
    // =============================================================
    const currentIdx = useMemo(() => {
        if (isFinished) return -1;
        if (routes.length === 0) return 0;

        // Look for a destination that was received but not yet forwarded
        const activeIdx = routes.findIndex(
            (r) => r.received_at && !r.forwarded_at
        );
        if (activeIdx >= 0) return activeIdx + 1; // +1 for origin offset

        // Nothing received yet → doc still at origin
        return 0;
    }, [routes, isFinished]);

    const currentStep = currentIdx > 0 ? steps[currentIdx] : null;
    const isOverdue = !isFinished && currentStep?.is_overdue;
    const isReturn = !isFinished && currentStep?.is_return;

    // Counters refer to destinations only (origin isn't a routing step)
    const doneCount = routes.filter((r) => r.forwarded_at).length;
    const total = routes.length;

    return (
        <article
            className={`overflow-hidden rounded-xl border bg-white shadow-sm transition ${
                isOverdue
                    ? 'border-red-200 shadow-red-100/60 ring-1 ring-red-100'
                    : 'border-slate-200'
            }`}
        >
            {/* ========================================================= */}
            {/*  HEADER                                                    */}
            {/* ========================================================= */}
            <div className="flex items-start justify-between gap-3 px-4 pt-3.5 sm:px-5">
                <div className="min-w-0 flex-1">
                    {/* Meta line */}
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

                    {/* Title */}
                    <h3 className="mt-1 truncate text-sm font-semibold text-slate-800 sm:text-base">
                        {doc.title}
                    </h3>

                    {/* ================================================== */}
                    {/*  ORIGIN — prominent, bold                          */}
                    {/* ================================================== */}
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

            {/* ========================================================= */}
            {/*  PROGRESS TRACK                                            */}
            {/* ========================================================= */}
            {steps.length > 0 ? (
                <ProgressTrack
                    steps={steps}
                    currentIdx={currentIdx}
                    isCompleted={isCompleted}
                    isCancelled={isCancelled}
                />
            ) : null}

            {/* ========================================================= */}
            {/*  FOOTER                                                    */}
            {/* ========================================================= */}
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
                                    Math.abs(
                                        currentStep.remaining_seconds
                                    )
                                )}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-slate-600">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                Due in{' '}
                                {formatDuration(
                                    Math.abs(
                                        currentStep.remaining_seconds
                                    )
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

function ProgressTrack({ steps, currentIdx, isCompleted, isCancelled }) {
    const total = steps.length;
    const lastIdx = total - 1;
    const isFinished = isCompleted || isCancelled;
    const hasCurrent = currentIdx >= 0;

    // Position of the moving icon (0–100 % of the track)
    const iconPos = isFinished
        ? 100
        : hasCurrent && total > 1
          ? (currentIdx / (total - 1)) * 100
          : 0;

    const fillPct = isFinished ? 100 : iconPos;

    const currentStep = hasCurrent ? steps[currentIdx] : null;
    const isOverdue = !isFinished && currentStep?.is_overdue;
    const isReturn = !isFinished && currentStep?.is_return;

    /* --- Icon colors --- */
    const iconBg = isCancelled
        ? 'bg-slate-500 shadow-slate-500/40'
        : isCompleted
          ? 'bg-emerald-500 shadow-emerald-500/40'
          : isOverdue
            ? 'bg-red-500 shadow-red-500/40'
            : isReturn
              ? 'bg-amber-500 shadow-amber-500/40'
              : hasCurrent
                ? 'bg-blue-500 shadow-blue-500/40'
                : 'bg-slate-400 shadow-slate-400/40';

    const tailBg = isCancelled
        ? 'bg-slate-500'
        : isCompleted
          ? 'bg-emerald-500'
          : isOverdue
            ? 'bg-red-500'
            : isReturn
              ? 'bg-amber-500'
              : hasCurrent
                ? 'bg-blue-500'
                : 'bg-slate-400';

    /* --- Fill gradient --- */
    const fillGradient = isCancelled
        ? 'bg-gradient-to-r from-emerald-500 to-slate-400'
        : isCompleted
          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
          : isOverdue
            ? 'bg-gradient-to-r from-emerald-500 via-emerald-500 to-red-500'
            : 'bg-gradient-to-r from-emerald-500 to-blue-500';

    return (
        <div className="px-4 pt-14 pb-4 sm:px-5 sm:pt-16">
            <div className="relative flex">
                {/* Track background + fill */}
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

                {/* Steps */}
                {steps.map((step, i) => {
                    const isOrigin = !!step.is_origin;
                    const isEndpoint = !isOrigin && i === lastIdx;
                    const isPassed = !!step.forwarded_at;
                    const isCurrent = !isFinished && i === currentIdx;
                    const stepOverdue = isCurrent && step.is_overdue;
                    const stepReturn = isCurrent && step.is_return;

                    // ---- Marker color ----
                    let markerClass = 'bg-slate-300';
                    if (isPassed || isFinished) {
                        markerClass = 'bg-emerald-500';
                    } else if (isCurrent) {
                        markerClass = stepOverdue
                            ? 'bg-red-500 animate-pulse'
                            : stepReturn
                              ? 'bg-amber-500'
                              : 'bg-blue-500';
                    } else if (isOrigin) {
                        markerClass = 'bg-slate-500';
                    }

                    // Mobile label visibility
                    const showLabelMobile =
                        isOrigin || isEndpoint || isCurrent;

                    return (
                        <div
                            key={step.id}
                            className="relative flex min-w-0 flex-1 flex-col items-center"
                        >
                            {/* ============ Icon badge above marker ============ */}
                            <div className="pointer-events-none absolute -top-9 left-1/2 flex h-8 w-8 -translate-x-1/2 items-end justify-center">
                                {isCurrent ? (
                                    // ---- Current: document icon ----
                                    <div
                                        className={`flex h-7 w-7 items-center justify-center rounded-xl shadow-lg ring-2 ring-white ${iconBg}`}
                                    >
                                        <FileText
                                            className="h-3.5 w-3.5 text-white"
                                            strokeWidth={2.4}
                                        />
                                    </div>
                                ) : isOrigin ? (
                                    // ---- Origin: building icon ----
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-white shadow-md ring-2 ring-white">
                                        <Building2
                                            className="h-3 w-3"
                                            strokeWidth={2.4}
                                        />
                                    </div>
                                ) : isEndpoint ? (
                                    // ---- Endpoint: flag icon ----
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
                                ) : null}
                            </div>

                            {/* Tail from current icon to marker */}
                            {isCurrent && (
                                <div
                                    className={`absolute -top-2 left-1/2 h-2 w-0.5 -translate-x-1/2 ${tailBg}`}
                                />
                            )}

                            {/* ============ Marker dot ============ */}
                            <div
                                className={`h-3 w-3 flex-shrink-0 rounded-full ring-2 ring-white transition-all duration-300 ${markerClass}`}
                                title={`${step.sequence}. ${
                                    step.office?.name ?? '—'
                                }`}
                            />

                            {/* ============ Office name ============ */}
                            <p
                                className={`mt-2 w-full max-w-full truncate text-center text-[10px] leading-tight ${
                                    showLabelMobile ? '' : 'hidden md:block'
                                } ${
                                    isOrigin
                                        ? 'font-semibold text-slate-900'
                                        : isCurrent
                                          ? 'font-medium text-slate-800'
                                          : isPassed || isFinished
                                            ? 'text-slate-500'
                                            : 'text-slate-400'
                                }`}
                                title={step.office?.name ?? ''}
                            >
                                {step.office?.name ?? '—'}
                            </p>

                            {/* ============ Origin / Final chip ============ */}
                            {/* Reserved space so layout doesn't jump */}
                            <span className="mt-0.5 flex h-3.5 items-center justify-center">
                                {isOrigin && (
                                    <span className="hidden rounded bg-slate-700 px-1 py-px text-[8px] font-bold uppercase tracking-wider text-white sm:inline-block">
                                        Origin
                                    </span>
                                )}
                                {isEndpoint && !isCurrent && (
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