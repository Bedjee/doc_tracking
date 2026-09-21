import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Eye,
    Filter,
    Plus,
    ScanLine,
    Search,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';
import DocumentStatusBadge from '@/Components/Documents/DocumentStatusBadge';

export default function Index({ documents, filters, offices, types, statuses }) {
    const [form, setForm] = useState({
        search: filters.search ?? '',
        status: filters.status ?? '',
        document_type_id: filters.document_type_id ?? '',
        originating_office_id: filters.originating_office_id ?? '',
        destination_office_id: filters.destination_office_id ?? '',
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        scope: filters.scope ?? '',
    });
    const [showFilters, setShowFilters] = useState(false);

    function apply(overrides = {}) {
        const params = { ...form, ...overrides };
        Object.keys(params).forEach(
            (k) => params[k] === '' && delete params[k]
        );
        router.get(route('documents.index'), params, {
            preserveState: true,
            replace: true,
        });
    }

    function reset() {
        const empty = Object.fromEntries(
            Object.keys(form).map((k) => [k, ''])
        );
        setForm(empty);
        router.get(route('documents.index'));
    }

    const advancedFilterKeys = [
        'status',
        'document_type_id',
        'originating_office_id',
        'destination_office_id',
        'date_from',
        'date_to',
        'scope',
    ];
    const activeAdvancedCount = advancedFilterKeys.filter(
        (k) => form[k]
    ).length;
    const hasFilters = Object.values(form).some(Boolean);

    // Shared input style — tighter, denser
    const inputClass =
        'w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10';
    const selectClass = inputClass;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-slate-800 sm:text-base">
                            Documents
                        </h2>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                            {documents.total ?? documents.data.length}{' '}
                            {documents.total === 1 ? 'record' : 'records'}
                        </p>
                    </div>
                    <div className="flex flex-shrink-0 gap-2">
                        <Button
                            variant="secondary"
                            onClick={() =>
                                router.visit(route('scan.index'))
                            }
                            aria-label="Scan"
                        >
                            <ScanLine className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Scan</span>
                        </Button>
                        <Button
                            onClick={() =>
                                router.visit(route('documents.create'))
                            }
                            aria-label="New Document"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">
                                New Document
                            </span>
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title="Documents" />

            <div className="mx-auto max-w-[1400px] space-y-2.5 px-3 py-3 sm:px-5 sm:py-4 lg:px-6">
                {/* ---------- Compact toolbar (mobile) ---------- */}
                <div className="lg:hidden">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            apply();
                        }}
                        className="space-y-2"
                    >
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={form.search}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            search: e.target.value,
                                        })
                                    }
                                    placeholder="Search documents"
                                    className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-8 pr-2.5 text-[13px] focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowFilters((v) => !v)}
                                className={`relative flex-shrink-0 rounded-md border px-2.5 transition ${
                                    showFilters || activeAdvancedCount > 0
                                        ? 'border-slate-900 bg-slate-900 text-white'
                                        : 'border-slate-300 bg-white text-slate-600'
                                }`}
                                aria-label="Toggle filters"
                                aria-expanded={showFilters}
                            >
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                {activeAdvancedCount > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-semibold text-white">
                                        {activeAdvancedCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {showFilters && (
                            <div className="space-y-2 rounded-md border border-slate-200 bg-white p-2.5">
                                <div className="grid grid-cols-2 gap-2">
                                    <Select
                                        label="Status"
                                        value={form.status}
                                        onChange={(v) =>
                                            setForm({ ...form, status: v })
                                        }
                                        className={selectClass}
                                    >
                                        <option value="">
                                            All statuses
                                        </option>
                                        {statuses.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Type"
                                        value={form.document_type_id}
                                        onChange={(v) =>
                                            setForm({
                                                ...form,
                                                document_type_id: v,
                                            })
                                        }
                                        className={selectClass}
                                    >
                                        <option value="">All types</option>
                                        {types.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </Select>
                                </div>

                                <Select
                                    label="Originating Office"
                                    value={form.originating_office_id}
                                    onChange={(v) =>
                                        setForm({
                                            ...form,
                                            originating_office_id: v,
                                        })
                                    }
                                    className={selectClass}
                                >
                                    <option value="">Any</option>
                                    {offices.map((o) => (
                                        <option key={o.id} value={o.id}>
                                            {o.name}
                                        </option>
                                    ))}
                                </Select>

                                <Select
                                    label="Destination Office"
                                    value={form.destination_office_id}
                                    onChange={(v) =>
                                        setForm({
                                            ...form,
                                            destination_office_id: v,
                                        })
                                    }
                                    className={selectClass}
                                >
                                    <option value="">Any</option>
                                    {offices.map((o) => (
                                        <option key={o.id} value={o.id}>
                                            {o.name}
                                        </option>
                                    ))}
                                </Select>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="mb-1 block text-[10px] font-medium text-slate-600">
                                            From
                                        </label>
                                        <input
                                            type="date"
                                            value={form.date_from}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    date_from:
                                                        e.target.value,
                                                })
                                            }
                                            className={selectClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[10px] font-medium text-slate-600">
                                            To
                                        </label>
                                        <input
                                            type="date"
                                            value={form.date_to}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    date_to:
                                                        e.target.value,
                                                })
                                            }
                                            className={selectClass}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-0.5">
                                    <Button
                                        type="submit"
                                        variant="secondary"
                                        className="flex-1"
                                    >
                                        <Filter className="h-3.5 w-3.5" />
                                        Apply
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
                                            <X className="h-3.5 w-3.5" />
                                            Clear
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* ---------- Full filter panel (desktop) ---------- */}
                <div className="hidden rounded-lg border border-slate-200 bg-white p-3 lg:block">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            apply();
                        }}
                        className="grid gap-2 lg:grid-cols-8"
                    >
                        <div className="lg:col-span-2">
                            <label className="mb-1 block text-[11px] font-medium text-slate-600">
                                Search
                            </label>
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={form.search}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            search: e.target.value,
                                        })
                                    }
                                    placeholder="Tracking no., title, or reference"
                                    className="w-full rounded-md border border-slate-300 py-1.5 pl-8 pr-2.5 text-[13px] focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                />
                            </div>
                        </div>

                        <Select
                            label="Status"
                            value={form.status}
                            onChange={(v) =>
                                setForm({ ...form, status: v })
                            }
                            className={selectClass}
                        >
                            <option value="">All statuses</option>
                            {statuses.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </Select>

                        <Select
                            label="Type"
                            value={form.document_type_id}
                            onChange={(v) =>
                                setForm({
                                    ...form,
                                    document_type_id: v,
                                })
                            }
                            className={selectClass}
                        >
                            <option value="">All types</option>
                            {types.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </Select>

                        <Select
                            label="Origin"
                            value={form.originating_office_id}
                            onChange={(v) =>
                                setForm({
                                    ...form,
                                    originating_office_id: v,
                                })
                            }
                            className={selectClass}
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
                            className={selectClass}
                        >
                            <option value="">Any</option>
                            {offices.map((o) => (
                                <option key={o.id} value={o.id}>
                                    {o.name}
                                </option>
                            ))}
                        </Select>

                        <div>
                            <label className="mb-1 block text-[11px] font-medium text-slate-600">
                                From
                            </label>
                            <input
                                type="date"
                                value={form.date_from}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        date_from: e.target.value,
                                    })
                                }
                                className={selectClass}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-[11px] font-medium text-slate-600">
                                To
                            </label>
                            <input
                                type="date"
                                value={form.date_to}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        date_to: e.target.value,
                                    })
                                }
                                className={selectClass}
                            />
                        </div>

                        <div className="flex items-end gap-2 lg:col-span-8">
                            <Button type="submit" variant="secondary">
                                <Filter className="h-3.5 w-3.5" /> Apply
                            </Button>
                            {hasFilters && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={reset}
                                >
                                    <X className="h-3.5 w-3.5" /> Clear
                                </Button>
                            )}
                        </div>
                    </form>
                </div>

                {/* ---------- Table (desktop) ---------- */}
                <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white lg:block">
                    <table className="w-full text-left text-[13px]">
                        <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-3 py-2 font-semibold">
                                    Tracking No.
                                </th>
                                <th className="px-3 py-2 font-semibold">
                                    Title
                                </th>
                                <th className="px-3 py-2 font-semibold">
                                    Origin
                                </th>
                                <th className="px-3 py-2 font-semibold">
                                    Current
                                </th>
                                <th className="px-3 py-2 font-semibold">
                                    Destination
                                </th>
                                <th className="px-3 py-2 font-semibold">
                                    Status
                                </th>
                                <th className="px-3 py-2" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {documents.data.map((doc) => (
                                <tr
                                    key={doc.id}
                                    className="transition hover:bg-slate-50/60"
                                >
                                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-slate-700">
                                        {doc.tracking_number}
                                    </td>
                                    <td className="max-w-[280px] truncate px-3 py-2 font-medium text-slate-800">
                                        {doc.title}
                                    </td>
                                    <td className="max-w-[160px] truncate px-3 py-2 text-slate-600">
                                        {doc.originating_office?.name ?? '—'}
                                    </td>
                                    <td className="max-w-[160px] truncate px-3 py-2 text-slate-600">
                                        {doc.current_office?.name ?? '—'}
                                    </td>
                                    <td className="max-w-[160px] truncate px-3 py-2 text-slate-600">
                                        {doc.current_destination?.name ?? '—'}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2">
                                        <DocumentStatusBadge
                                            status={doc.status}
                                        />
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-right">
                                        <Link
                                            href={route(
                                                'documents.show',
                                                doc.id
                                            )}
                                            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100"
                                        >
                                            <Eye className="h-3 w-3" /> View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {documents.data.length === 0 && <Empty />}
                </div>

                {/* ---------- Compact cards (mobile) ---------- */}
                <div className="space-y-1.5 lg:hidden">
                    {documents.data.map((doc) => (
                        <Link
                            key={doc.id}
                            href={route('documents.show', doc.id)}
                            className="block rounded-md border border-slate-200 bg-white p-2.5 transition active:bg-slate-50"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13px] font-medium text-slate-800">
                                        {doc.title}
                                    </p>
                                    <p className="mt-0.5 truncate font-mono text-[10px] text-slate-500">
                                        {doc.tracking_number}
                                    </p>
                                </div>
                                <div className="flex-shrink-0">
                                    <DocumentStatusBadge
                                        status={doc.status}
                                    />
                                </div>
                            </div>

                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
                                {doc.originating_office?.name && (
                                    <span className="truncate">
                                        From{' '}
                                        <span className="text-slate-700">
                                            {doc.originating_office.name}
                                        </span>
                                    </span>
                                )}
                                {doc.current_destination?.name && (
                                    <span className="truncate">
                                        To{' '}
                                        <span className="text-slate-700">
                                            {doc.current_destination.name}
                                        </span>
                                    </span>
                                )}
                            </div>
                        </Link>
                    ))}
                    {documents.data.length === 0 && (
                        <div className="rounded-md border border-slate-200 bg-white">
                            <Empty />
                        </div>
                    )}
                </div>

                {/* ---------- Pagination ---------- */}
                {documents.links?.length > 3 && (
                    <>
                        {/* Desktop: full paginator */}
                        <nav className="hidden flex-wrap justify-center gap-1 sm:flex">
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

                        {/* Mobile: prev / next only */}
                        <nav className="flex items-center justify-between gap-2 sm:hidden">
                            <PagerButton
                                link={documents.links[0]}
                                direction="prev"
                            />
                            <span className="text-[11px] text-slate-500">
                                Page {documents.current_page ?? 1} of{' '}
                                {documents.last_page ?? 1}
                            </span>
                            <PagerButton
                                link={
                                    documents.links[
                                        documents.links.length - 1
                                    ]
                                }
                                direction="next"
                            />
                        </nav>
                    </>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function PagerButton({ link, direction }) {
    const isDisabled = !link?.url;
    const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;
    const label = direction === 'prev' ? 'Prev' : 'Next';

    if (isDisabled) {
        return (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                {direction === 'prev' && <Icon className="h-3 w-3" />}
                {label}
                {direction === 'next' && <Icon className="h-3 w-3" />}
            </span>
        );
    }

    return (
        <Link
            href={link.url}
            preserveScroll
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
        >
            {direction === 'prev' && <Icon className="h-3 w-3" />}
            {label}
            {direction === 'next' && <Icon className="h-3 w-3" />}
        </Link>
    );
}

function Select({ label, value, onChange, children, className = '' }) {
    return (
        <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-600">
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={
                    className ||
                    'w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-[13px] focus:border-slate-900 focus:outline-none'
                }
            >
                {children}
            </select>
        </div>
    );
}

function Empty() {
    return (
        <div className="py-8 text-center">
            <p className="text-[13px] text-slate-500">
                No documents match your filters.
            </p>
        </div>
    );
}