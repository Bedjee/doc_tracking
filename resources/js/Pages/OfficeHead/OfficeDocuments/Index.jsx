import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, Eye, Filter, X } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';
import DocumentStatusBadge from '@/Components/Documents/DocumentStatusBadge';
import { formatDuration } from '@/lib/formatDuration';

export default function OfficeDocumentsIndex({ documents, filters, statuses }) {
    const [form, setForm] = useState({
        status: filters.status ?? '',
        overdue_only: !!filters.overdue_only,
    });

    function apply(overrides = {}) {
        const merged = { ...form, ...overrides };
        const params = {};
        Object.keys(merged).forEach((k) => {
            if (merged[k] === '' || merged[k] === false || merged[k] === undefined) return;
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
        router.get(route('head.documents.index'));
    }

    const hasFilters = form.status || form.overdue_only;

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                        Monitor Office Documents
                    </h2>
                    <p className="text-xs text-slate-500">
                        Every document your office has handled, with processing times
                    </p>
                </div>
            }
        >
            <Head title="Monitor Documents" />

            <div className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
                {/* Filters */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            apply();
                        }}
                        className="flex flex-wrap items-end gap-3"
                    >
                        <div className="min-w-[180px] flex-1">
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Status
                            </label>
                            <select
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                            >
                                <option value="">All statuses</option>
                                {statuses.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <label className="flex cursor-pointer select-none items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={form.overdue_only}
                                onChange={(e) => setForm({ ...form, overdue_only: e.target.checked })}
                                className="rounded border-slate-300"
                            />
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                            Overdue only
                        </label>

                        <Button type="submit" variant="secondary">
                            <Filter className="h-4 w-4" /> Apply
                        </Button>
                        {hasFilters && (
                            <Button type="button" variant="ghost" onClick={reset}>
                                <X className="h-4 w-4" /> Clear
                            </Button>
                        )}
                    </form>
                </div>

                {/* Table (desktop) */}
                <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Tracking No.</th>
                                <th className="px-4 py-3 font-semibold">Title</th>
                                <th className="px-4 py-3 font-semibold">Status</th>
                                <th className="px-4 py-3 font-semibold">Current</th>
                                <th className="px-4 py-3 font-semibold">Next</th>
                                <th className="px-4 py-3 font-semibold">Processing Time</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {documents.data.map((doc) => {
                                const step = doc.routes?.[0];
                                const remaining = step?.remaining_seconds;
                                const overdue = step?.is_overdue;

                                return (
                                    <tr key={doc.id} className="transition hover:bg-slate-50/60">
                                        <td className="px-4 py-3 font-mono text-xs text-slate-700">
                                            {doc.tracking_number}
                                        </td>
                                        <td className="max-w-xs truncate px-4 py-3 font-medium text-slate-800">
                                            {doc.title}
                                        </td>
                                        <td className="px-4 py-3">
                                            <DocumentStatusBadge status={doc.status} />
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {doc.current_office?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {doc.current_destination?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {step?.received_at ? (
                                                <span
                                                    className={`text-xs font-semibold tabular-nums ${
                                                        overdue ? 'text-red-600' : 'text-slate-700'
                                                    }`}
                                                >
                                                    {overdue ? 'Overdue by ' : 'Remaining: '}
                                                    {formatDuration(Math.abs(remaining))}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400">Not yet received</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={route('documents.show', doc.id)}
                                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                                            >
                                                <Eye className="h-3.5 w-3.5" /> View
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {documents.data.length === 0 && (
                        <div className="py-12 text-center text-sm text-slate-500">
                            No documents match your filters.
                        </div>
                    )}
                </div>

                {/* Cards (mobile) */}
                <div className="space-y-3 lg:hidden">
                    {documents.data.map((doc) => {
                        const step = doc.routes?.[0];
                        const overdue = step?.is_overdue;

                        return (
                            <Link
                                key={doc.id}
                                href={route('documents.show', doc.id)}
                                className="block rounded-xl border border-slate-200 bg-white p-4 transition active:bg-slate-50"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-slate-800">{doc.title}</p>
                                        <p className="mt-0.5 font-mono text-xs text-slate-500">
                                            {doc.tracking_number}
                                        </p>
                                    </div>
                                    <DocumentStatusBadge status={doc.status} />
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                                    <span>
                                        Current:{' '}
                                        <span className="text-slate-700">
                                            {doc.current_office?.name ?? '—'}
                                        </span>
                                    </span>
                                    <span>
                                        Next:{' '}
                                        <span className="text-slate-700">
                                            {doc.current_destination?.name ?? '—'}
                                        </span>
                                    </span>
                                    {step?.received_at && (
                                        <span className={`col-span-2 font-semibold ${
                                            overdue ? 'text-red-600' : 'text-slate-700'
                                        }`}>
                                            {overdue ? 'Overdue by ' : 'Remaining: '}
                                            {formatDuration(Math.abs(step.remaining_seconds))}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                    {documents.data.length === 0 && (
                        <div className="rounded-xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-500">
                            No documents match your filters.
                        </div>
                    )}
                </div>

                {documents.links?.length > 3 && (
                    <nav className="flex flex-wrap justify-center gap-1">
                        {documents.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                preserveScroll
                                className={`rounded-md px-3 py-1.5 text-sm transition ${
                                    link.active
                                        ? 'bg-slate-900 text-white'
                                        : link.url
                                            ? 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                                            : 'cursor-not-allowed bg-slate-50 text-slate-300'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </nav>
                )}
            </div>
        </AuthenticatedLayout>
    );
}