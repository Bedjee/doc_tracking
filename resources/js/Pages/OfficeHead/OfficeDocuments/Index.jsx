import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Eye,
    FileText,
    Filter,
    Route,
    X,
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';
import DocumentStatusBadge from '@/Components/Documents/DocumentStatusBadge';
import { formatDuration } from '@/lib/formatDuration';

export default function OfficeDocumentsIndex({
    documents,
    filters,
    tab = 'mine',
    tabCounts = { mine: 0, routed: 0 },
    statuses,
    myOffice,
}) {
    const [form, setForm] = useState({
        status: filters.status ?? '',
        overdue_only: !!filters.overdue_only,
    });

    function apply(overrides = {}) {
        const merged = { ...form, ...overrides };
        const params = { tab };
        Object.keys(merged).forEach((k) => {
            if (
                merged[k] === '' ||
                merged[k] === false ||
                merged[k] === undefined
            )
                return;
            params[k] = merged[k];
        });
        router.get(route('head.documents.index'), params, {
            preserveState: true,
            replace: true,
        });
    }

    function reset() {
        const empty = { status: '', overdue_only: false };
        setForm(empty);
        router.get(route('head.documents.index'), { tab });
    }

    function switchTab(next) {
        if (next === tab) return;
        setForm({ status: '', overdue_only: false });
        router.get(
            route('head.documents.index'),
            { tab: next },
            { preserveState: false, replace: true }
        );
    }

    const hasFilters = form.status || form.overdue_only;
    const showOrigin = tab === 'routed'; // Origin is always "my office" on the mine tab

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-slate-800 sm:text-lg">
                            Office Documents
                        </h2>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                            {myOffice?.name
                                ? `Documents handled by ${myOffice.name}`
                                : 'Documents handled by your office'}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Office Documents" />

            <div className="mx-auto max-w-[1400px] space-y-3 px-3 py-3 sm:space-y-4 sm:px-5 sm:py-4 lg:px-6">
                {/* ---------- Tabs ---------- */}
                <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
                    <TabButton
                        active={tab === 'mine'}
                        onClick={() => switchTab('mine')}
                        icon={FileText}
                        label="Registered by My Office"
                        shortLabel="My Office"
                        count={tabCounts.mine ?? 0}
                    />
                    <TabButton
                        active={tab === 'routed'}
                        onClick={() => switchTab('routed')}
                        icon={Route}
                        label="Routed Through My Office"
                        shortLabel="Routed"
                        count={tabCounts.routed ?? 0}
                    />
                </div>

                {/* ---------- Filters ---------- */}
                <div className="rounded-lg border border-slate-200 bg-white p-2.5 sm:p-3">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            apply();
                        }}
                        className="flex flex-wrap items-end gap-2"
                    >
                        <div className="min-w-[150px] flex-1">
                            <label className="mb-1 block text-[11px] font-medium text-slate-600">
                                Status
                            </label>
                            <select
                                value={form.status}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        status: e.target.value,
                                    })
                                }
                                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-[13px] focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            >
                                <option value="">All statuses</option>
                                {statuses.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <label className="flex cursor-pointer select-none items-center gap-2 rounded-md border border-slate-300 px-2.5 py-1.5 text-[13px] text-slate-700">
                            <input
                                type="checkbox"
                                checked={form.overdue_only}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        overdue_only: e.target.checked,
                                    })
                                }
                                className="rounded border-slate-300"
                            />
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                            Overdue only
                        </label>

                        <Button type="submit" variant="secondary" size="sm">
                            <Filter className="h-3.5 w-3.5" /> Apply
                        </Button>
                        {hasFilters && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={reset}
                            >
                                <X className="h-3.5 w-3.5" /> Clear
                            </Button>
                        )}
                    </form>
                </div>

                {/* ---------- Table (desktop) ---------- */}
                <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white lg:block">
                    <table className="w-full table-fixed text-left text-[12px]">
                        {/* Column widths — compact but readable */}
                        <colgroup>
                            <col style={{ width: '130px' }} />
                            {/* Title — flexible */}
                            <col />
                            {showOrigin && <col style={{ width: '110px' }} />}
                            <col style={{ width: '90px' }} />
                            <col style={{ width: '110px' }} />
                            <col style={{ width: '110px' }} />
                            <col style={{ width: '110px' }} />
                            <col style={{ width: '60px' }} />
                        </colgroup>
                        <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-2 py-2 font-semibold">
                                    Tracking No.
                                </th>
                                <th className="px-2 py-2 font-semibold">
                                    Title
                                </th>
                                {showOrigin && (
                                    <th className="px-2 py-2 font-semibold">
                                        Origin
                                    </th>
                                )}
                                <th className="px-2 py-2 font-semibold">
                                    Status
                                </th>
                                <th className="px-2 py-2 font-semibold">
                                    Current
                                </th>
                                <th className="px-2 py-2 font-semibold">
                                    Next
                                </th>
                                <th className="px-2 py-2 font-semibold">
                                    Time
                                </th>
                                <th className="px-2 py-2 text-right font-semibold">
                                    &nbsp;
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {documents.data.map((doc) => {
                                const step = doc.routes?.[0];
                                const remaining = step?.remaining_seconds;
                                const overdue = step?.is_overdue;

                                return (
                                    <tr
                                        key={doc.id}
                                        className="transition hover:bg-slate-50/60"
                                    >
                                        <td className="truncate px-2 py-2 font-mono text-[11px] text-slate-700">
                                            {doc.tracking_number}
                                        </td>
                                        <td className="truncate px-2 py-2 font-medium text-slate-800">
                                            {doc.title}
                                        </td>
                                        {showOrigin && (
                                            <td className="truncate px-2 py-2 text-slate-600">
                                                {doc.originating_office
                                                    ?.name ?? '—'}
                                            </td>
                                        )}
                                        <td className="px-2 py-2">
                                            <DocumentStatusBadge
                                                status={doc.status}
                                            />
                                        </td>
                                        <td className="truncate px-2 py-2 text-slate-600">
                                            {doc.current_office?.name ?? '—'}
                                        </td>
                                        <td className="truncate px-2 py-2 text-slate-600">
                                            {doc.current_destination?.name ??
                                                '—'}
                                        </td>
                                        <td className="truncate px-2 py-2">
                                            {step?.received_at ? (
                                                <span
                                                    className={`text-[11px] font-semibold tabular-nums ${
                                                        overdue
                                                            ? 'text-red-600'
                                                            : 'text-slate-700'
                                                    }`}
                                                >
                                                    {overdue
                                                        ? 'Overdue by '
                                                        : 'Remaining: '}
                                                    {formatDuration(
                                                        Math.abs(remaining)
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-slate-400">
                                                    Not yet received
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-2 py-2 text-right">
                                            <Link
                                                href={route(
                                                    'documents.show',
                                                    doc.id
                                                )}
                                                className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                                                title="View document"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {documents.data.length === 0 && (
                        <EmptyState tab={tab} myOffice={myOffice} />
                    )}
                </div>

                {/* ---------- Cards (mobile) ---------- */}
                <div className="space-y-3 lg:hidden">
                    {documents.data.map((doc) => {
                        const step = doc.routes?.[0];
                        const overdue = step?.is_overdue;

                        return (
                            <Link
                                key={doc.id}
                                href={route('documents.show', doc.id)}
                                className="block rounded-xl border border-slate-200 bg-white p-3.5 transition active:bg-slate-50"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-[13px] font-medium text-slate-800">
                                            {doc.title}
                                        </p>
                                        <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                                            {doc.tracking_number}
                                        </p>
                                    </div>
                                    <DocumentStatusBadge
                                        status={doc.status}
                                    />
                                </div>
                                <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px] text-slate-500">
                                    {showOrigin && (
                                        <span className="truncate">
                                            Origin:{' '}
                                            <span className="text-slate-700">
                                                {doc.originating_office
                                                    ?.name ?? '—'}
                                            </span>
                                        </span>
                                    )}
                                    <span className="truncate">
                                        Current:{' '}
                                        <span className="text-slate-700">
                                            {doc.current_office?.name ?? '—'}
                                        </span>
                                    </span>
                                    <span className="col-span-2 truncate">
                                        Next:{' '}
                                        <span className="text-slate-700">
                                            {doc.current_destination?.name ??
                                                '—'}
                                        </span>
                                    </span>
                                    {step?.received_at && (
                                        <span
                                            className={`col-span-2 font-semibold ${
                                                overdue
                                                    ? 'text-red-600'
                                                    : 'text-slate-700'
                                            }`}
                                        >
                                            {overdue
                                                ? 'Overdue by '
                                                : 'Remaining: '}
                                            {formatDuration(
                                                Math.abs(
                                                    step.remaining_seconds
                                                )
                                            )}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                    {documents.data.length === 0 && (
                        <div className="rounded-xl border border-slate-200 bg-white">
                            <EmptyState tab={tab} myOffice={myOffice} />
                        </div>
                    )}
                </div>

                {/* ---------- Pagination ---------- */}
                {documents.links?.length > 3 && (
                    <nav className="flex flex-wrap justify-center gap-1">
                        {documents.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                preserveScroll
                                className={`rounded-md px-2.5 py-1 text-xs transition ${
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
/*  Tab button                                                        */
/* ================================================================== */

function TabButton({ active, onClick, icon: Icon, label, shortLabel, count }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition sm:gap-2 sm:px-3 sm:py-2 sm:text-sm ${
                active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
            }`}
        >
            <Icon className="h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4" />
            <span className="hidden truncate sm:inline">{label}</span>
            <span className="truncate sm:hidden">{shortLabel}</span>
            <span
                className={`ml-0.5 inline-flex h-4 min-w-[18px] flex-shrink-0 items-center justify-center rounded-full px-1 text-[9px] font-bold tabular-nums ${
                    active
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                }`}
            >
                {count > 99 ? '99+' : count}
            </span>
        </button>
    );
}

/* ================================================================== */
/*  Empty state                                                       */
/* ================================================================== */

function EmptyState({ tab, myOffice }) {
    const officeName = myOffice?.name ?? 'your office';

    return (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                {tab === 'mine' ? (
                    <FileText className="h-4 w-4" />
                ) : (
                    <Route className="h-4 w-4" />
                )}
            </div>
            {tab === 'mine' ? (
                <>
                    <p className="text-sm font-medium text-slate-700">
                        No documents registered by {officeName} match your
                        filters.
                    </p>
                    <p className="text-[11px] text-slate-500">
                        Register a new document to see it here.
                    </p>
                </>
            ) : (
                <>
                    <p className="text-sm font-medium text-slate-700">
                        No documents are currently routed through{' '}
                        {officeName}.
                    </p>
                    <p className="text-[11px] text-slate-500">
                        When another office routes a document to you, it will
                        appear here.
                    </p>
                </>
            )}
        </div>
    );
}