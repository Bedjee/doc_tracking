import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    Check,
    CheckCircle2,
    CircleAlert,
    Clock,
    FileText,
    Home,
    RotateCcw,
    ScanLine,
    Send,
    ShieldAlert,
    Undo2,
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';
import Modal from '@/Components/UI/Modal';
import DocumentStatusBadge from '@/Components/Documents/DocumentStatusBadge';
import ProcessingTimeCard from '@/Components/Documents/ProcessingTimeCard';
import QrScanner from '@/Components/Scanner/QrScanner';
import { useToast } from '@/Components/UI/Toast';
import { formatDuration } from '@/lib/formatDuration';

export default function Scan({ myOffice }) {
    const toast = useToast();

    const [manual, setManual] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [modal, setModal] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [returnOfficeId, setReturnOfficeId] = useState('');
    const [returnReason, setReturnReason] = useState('');
    const [offices, setOffices] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    /* ---------------- lookup ---------------- */

    async function lookup(trackingNumber) {
        const value = (trackingNumber ?? '').trim();
        if (!value) return;

        setLoading(true);
        setResult(null);
        setModal(null);

        try {
            const res = await fetch(route('scan.lookup'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document.querySelector('meta[name="csrf-token"]')?.content ?? '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ tracking_number: value }),
            });

            const json = await res.json();

            if (!res.ok) {
                toast.error(
                    json.message ??
                        Object.values(json.errors ?? {})[0]?.[0] ??
                        'Document not found.'
                );
                return;
            }

            setResult(json);

            const state = json.authorization?.state;

            if (state === 'receive') {
                setModal('receive');
            } else if (state === 'forward') {
                setModal('forward');
            } else if (state === 'unauthorized') {
                toast.warning('This document is not at your office.');
            }
        } catch {
            toast.error('Unable to reach the server.');
        } finally {
            setLoading(false);
        }
    }

    function reset() {
        setResult(null);
        setManual('');
        setModal(null);
        setRemarks('');
        setReturnOfficeId('');
        setReturnReason('');
    }

    /* ---------------- actions ---------------- */

    function receive() {
        setSubmitting(true);
        const tracking = result.document.tracking_number;

        router.post(
            route('documents.receive', result.document.id),
            { remarks },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Document received.');
                    setRemarks('');
                    setModal(null);
                    lookup(tracking);
                },
                onError: (e) =>
                    toast.error(Object.values(e)[0] ?? 'Unable to receive.'),
                onFinish: () => setSubmitting(false),
            }
        );
    }

    function forward() {
        setSubmitting(true);
        router.post(
            route('documents.forward', result.document.id),
            { remarks },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Document forwarded.');
                    reset();
                },
                onError: (e) =>
                    toast.error(Object.values(e)[0] ?? 'Unable to forward.'),
                onFinish: () => setSubmitting(false),
            }
        );
    }

    async function openReturn() {
        setModal('return');
        if (offices.length) return;

        try {
            const res = await fetch(route('documents.index'), {
                headers: { Accept: 'application/json' },
            });
            const json = await res.json();
            setOffices(json.props?.offices ?? []);
        } catch {
            setOffices([]);
        }
    }

    function submitReturn() {
        setSubmitting(true);
        router.post(
            route('documents.return', result.document.id),
            { return_office_id: returnOfficeId, reason: returnReason, remarks },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.warning('Document returned.');
                    reset();
                },
                onError: (e) =>
                    toast.error(Object.values(e)[0] ?? 'Unable to return.'),
                onFinish: () => setSubmitting(false),
            }
        );
    }

    /* ---------------- render ---------------- */

    const auth = result?.authorization;
    const doc = result?.document;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <ScanLine className="h-5 w-5 text-slate-500" />
                        <h2 className="text-base font-semibold text-slate-800 sm:text-lg">
                            Scan Document
                        </h2>
                    </div>
                    {result && (
                        <button
                            type="button"
                            onClick={reset}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Scan again
                        </button>
                    )}
                </div>
            }
        >
            <Head title="Scan" />

            <div className="mx-auto max-w-xl px-3 py-4 sm:px-6 sm:py-6">
                {/* ============ SCANNER ============ */}
                {!result && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                            <Building2 className="h-3.5 w-3.5" />
                            <span>
                                You are at{' '}
                                <span className="font-semibold text-slate-900">
                                    {myOffice?.name ?? 'Unassigned'}
                                </span>
                            </span>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                            <QrScanner
                                onResult={(text) => lookup(text)}
                                onError={(msg) => toast.error(msg)}
                            />

                            <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-slate-400">
                                <span className="h-px flex-1 bg-slate-200" />
                                or enter manually
                                <span className="h-px flex-1 bg-slate-200" />
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    lookup(manual);
                                }}
                                className="flex gap-2"
                            >
                                <input
                                    value={manual}
                                    onChange={(e) => setManual(e.target.value)}
                                    placeholder="DOC-2026-000123"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm uppercase focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                />
                                <Button
                                    type="submit"
                                    loading={loading}
                                    className="shrink-0"
                                >
                                    <ScanLine className="h-4 w-4" />
                                    <span className="hidden sm:inline">Find</span>
                                </Button>
                            </form>
                        </div>
                    </div>
                )}

                {/* ============ RESULT VIEW ============ */}
                {result && (
                    <div className="animate-result-in space-y-4">
                        <StateCard
                            auth={auth}
                            doc={doc}
                            processing={result.processing}
                            submitting={submitting}
                            onReceive={() => setModal('receive')}
                            onForward={() => setModal('forward')}
                            onReturn={openReturn}
                        />

                        {/* ---------- Document identity ---------- */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold leading-tight text-slate-900 sm:text-base">
                                        {doc.title}
                                    </p>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                        <span className="font-mono">{doc.tracking_number}</span>
                                        <DocumentStatusBadge status={doc.status} />
                                    </div>
                                </div>
                            </div>

                            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4 text-xs">
                                <Detail label="Type" value={doc.type ?? '—'} />
                                <Detail
                                    label="Reference"
                                    value={doc.reference_number ?? '—'}
                                />
                                <Detail
                                    label="Originating"
                                    value={doc.originating_office ?? '—'}
                                />
                                <Detail
                                    label="Category"
                                    value={doc.transaction_category ?? '—'}
                                />
                            </dl>
                        </div>

                        {/* ---------- Route progress ---------- */}
                        {doc.route?.length > 0 && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                                        <Home className="h-3.5 w-3.5" />
                                    </div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Route Progress
                                    </p>
                                </div>
                                <RouteProgress
                                    route={doc.route}
                                    myOfficeId={auth.my_office_id}
                                />
                            </div>
                        )}

                        {/* ---------- Live processing time (hidden for terminal states) ---------- */}
                        {auth.state !== 'completed' &&
                            auth.state !== 'cancelled' &&
                            result.processing?.received_at && (
                                <ProcessingTimeCard
                                    route={{
                                        processing_days: result.processing.processing_days,
                                        processing_seconds: result.processing.processing_seconds,
                                        received_at: result.processing.received_at,
                                        forwarded_at: null,
                                        due_at: result.processing.due_at,
                                        elapsed_seconds: result.processing.elapsed_seconds,
                                        remaining_seconds: result.processing.remaining_seconds,
                                        is_overdue: result.processing.is_overdue,
                                        progress_percent: result.processing.progress_percent,
                                    }}
                                />
                            )}

                        {/* ---------- Footer link ---------- */}
                        <Link
                            href={doc.url}
                            className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition hover:border-slate-300 hover:bg-slate-50"
                        >
                            <span className="font-medium text-slate-700">
                                View full route history
                            </span>
                            <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
                        </Link>
                    </div>
                )}
            </div>

            {/* ============ MODALS ============ */}

            <Modal
                show={modal === 'receive' && !!doc}
                onClose={() => setModal(null)}
                title="Receive this document?"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModal(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="success"
                            onClick={receive}
                            loading={submitting}
                        >
                            Yes, receive
                        </Button>
                    </>
                }
            >
                {doc && (
                    <>
                        <p className="text-sm text-slate-600">
                            Confirm that the physical document is now in the
                            possession of{' '}
                            <span className="font-semibold text-slate-900">
                                {doc.current_destination ?? 'your office'}
                            </span>
                            .
                        </p>

                        <DocumentMini doc={doc} />

                        {doc.processing_days_per_office && (
                            <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-sky-200 bg-sky-50 p-3">
                                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                                <div className="text-xs text-sky-800">
                                    <p className="font-semibold">
                                        Processing window:{' '}
                                        {doc.processing_days_per_office} day
                                        {doc.processing_days_per_office > 1
                                            ? 's'
                                            : ''}
                                    </p>
                                    <p className="mt-0.5 text-sky-700">
                                        Countdown starts the moment you confirm
                                        receipt.
                                    </p>
                                </div>
                            </div>
                        )}

                        <textarea
                            rows={2}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Remarks (optional)"
                            className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                        />
                    </>
                )}
            </Modal>

            <Modal
                show={modal === 'forward' && !!doc}
                onClose={() => setModal(null)}
                title="Forward this document?"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModal(null)}>
                            Cancel
                        </Button>
                        <Button onClick={forward} loading={submitting}>
                            Yes, forward
                        </Button>
                    </>
                }
            >
                {doc && (
                    <>
                        <p className="text-sm text-slate-600">
                            The document will move to the next office in its
                            route. Only that office will be authorized to
                            receive it.
                        </p>

                        <DocumentMini doc={doc} />

                        {result.processing?.received_at && (
                            <div className="mt-3">
                                <ProcessingTimeCard
                                    route={{
                                        processing_days: result.processing.processing_days,
                                        processing_seconds: result.processing.processing_seconds,
                                        received_at: result.processing.received_at,
                                        forwarded_at: null,
                                        due_at: result.processing.due_at,
                                        elapsed_seconds: result.processing.elapsed_seconds,
                                        remaining_seconds: result.processing.remaining_seconds,
                                        is_overdue: result.processing.is_overdue,
                                        progress_percent: result.processing.progress_percent,
                                    }}
                                />
                            </div>
                        )}

                        <textarea
                            rows={2}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Remarks (optional)"
                            className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                        />

                        {auth?.can_return && (
                            <button
                                type="button"
                                onClick={openReturn}
                                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700"
                            >
                                <Undo2 className="h-3.5 w-3.5" />
                                Return this document instead
                            </button>
                        )}
                    </>
                )}
            </Modal>

            <Modal
                show={modal === 'return' && !!doc}
                onClose={() => setModal(null)}
                title="Return document"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModal(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="warning"
                            onClick={submitReturn}
                            loading={submitting}
                        >
                            Return document
                        </Button>
                    </>
                }
            >
                {doc && (
                    <div className="space-y-3">
                        <DocumentMini doc={doc} />

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Return to office *
                            </label>
                            <select
                                value={returnOfficeId}
                                onChange={(e) => setReturnOfficeId(e.target.value)}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                            >
                                <option value="">— Select office —</option>
                                {offices.map((o) => (
                                    <option key={o.id} value={o.id}>
                                        {o.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Reason *
                            </label>
                            <textarea
                                rows={3}
                                value={returnReason}
                                onChange={(e) => setReturnReason(e.target.value)}
                                placeholder="e.g. Incomplete requirements"
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Remarks (optional)
                            </label>
                            <textarea
                                rows={2}
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                            />
                        </div>
                    </div>
                )}
            </Modal>

            <style>{`
                @keyframes resultIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-result-in {
                    animation: resultIn 0.28s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </AuthenticatedLayout>
    );
}

/* =====================================================================
 * State card — the hero of the result view
 * ===================================================================== */

function StateCard({ auth, doc, processing, submitting, onReceive, onForward, onReturn }) {
    const state = auth.state;

    /* ---------------- RECEIVE ---------------- */
    if (state === 'receive') {
        return (
            <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
                <div className="p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-base font-semibold text-emerald-900">
                                Ready to Receive
                            </p>
                            <p className="mt-0.5 text-sm text-emerald-700">
                                This document is heading to your office.
                                Confirm receipt to start the processing clock.
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <Button
                            variant="success"
                            size="lg"
                            className="flex-1"
                            onClick={onReceive}
                            loading={submitting}
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Receive Document
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    /* ---------------- FORWARD ---------------- */
    if (state === 'forward') {
        const p = processing;
        const hasTiming = p?.received_at;
        const overdue = p?.is_overdue;
        const tone = overdue ? 'red' : 'sky';

        const TONE = {
            sky: {
                wrapper: 'border-sky-200 bg-gradient-to-br from-sky-50 to-white',
                icon: 'bg-sky-500',
                title: 'text-sky-900',
                body: 'text-sky-700',
            },
            red: {
                wrapper: 'border-red-200 bg-gradient-to-br from-red-50 to-white',
                icon: 'bg-red-500',
                title: 'text-red-900',
                body: 'text-red-700',
            },
        }[tone];

        return (
            <div className={`overflow-hidden rounded-2xl border ${TONE.wrapper}`}>
                <div className="p-5">
                    <div className="flex items-start gap-3">
                        <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${TONE.icon}`}
                        >
                            {overdue ? (
                                <CircleAlert className="h-5 w-5" />
                            ) : (
                                <CheckCircle2 className="h-5 w-5" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className={`text-base font-semibold ${TONE.title}`}>
                                {overdue ? 'Overdue — Action Needed' : 'In Your Possession'}
                            </p>
                            <p className={`mt-0.5 text-sm ${TONE.body}`}>
                                {overdue
                                    ? 'The processing window has passed. Forward or return this document as soon as possible.'
                                    : 'Forward this document to the next office when you are done processing.'}
                            </p>
                        </div>
                    </div>

                    {hasTiming && (
                        <div className="mt-4 rounded-xl border border-white/60 bg-white/70 p-3 backdrop-blur">
                            <div className="flex items-baseline justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                        {overdue ? 'Overdue by' : 'Time remaining'}
                                    </p>
                                    <p
                                        className={`mt-0.5 text-lg font-semibold tabular-nums ${
                                            overdue ? 'text-red-700' : 'text-slate-900'
                                        }`}
                                    >
                                        {formatDuration(Math.abs(p.remaining_seconds))}
                                    </p>
                                </div>
                                <p className="text-right text-[11px] text-slate-500">
                                    {p.processing_days}d window
                                    <br />
                                    <span className="tabular-nums">
                                        {p.progress_percent}% elapsed
                                    </span>
                                </p>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                <div
                                    className={`h-full rounded-full transition-all ${
                                        overdue ? 'bg-red-500' : 'bg-sky-500'
                                    }`}
                                    style={{
                                        width: `${Math.min(100, p.progress_percent)}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <Button
                            className="flex-1"
                            size="lg"
                            onClick={onForward}
                            loading={submitting}
                        >
                            <Send className="h-4 w-4" />
                            Forward to Next Office
                        </Button>
                        {auth.can_return && (
                            <Button
                                variant="warning"
                                size="lg"
                                onClick={onReturn}
                                className="sm:flex-none"
                            >
                                <Undo2 className="h-4 w-4" />
                                Return
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    /* ---------------- COMPLETED ---------------- */
    if (state === 'completed') {
        const wasReturnToSender = !!doc.return_to_sender;
        const completedAt = doc.completed_at;

        return (
            <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
                <div className="p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-base font-semibold text-emerald-900">
                                Document Completed
                            </p>
                            <p className="mt-0.5 text-sm text-emerald-700">
                                {wasReturnToSender
                                    ? 'This document has been returned to the sender. The process is complete.'
                                    : 'This document has completed its routing. The process is complete.'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="rounded-lg border border-emerald-100 bg-white/70 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                {wasReturnToSender ? 'Returned to' : 'Final office'}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-slate-900">
                                {doc.current_office ?? '—'}
                            </p>
                        </div>

                        {completedAt && (
                            <div className="rounded-lg border border-emerald-100 bg-white/70 p-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                    Completed at
                                </p>
                                <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
                                    {new Date(completedAt).toLocaleString()}
                                </p>
                            </div>
                        )}
                    </div>

                    {wasReturnToSender && (
                        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                            <Undo2 className="h-3 w-3" />
                            Return to sender flow
                        </p>
                    )}

                    <p className="mt-4 text-xs text-emerald-700/80">
                        No further action is available for this document.
                    </p>
                </div>
            </div>
        );
    }

    /* ---------------- CANCELLED ---------------- */
    if (state === 'cancelled') {
        return (
            <div className="overflow-hidden rounded-2xl border border-slate-300 bg-gradient-to-br from-slate-50 to-white">
                <div className="p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-500 text-white shadow-sm">
                            <CircleAlert className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-base font-semibold text-slate-800">
                                Document Cancelled
                            </p>
                            <p className="mt-0.5 text-sm text-slate-600">
                                This document has been cancelled. No further action is available.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ---------------- UNAUTHORIZED (fallback) ---------------- */
    return (
        <div className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white">
            <div className="p-5">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                        <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-base font-semibold text-amber-900">
                            Not Your Document
                        </p>
                        <p className="mt-0.5 text-sm text-amber-700">
                            This document is currently held by another office.
                            You cannot receive or forward it from here.
                        </p>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-amber-100 bg-white/70 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            Currently held by
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-900">
                            {doc.current_office ?? '—'}
                        </p>
                    </div>
                    <div className="rounded-lg border border-amber-100 bg-white/70 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            Your office
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-900">
                            {auth.my_office ?? '—'}
                        </p>
                    </div>
                </div>

                <p className="mt-3 text-xs text-amber-700">
                    If you believe this is a mistake, contact the office
                    currently holding the document.
                </p>
            </div>
        </div>
    );
}

/* =====================================================================
 * Route progress — visual journey at a glance
 * ===================================================================== */

function RouteProgress({ route, myOfficeId }) {
    return (
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <ol className="flex min-w-max items-start">
                {route.map((step, index) => {
                    const status = step.status;
                    const isLast = index === route.length - 1;

                    const config = (() => {
                        switch (status) {
                            case 'DONE':
                                return {
                                    circle: 'bg-emerald-500 text-white border-emerald-500',
                                    line: 'bg-emerald-500',
                                    label: 'text-slate-700',
                                    icon: <Check className="h-3.5 w-3.5" strokeWidth={3} />,
                                };
                            case 'RECEIVED':
                                return {
                                    circle: 'bg-indigo-500 text-white border-indigo-500',
                                    line: 'bg-slate-200',
                                    label: 'text-indigo-700 font-semibold',
                                    icon: <div className="h-1.5 w-1.5 rounded-full bg-white" />,
                                };
                            case 'CURRENT':
                                return {
                                    circle:
                                        'bg-white text-amber-500 border-amber-500 ring-4 ring-amber-100',
                                    line: 'bg-slate-200',
                                    label: 'text-amber-700 font-semibold',
                                    icon: <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />,
                                };
                            case 'SKIPPED':
                                return {
                                    circle: 'bg-slate-100 text-slate-400 border-slate-200',
                                    line: 'bg-slate-200',
                                    label: 'text-slate-400 line-through',
                                    icon: <div className="h-1 w-1 rounded-full bg-slate-400" />,
                                };
                            default:
                                return {
                                    circle: 'bg-white text-slate-300 border-slate-300',
                                    line: 'bg-slate-200',
                                    label: 'text-slate-400',
                                    icon: <div className="h-1 w-1 rounded-full bg-slate-300" />,
                                };
                        }
                    })();

                    return (
                        <li
                            key={step.sequence}
                            className="relative flex flex-col items-center"
                            style={{ minWidth: 68 }}
                        >
                            <div className="flex w-full items-center">
                                <div
                                    className={`h-0.5 flex-1 ${
                                        index === 0 ? 'bg-transparent' : 'bg-slate-200'
                                    }`}
                                />

                                <div
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${config.circle}`}
                                >
                                    {config.icon}
                                </div>

                                <div
                                    className={`h-0.5 flex-1 ${
                                        isLast
                                            ? 'bg-transparent'
                                            : config.line === 'bg-emerald-500'
                                            ? 'bg-emerald-500'
                                            : 'bg-slate-200'
                                    }`}
                                />
                            </div>

                            <p
                                className={`mt-2 max-w-[80px] truncate px-1 text-center text-[10px] leading-tight ${config.label}`}
                                title={step.office}
                            >
                                {step.office}
                            </p>

                            {step.is_return && (
                                <span className="mt-0.5 rounded bg-amber-100 px-1 py-0.5 text-[9px] font-semibold uppercase text-amber-700">
                                    Return
                                </span>
                            )}

                            {step.is_return_to_sender && (
                                <span className="mt-0.5 rounded bg-blue-100 px-1 py-0.5 text-[9px] font-semibold uppercase text-blue-700">
                                    To Sender
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

/* =====================================================================
 * Small shared helpers
 * ===================================================================== */

function Detail({ label, value }) {
    return (
        <div className="min-w-0">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {label}
            </dt>
            <dd className="mt-0.5 truncate text-slate-700">{value}</dd>
        </div>
    );
}

function DocumentMini({ doc }) {
    return (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">{doc.title}</p>
            <p className="mt-0.5 font-mono text-xs text-slate-500">
                {doc.tracking_number}
            </p>
        </div>
    );
}