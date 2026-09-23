import { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Clock,
    FileText,
    History,
    Info,
    Printer,
    Search,
    Undo2,
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';
import Modal from '@/Components/UI/Modal';
import DocumentStatusBadge from '@/Components/Documents/DocumentStatusBadge';
import RouteTimeline from '@/Components/Documents/RouteTimeline';
import DocumentQr from '@/Components/Documents/DocumentQr';
import ProcessingTimeCard from '@/Components/Documents/ProcessingTimeCard';
import LiveElapsed from '@/Components/Documents/LiveElapsed';
import { useToast } from '@/Components/UI/Toast';
import { formatDuration } from '@/lib/formatDuration';

const MOBILE_TABS = [
    { id: 'details', label: 'Details' },
    { id: 'route', label: 'Route' },
    { id: 'history', label: 'History' },
    { id: 'actions', label: 'Actions' },
];

export default function Show({
    document,
    qrPayload,
    can = {},
    offices = [],
}) {
    const toast = useToast();
    const [modal, setModal] = useState(null);
    const [tab, setTab] = useState('details');
    const [remarks, setRemarks] = useState('');
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);

    // Return-destination state
    const [returnTarget, setReturnTarget] = useState('previous'); // 'previous' | 'other'
    const [returnOtherOfficeId, setReturnOtherOfficeId] = useState('');

    const lastEvent = document.events?.[0];
    const isCompleted = !!document.completed_at;

    /* -------------------------------------------------------------- */
    /*  Determine the office that forwarded this document to us        */
    /* -------------------------------------------------------------- */
    const previousOffice = useMemo(() => {
        const routes = document.routes ?? [];
        if (routes.length < 2) return null;

        const sorted = [...routes].sort(
            (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)
        );

        // Preferred: the step our office currently holds (RECEIVED, not forwarded)
        let currentIdx = sorted.findIndex(
            (r) =>
                r.office?.id === document.current_office_id &&
                r.status === 'RECEIVED' &&
                !r.forwarded_at
        );

        // Fallback: the highest-sequence step still RECEIVED
        if (currentIdx === -1) {
            for (let i = sorted.length - 1; i >= 0; i--) {
                if (sorted[i].status === 'RECEIVED' && !sorted[i].forwarded_at) {
                    currentIdx = i;
                    break;
                }
            }
        }

        if (currentIdx <= 0) return null;

        return sorted[currentIdx - 1]?.office ?? null;
    }, [document.routes, document.current_office_id]);

    // Offices excluding the previously-suggested one — no point in listing
    // it twice.
    const otherOffices = useMemo(
        () =>
            offices.filter(
                (o) =>
                    !previousOffice ||
                    Number(o.id) !== Number(previousOffice.id)
            ),
        [offices, previousOffice]
    );

    const effectiveReturnOfficeId =
        returnTarget === 'previous'
            ? previousOffice?.id
            : returnOtherOfficeId;

    const returnValid =
        !!effectiveReturnOfficeId && reason.trim().length > 0;

    /* -------------------------------------------------------------- */
    /*  Actions                                                        */
    /* -------------------------------------------------------------- */

    function post(url, payload) {
        setBusy(true);
        router.post(url, payload, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Action recorded.');
                setModal(null);
                setRemarks('');
                setReason('');
                setReturnOtherOfficeId('');
            },
            onError: (e) =>
                toast.error(Object.values(e)[0] ?? 'Action failed.'),
            onFinish: () => setBusy(false),
        });
    }

    function openReturn() {
        setReturnTarget(previousOffice ? 'previous' : 'other');
        setReturnOtherOfficeId('');
        setReason('');
        setRemarks('');
        setModal('return');
    }

    function submitReturn() {
        if (!returnValid) {
            if (!effectiveReturnOfficeId) {
                toast.error('Please select a return destination.');
            } else if (!reason.trim()) {
                toast.error('Please provide a reason for the return.');
            }
            return;
        }

        setBusy(true);
        router.post(
            route('documents.return', document.id),
            {
                return_office_id: effectiveReturnOfficeId,
                reason: reason.trim(),
                remarks: remarks.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.warning('Document returned.');
                    setModal(null);
                    setReason('');
                    setRemarks('');
                    setReturnOtherOfficeId('');
                },
                onError: (e) =>
                    toast.error(Object.values(e)[0] ?? 'Unable to return.'),
                onFinish: () => setBusy(false),
            }
        );
    }

    const timingRoutes = (document.routes ?? []).filter(
        (r) => r.received_at || r.status === 'CURRENT'
    );

    const hasActions = can.receive || can.forward || can.return || can.cancel;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2 sm:gap-3">
                    <Link
                        href={route('documents.index')}
                        className="flex-shrink-0 rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100"
                        aria-label="Back"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div className="min-w-0 flex-1">
                        <h2 className="truncate text-sm font-semibold text-slate-800 sm:text-lg">
                            {document.title}
                        </h2>
                        <p className="truncate font-mono text-[10px] text-slate-500 sm:text-xs">
                            {document.tracking_number}
                        </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                        {document.return_to_sender && !isCompleted && (
                            <span className="hidden items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 ring-1 ring-inset ring-blue-200 sm:inline-flex">
                                <Undo2 className="h-3 w-3" />
                                Return to Sender
                            </span>
                        )}
                        <DocumentStatusBadge status={document.status} />
                    </div>
                </div>
            }
        >
            <Head title={document.tracking_number} />

            {/* ==================== MOBILE ==================== */}
            <div className="lg:hidden">
                <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
                    <nav className="flex gap-1 overflow-x-auto px-3 py-2" role="tablist">
                        {MOBILE_TABS.map((t) => (
                            <button
                                key={t.id}
                                role="tab"
                                aria-selected={tab === t.id}
                                onClick={() => setTab(t.id)}
                                className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                                    tab === t.id
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="space-y-3 px-3 py-3">
                    {tab === 'details' && (
                        <>
                            <DocumentInfoCard document={document} />
                            <CurrentStatusCard
                                document={document}
                                lastEvent={lastEvent}
                                frozen={isCompleted}
                            />
                        </>
                    )}

                    {tab === 'route' && (
                        <>
                            <RouteCard document={document} frozen={isCompleted} />
                            <ProcessingTimeCardSection
                                timingRoutes={timingRoutes}
                                frozen={isCompleted}
                            />
                        </>
                    )}

                    {tab === 'history' && <ActivityCard document={document} />}

                    {tab === 'actions' && (
                        <>
                            <QrCard qrPayload={qrPayload} />
                            {hasActions && (
                                <ActionsCard
                                    can={can}
                                    onOpen={(m) => {
                                        if (m === 'return') openReturn();
                                        else setModal(m);
                                    }}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ==================== DESKTOP ==================== */}
            <div className="hidden lg:block">
                <div className="mx-auto grid max-w-7xl gap-4 px-6 py-5 lg:grid-cols-3 lg:px-8">
                    <div className="space-y-4 lg:col-span-2">
                        <DocumentInfoCard document={document} />
                        <CurrentStatusCard
                            document={document}
                            lastEvent={lastEvent}
                            frozen={isCompleted}
                        />
                        <RouteCard document={document} frozen={isCompleted} />
                        <ActivityCard document={document} />
                    </div>

                    <div className="space-y-4">
                        <QrCard qrPayload={qrPayload} />
                        {hasActions && (
                            <ActionsCard
                                can={can}
                                onOpen={(m) => {
                                    if (m === 'return') openReturn();
                                    else setModal(m);
                                }}
                            />
                        )}
                        <ProcessingTimeCardSection
                            timingRoutes={timingRoutes}
                            frozen={isCompleted}
                        />
                    </div>
                </div>
            </div>

            {/* ---------- Receive modal ---------- */}
            <Modal
                show={modal === 'receive'}
                onClose={() => setModal(null)}
                title="Receive document"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModal(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="success"
                            loading={busy}
                            onClick={() =>
                                post(route('documents.receive', document.id), { remarks })
                            }
                        >
                            Confirm receive
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Confirm that the physical document has arrived at{' '}
                    {document.current_destination?.name}.
                </p>
                {document.processing_days_per_office && (
                    <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                            Processing window
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-sky-900">
                            {document.processing_days_per_office} day
                            {document.processing_days_per_office > 1 ? 's' : ''} for{' '}
                            {document.transaction_category?.name ?? 'this document'}
                        </p>
                        <p className="mt-0.5 text-[11px] text-sky-700">
                            The countdown begins the moment you confirm receipt.
                        </p>
                    </div>
                )}
                <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Remarks (optional)"
                    className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </Modal>

            {/* ---------- Forward modal ---------- */}
            <Modal
                show={modal === 'forward'}
                onClose={() => setModal(null)}
                title="Forward document"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModal(null)}>
                            Cancel
                        </Button>
                        <Button
                            loading={busy}
                            onClick={() =>
                                post(route('documents.forward', document.id), { remarks })
                            }
                        >
                            Confirm forward
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    The document will move to the next office in its fixed route.
                </p>
                <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Remarks (optional)"
                    className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </Modal>

            {/* ---------- Return modal ---------- */}
            <Modal
                show={modal === 'return'}
                onClose={() => setModal(null)}
                title="Return document"
                maxWidth="max-w-md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModal(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="warning"
                            loading={busy}
                            disabled={!returnValid}
                            onClick={submitReturn}
                        >
                            Return
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    {/* Document summary — single line */}
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <FileText className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-800">
                                {document.title}
                            </p>
                            <p className="truncate font-mono text-[10px] text-slate-500">
                                {document.tracking_number}
                            </p>
                        </div>
                    </div>

                    {/* Return destination */}
                    <div>
                        <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                Return to
                            </span>
                            <span className="text-[10px] text-red-500">*</span>
                        </div>

                        <div className="space-y-1.5">
                            {previousOffice && (
                                <ReturnTargetCard
                                    selected={returnTarget === 'previous'}
                                    onSelect={() => setReturnTarget('previous')}
                                    eyebrow="Suggested"
                                    title={previousOffice.name}
                                    subtitle="Office that sent this document"
                                    tone="blue"
                                />
                            )}

                            <ReturnTargetCard
                                selected={returnTarget === 'other'}
                                onSelect={() => setReturnTarget('other')}
                                title="Other office"
                                subtitle="Choose from available offices"
                                tone="slate"
                            />
                        </div>

                        {returnTarget === 'other' && (
                            <div className="mt-2">
                                <InlineOfficePicker
                                    offices={otherOffices}
                                    value={returnOtherOfficeId}
                                    onChange={setReturnOtherOfficeId}
                                />
                            </div>
                        )}
                    </div>

                    {/* Reason */}
                    <div>
                        <label
                            htmlFor="return-reason"
                            className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500"
                        >
                            <span>
                                Reason <span className="text-red-500">*</span>
                            </span>
                            <span className="font-normal normal-case tracking-normal text-slate-400">
                                Added to audit trail
                            </span>
                        </label>
                        <textarea
                            id="return-reason"
                            rows={2}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Incomplete requirements, wrong recipient"
                            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* Optional remarks */}
                    <div>
                        <label
                            htmlFor="return-remarks"
                            className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500"
                        >
                            <span>Remarks</span>
                            <span className="font-normal normal-case tracking-normal text-slate-400">
                                Optional
                            </span>
                        </label>
                        <textarea
                            id="return-remarks"
                            rows={2}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Anything else the office should know"
                            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* Compact summary strip */}
                    {effectiveReturnOfficeId && (
                        <div className="flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2 text-[11px] leading-snug text-blue-800">
                            <Info className="mt-0.5 h-3 w-3 flex-shrink-0" />
                            <p>
                                Routes to{' '}
                                <strong className="font-semibold">
                                    {returnTarget === 'previous'
                                        ? previousOffice?.name
                                        : offices.find(
                                              (o) =>
                                                  Number(o.id) ===
                                                  Number(returnOtherOfficeId)
                                          )?.name ?? 'the selected office'}
                                </strong>
                                . Past history is preserved.
                            </p>
                        </div>
                    )}
                </div>
            </Modal>

            {/* ---------- Cancel modal ---------- */}
            <Modal
                show={modal === 'cancel'}
                onClose={() => setModal(null)}
                title="Cancel document"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModal(null)}>
                            Keep document
                        </Button>
                        <Button
                            variant="danger"
                            loading={busy}
                            onClick={() =>
                                post(route('documents.cancel', document.id), { reason })
                            }
                        >
                            Cancel document
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    This will stop the routing process. Previous route history is preserved.
                </p>
                <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for cancellation *"
                    className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </Modal>

            {/* ---------- Print-only label ---------- */}
            <div className="print-area hidden">
                <div
                    style={{
                        display: 'inline-block',
                        border: '2px solid #000',
                        padding: '12px 16px',
                        borderRadius: '6px',
                        textAlign: 'center',
                    }}
                >
                    <DocumentQr value={qrPayload} size={280} />
                    <p
                        style={{
                            marginTop: '8px',
                            fontFamily: 'monospace',
                            fontSize: '16px',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            color: '#000',
                        }}
                    >
                        {document.tracking_number}
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

/* ================================================================== */
/*  RETURN — target option card                                        */
/* ================================================================== */

function ReturnTargetCard({
    selected,
    onSelect,
    eyebrow = null,
    title,
    subtitle,
    tone = 'slate',
}) {
    const TONES = {
        blue: {
            border: 'border-blue-500 bg-blue-50',
            dot: 'border-blue-500 bg-blue-500',
            eyebrow: 'bg-blue-100 text-blue-700',
            title: 'text-blue-900',
        },
        slate: {
            border: 'border-slate-800 bg-slate-50',
            dot: 'border-slate-800 bg-slate-800',
            eyebrow: 'bg-slate-100 text-slate-600',
            title: 'text-slate-900',
        },
    };
    const t = TONES[tone] ?? TONES.slate;

    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className={`flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition ${
                selected
                    ? t.border
                    : 'border-slate-200 bg-white active:bg-slate-50'
            }`}
        >
            <span
                className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${
                    selected ? t.dot : 'border-slate-300 bg-white'
                }`}
            >
                {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </span>

            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                    {eyebrow && (
                        <span
                            className={`inline-flex flex-shrink-0 items-center rounded px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider ${t.eyebrow}`}
                        >
                            {eyebrow}
                        </span>
                    )}
                    <span
                        className={`truncate text-[13px] font-semibold ${
                            selected ? t.title : 'text-slate-800'
                        }`}
                    >
                        {title}
                    </span>
                </span>
                {subtitle && (
                    <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                        {subtitle}
                    </span>
                )}
            </span>
        </button>
    );
}

/* ================================================================== */
/*  RETURN — inline searchable office picker                           */
/* ================================================================== */

function InlineOfficePicker({ offices = [], value, onChange }) {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return offices;
        return offices.filter(
            (o) =>
                o.name?.toLowerCase().includes(q) ||
                o.code?.toLowerCase().includes(q)
        );
    }, [offices, query]);

    if (offices.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center">
                <p className="text-[11px] text-slate-500">
                    No other offices available.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-1.5">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search offices…"
                        className="w-full rounded-md border-0 bg-slate-50 py-1.5 pl-8 pr-7 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900/20"
                    />
                </div>
            </div>

            <div className="max-h-44 overflow-y-auto p-1">
                {filtered.length === 0 ? (
                    <p className="px-3 py-4 text-center text-[11px] text-slate-400">
                        No matches.
                    </p>
                ) : (
                    <ul className="space-y-0.5">
                        {filtered.map((office) => {
                            const selected =
                                String(value) === String(office.id);
                            return (
                                <li key={office.id}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onChange(String(office.id))
                                        }
                                        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition ${
                                            selected
                                                ? 'bg-blue-50 ring-1 ring-blue-500'
                                                : 'hover:bg-slate-100 active:bg-slate-200'
                                        }`}
                                    >
                                        <span
                                            className={`flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${
                                                selected
                                                    ? 'border-blue-500 bg-blue-500'
                                                    : 'border-slate-300 bg-white'
                                            }`}
                                        >
                                            {selected && (
                                                <span className="h-1 w-1 rounded-full bg-white" />
                                            )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-xs font-medium text-slate-800">
                                                {office.name}
                                            </span>
                                            {office.code && (
                                                <span className="block truncate text-[10px] text-slate-500">
                                                    {office.code}
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}

/* ================================================================== */
/*  Section components                                                 */
/* ================================================================== */

function DocumentInfoCard({ document }) {
    return (
        <Card title="Document Information" icon={FileText}>
            <dl className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
                <Row label="Tracking Number" mono>
                    {document.tracking_number}
                </Row>
                <Row label="Transaction Category">
                    {document.transaction_category?.name ?? '—'}
                    {document.processing_days_per_office && (
                        <span className="ml-1 text-[11px] text-slate-500 sm:text-xs">
                            · {document.processing_days_per_office} day
                            {document.processing_days_per_office > 1 ? 's' : ''} per office
                        </span>
                    )}
                </Row>
                <Row label="Completion">
                    {document.return_to_sender ? (
                        <span className="inline-flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 ring-1 ring-inset ring-blue-200">
                                <Undo2 className="h-2.5 w-2.5" />
                                Return to Sender
                            </span>
                            <span className="text-xs text-slate-500">
                                {document.completed_at
                                    ? `Returned to ${document.originating_office?.name ?? 'the sender'}`
                                    : `Completed only after return to ${document.originating_office?.name ?? 'the sender'}`}
                            </span>
                        </span>
                    ) : (
                        <span className="text-slate-500">
                            At final destination office
                        </span>
                    )}
                </Row>
                <Row label="Document Date">
                    {document.document_date
                        ? new Date(document.document_date).toLocaleDateString()
                        : '—'}
                </Row>
                <Row label="Originating Office">
                    {document.originating_office?.name ?? '—'}
                </Row>
                <Row label="Created By">{document.creator?.name ?? '—'}</Row>
                <Row label="Created Date">
                    {new Date(document.created_at).toLocaleString()}
                </Row>
                <Row label="Subject" className="sm:col-span-2">
                    {document.subject ?? '—'}
                </Row>
                {document.remarks && (
                    <Row label="Remarks" className="sm:col-span-2">
                        {document.remarks}
                    </Row>
                )}
            </dl>

            {document.document_image_path && (
                <div className="mt-4">
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
                        Document Photo
                    </p>
                    <a
                        href={`/storage/${document.document_image_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-lg border border-slate-200"
                    >
                        <img
                            src={`/storage/${document.document_image_path}`}
                            alt="Document"
                            className="max-h-56 w-full bg-slate-50 object-contain sm:max-h-72"
                        />
                    </a>
                </div>
            )}
        </Card>
    );
}

function CurrentStatusCard({ document, lastEvent, frozen = false }) {
    if (frozen) {
        return (
            <Card title="Final Status" icon={Building2}>
                <dl className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
                    <Row label="Final Office">
                        {document.current_office?.name ?? '—'}
                    </Row>
                    <Row label="Completed At">
                        {document.completed_at
                            ? new Date(document.completed_at).toLocaleString()
                            : '—'}
                    </Row>
                    <Row label="Total Routing Time">
                        {formatDuration(document.total_routing_seconds ?? null)}
                    </Row>
                    <Row label="Last Action">
                        {lastEvent?.event_type ?? '—'}
                    </Row>
                    <Row label="Last Action Time" className="sm:col-span-2">
                        {lastEvent
                            ? new Date(lastEvent.created_at).toLocaleString()
                            : '—'}
                    </Row>
                </dl>
            </Card>
        );
    }

    const showReturnHint =
        document.return_to_sender && document.status !== 'COMPLETED';

    return (
        <Card title="Current Status" icon={Building2}>
            <dl className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
                <Row label="Current Location">
                    {document.current_office?.name ?? '—'}
                </Row>
                <Row label="Authorized Destination">
                    {document.current_destination?.name ?? '—'}
                </Row>
                <Row label="Last Action">{lastEvent?.event_type ?? '—'}</Row>
                <Row label="Last Action Time">
                    {lastEvent ? new Date(lastEvent.created_at).toLocaleString() : '—'}
                </Row>
                <Row label="Total Routing Time">
                    <LiveElapsed from={document.created_at} />
                </Row>
                <Row label="Completed At">—</Row>
            </dl>

            {showReturnHint && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-800">
                    <Undo2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <p>
                        <span className="font-semibold">
                            Pending return to sender.
                        </span>{' '}
                        This document will not be marked as{' '}
                        <strong className="font-semibold">Completed</strong> until
                        it physically returns to{' '}
                        <strong className="font-semibold">
                            {document.originating_office?.name ??
                                'the originating office'}
                        </strong>
                        .
                    </p>
                </div>
            )}
        </Card>
    );
}

function RouteCard({ document, frozen = false }) {
    const routes = document.routes ?? [];

    return (
        <Card title="Route" icon={Building2}>
            <RouteSummaryStrip document={document} frozen={frozen} />

            <div className="mt-4">
                <RouteTimeline
                    routes={routes}
                    currentDestinationId={document.current_destination_office_id}
                    frozen={frozen}
                />
            </div>

            {routes.length > 0 && (
                <div className="mt-5">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
                        Office-by-office timing
                    </p>
                    <OfficeTimingTable routes={routes} frozen={frozen} />
                </div>
            )}
        </Card>
    );
}

function RouteSummaryStrip({ document, frozen = false }) {
    const created = document.created_at;
    const completed = document.completed_at;

    return (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:px-4">
            <div>
                <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    Created
                </span>
                <p className="font-semibold text-slate-800">
                    {new Date(created).toLocaleString()}
                </p>
            </div>

            {completed ? (
                <div>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        Completed
                    </span>
                    <p className="font-semibold text-slate-800">
                        {new Date(completed).toLocaleString()}
                    </p>
                </div>
            ) : (
                <div>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        In system for
                    </span>
                    <p className="font-semibold text-slate-800">
                        <LiveElapsed from={created} frozen={frozen} />
                    </p>
                </div>
            )}

            {document.processing_days_per_office && (
                <div>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        Window per office
                    </span>
                    <p className="font-semibold text-slate-800">
                        {document.processing_days_per_office} day
                        {document.processing_days_per_office > 1 ? 's' : ''}
                    </p>
                </div>
            )}

            {document.return_to_sender && (
                <div>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        Completion
                    </span>
                    <p className="inline-flex items-center gap-1 font-semibold text-blue-700">
                        <Undo2 className="h-3 w-3" />
                        Return to sender
                    </p>
                </div>
            )}
        </div>
    );
}

function OfficeTimingTable({ routes, frozen = false }) {
    return (
        <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="px-3 py-2 font-semibold">Office</th>
                            <th className="px-3 py-2 font-semibold">Received</th>
                            <th className="px-3 py-2 font-semibold">Released</th>
                            <th className="px-3 py-2 text-right font-semibold">
                                Duration
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {routes.map((r, index) => {
                            const isLastRow = index === routes.length - 1;
                            const isHeld = !frozen && r.received_at && !r.forwarded_at;
                            const isOverdue = !frozen && r.is_overdue;
                            const isOrigin = !r.received_at && !!r.forwarded_at;

                            const isFinalCompletedRow =
                                frozen && isLastRow && !!r.received_at;

                            return (
                                <tr
                                    key={r.id ?? r.sequence}
                                    className={
                                        r.is_return_to_sender
                                            ? 'bg-blue-50/40'
                                            : isOverdue
                                              ? 'bg-red-50/40'
                                              : isFinalCompletedRow
                                                ? 'bg-emerald-50/30'
                                                : ''
                                    }
                                >
                                    <td className="px-3 py-2 align-top">
                                        <div className="font-medium text-slate-700">
                                            {r.office?.name ?? '—'}
                                        </div>
                                        <div className="mt-0.5 flex flex-wrap gap-1">
                                            {r.is_return && (
                                                <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-700">
                                                    Return
                                                </span>
                                            )}
                                            {r.is_return_to_sender && (
                                                <span className="inline-block rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-blue-700">
                                                    Return to Sender
                                                </span>
                                            )}
                                            {isOrigin && (
                                                <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-slate-600">
                                                    Origin
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-3 py-2 align-top text-slate-600">
                                        {r.received_at ? (
                                            <span className="tabular-nums">
                                                {new Date(r.received_at).toLocaleString()}
                                            </span>
                                        ) : isOrigin ? (
                                            <span className="italic text-slate-400">—</span>
                                        ) : (
                                            <span className="italic text-slate-400">
                                                Not yet received
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-3 py-2 align-top text-slate-600">
                                        {r.forwarded_at ? (
                                            <span className="tabular-nums">
                                                {new Date(r.forwarded_at).toLocaleString()}
                                            </span>
                                        ) : isFinalCompletedRow ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                                Completed
                                            </span>
                                        ) : isHeld ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-indigo-700 ring-1 ring-inset ring-indigo-200">
                                                Still held
                                            </span>
                                        ) : (
                                            <span className="italic text-slate-400">—</span>
                                        )}
                                    </td>

                                    <td className="px-3 py-2 text-right align-top">
                                        {r.received_at ? (
                                            <span
                                                className={`font-semibold tabular-nums ${
                                                    isHeld
                                                        ? isOverdue
                                                            ? 'text-red-700'
                                                            : 'text-indigo-700'
                                                        : 'text-slate-800'
                                                }`}
                                            >
                                                <LiveElapsed
                                                    from={r.received_at}
                                                    forwardedAt={r.forwarded_at}
                                                    frozen={frozen}
                                                />
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ProcessingTimeCardSection({ timingRoutes, frozen = false }) {
    return (
        <Card title="Processing Time" icon={Clock}>
            {timingRoutes.length === 0 ? (
                <p className="text-sm text-slate-500">
                    Not yet received by any office.
                </p>
            ) : (
                <ul className="space-y-3">
                    {timingRoutes.map((r) => (
                        <li key={r.id}>
                            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
                                {r.sequence}. {r.office?.name}
                                {r.is_return && (
                                    <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                                        Return
                                    </span>
                                )}
                                {r.is_return_to_sender && (
                                    <span className="ml-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">
                                        Return to Sender
                                    </span>
                                )}
                            </p>
                            <ProcessingTimeCard route={r} frozen={frozen} />
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}

function ActivityCard({ document }) {
    return (
        <Card title="Activity History" icon={History}>
            {document.events?.length ? (
                <ol className="space-y-3">
                    {document.events.map((event) => (
                        <li
                            key={event.id}
                            className="relative border-l-2 border-slate-100 pl-3.5"
                        >
                            <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-slate-400" />
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                    {event.event_type}
                                </span>
                                <span className="text-[11px] text-slate-400 tabular-nums">
                                    {new Date(event.created_at).toLocaleString()}
                                </span>
                            </div>
                            <p className="mt-0.5 text-sm text-slate-600">
                                {event.from_office && event.to_office
                                    ? `${event.from_office.name} → ${event.to_office.name}`
                                    : event.to_office?.name ??
                                      event.from_office?.name ??
                                      '—'}
                            </p>
                            {event.performer && (
                                <p className="text-xs text-slate-500">
                                    by {event.performer.name}
                                </p>
                            )}
                            {event.remarks && (
                                <p className="mt-1 whitespace-pre-line rounded bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                                    {event.remarks}
                                </p>
                            )}
                        </li>
                    ))}
                </ol>
            ) : (
                <p className="text-sm text-slate-500">No activity recorded yet.</p>
            )}
        </Card>
    );
}

function QrCard({ qrPayload }) {
    return (
        <Card title="QR Code">
            <div className="flex flex-col items-center gap-3">
                <DocumentQr value={qrPayload} size={160} />
                <p className="text-center text-[11px] text-slate-500">
                    This single QR code is used for the entire lifecycle of the document.
                </p>
                <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => window.print()}
                >
                    <Printer className="h-4 w-4" /> Print label
                </Button>
            </div>
        </Card>
    );
}

function ActionsCard({ can, onOpen }) {
    return (
        <Card title="Actions">
            <div className="space-y-2">
                {can.receive && (
                    <Button
                        variant="success"
                        className="w-full"
                        onClick={() => onOpen('receive')}
                    >
                        Receive Document
                    </Button>
                )}
                {can.forward && (
                    <Button className="w-full" onClick={() => onOpen('forward')}>
                        Forward to Next Office
                    </Button>
                )}
                {can.return && (
                    <Button
                        variant="warning"
                        className="w-full"
                        onClick={() => onOpen('return')}
                    >
                        Return Document
                    </Button>
                )}
                {can.cancel && (
                    <Button
                        variant="danger"
                        className="w-full"
                        onClick={() => onOpen('cancel')}
                    >
                        Cancel Document
                    </Button>
                )}
            </div>
        </Card>
    );
}

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */

function Card({ title, icon: Icon, children }) {
    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
                {Icon && <Icon className="h-4 w-4 flex-shrink-0 text-slate-400" />}
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                    {title}
                </h3>
            </header>
            <div className="p-4">{children}</div>
        </section>
    );
}

function Row({ label, children, className = '', mono = false }) {
    return (
        <div
            className={`flex items-start gap-3 border-b border-slate-100 py-2.5 last:border-0 sm:block sm:border-0 sm:py-0 ${className}`}
        >
            <dt className="w-24 flex-shrink-0 pt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:w-auto sm:pt-0 sm:text-xs">
                {label}
            </dt>
            <dd
                className={`min-w-0 flex-1 text-[13px] text-slate-800 sm:mt-0.5 sm:text-sm ${
                    mono ? 'break-all font-mono' : 'break-words'
                }`}
            >
                {children}
            </dd>
        </div>
    );
}