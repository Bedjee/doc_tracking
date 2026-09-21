import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Clock,
    FileText,
    History,
    Printer,
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';
import Modal from '@/Components/UI/Modal';
import DocumentStatusBadge from '@/Components/Documents/DocumentStatusBadge';
import RouteTimeline from '@/Components/Documents/RouteTimeline';
import DocumentQr from '@/Components/Documents/DocumentQr';
import ProcessingTimeCard from '@/Components/Documents/ProcessingTimeCard';
import { useToast } from '@/Components/UI/Toast';

function formatDuration(seconds) {
    if (seconds === null || seconds === undefined) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

const MOBILE_TABS = [
    { id: 'details', label: 'Details' },
    { id: 'route', label: 'Route' },
    { id: 'history', label: 'History' },
    { id: 'actions', label: 'Actions' },
];

export default function Show({ document, qrPayload, can, offices }) {
    const toast = useToast();
    const [modal, setModal] = useState(null);
    const [tab, setTab] = useState('details');
    const [remarks, setRemarks] = useState('');
    const [returnOfficeId, setReturnOfficeId] = useState('');
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);

    const lastEvent = document.events?.[0];

    function post(url, payload) {
        setBusy(true);
        router.post(url, payload, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Action recorded.');
                setModal(null);
                setRemarks('');
                setReason('');
                setReturnOfficeId('');
            },
            onError: (e) =>
                toast.error(Object.values(e)[0] ?? 'Action failed.'),
            onFinish: () => setBusy(false),
        });
    }

    const timingRoutes = (document.routes ?? []).filter(
        (r) => r.received_at || r.status === 'CURRENT'
    );

    const hasActions =
        can.receive || can.forward || can.return || can.cancel;

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
                    <div className="flex-shrink-0">
                        <DocumentStatusBadge status={document.status} />
                    </div>
                </div>
            }
        >
            <Head title={document.tracking_number} />

            {/* ==================== MOBILE ==================== */}
            <div className="lg:hidden">
                {/* Sticky tab bar */}
                <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
                    <nav
                        className="flex gap-1 overflow-x-auto px-3 py-2"
                        role="tablist"
                    >
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

                {/* Tab content */}
                <div className="space-y-3 px-3 py-3">
                    {tab === 'details' && (
                        <>
                            <DocumentInfoCard document={document} />
                            <CurrentStatusCard
                                document={document}
                                lastEvent={lastEvent}
                            />
                        </>
                    )}

                    {tab === 'route' && (
                        <>
                            <RouteCard document={document} />
                            <ProcessingTimeCardSection
                                timingRoutes={timingRoutes}
                            />
                        </>
                    )}

                    {tab === 'history' && (
                        <ActivityCard document={document} />
                    )}

                    {tab === 'actions' && (
                        <>
                            <QrCard qrPayload={qrPayload} />
                            {hasActions && (
                                <ActionsCard
                                    can={can}
                                    onOpen={(m) => setModal(m)}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ==================== DESKTOP ==================== */}
            <div className="hidden lg:block">
                <div className="mx-auto grid max-w-7xl gap-4 px-6 py-5 lg:grid-cols-3 lg:px-8">
                    {/* Left column */}
                    <div className="space-y-4 lg:col-span-2">
                        <DocumentInfoCard document={document} />
                        <CurrentStatusCard
                            document={document}
                            lastEvent={lastEvent}
                        />
                        <RouteCard document={document} />
                        <ActivityCard document={document} />
                    </div>

                    {/* Right column */}
                    <div className="space-y-4">
                        <QrCard qrPayload={qrPayload} />
                        {hasActions && (
                            <ActionsCard
                                can={can}
                                onOpen={(m) => setModal(m)}
                            />
                        )}
                        <ProcessingTimeCardSection
                            timingRoutes={timingRoutes}
                        />
                    </div>
                </div>
            </div>

            {/* ---------- Modals ---------- */}
            <Modal
                show={modal === 'receive'}
                onClose={() => setModal(null)}
                title="Receive document"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setModal(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="success"
                            loading={busy}
                            onClick={() =>
                                post(
                                    route('documents.receive', document.id),
                                    { remarks }
                                )
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
                            {document.processing_days_per_office > 1 ? 's' : ''}{' '}
                            for{' '}
                            {document.transaction_category?.name ??
                                'this document'}
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

            <Modal
                show={modal === 'forward'}
                onClose={() => setModal(null)}
                title="Forward document"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setModal(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            loading={busy}
                            onClick={() =>
                                post(
                                    route('documents.forward', document.id),
                                    { remarks }
                                )
                            }
                        >
                            Confirm forward
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    The document will move to the next office in its fixed
                    route.
                </p>
                <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Remarks (optional)"
                    className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </Modal>

            <Modal
                show={modal === 'return'}
                onClose={() => setModal(null)}
                title="Return document"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setModal(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="warning"
                            loading={busy}
                            onClick={() =>
                                post(
                                    route('documents.return', document.id),
                                    {
                                        return_office_id: returnOfficeId,
                                        reason,
                                        remarks,
                                    }
                                )
                            }
                        >
                            Return document
                        </Button>
                    </>
                }
            >
                <div className="space-y-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                            Return to office *
                        </label>
                        <select
                            value={returnOfficeId}
                            onChange={(e) =>
                                setReturnOfficeId(e.target.value)
                            }
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </Modal>

            <Modal
                show={modal === 'cancel'}
                onClose={() => setModal(null)}
                title="Cancel document"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setModal(null)}
                        >
                            Keep document
                        </Button>
                        <Button
                            variant="danger"
                            loading={busy}
                            onClick={() =>
                                post(
                                    route('documents.cancel', document.id),
                                    { reason }
                                )
                            }
                        >
                            Cancel document
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    This will stop the routing process. Previous route history
                    is preserved.
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

/* ------------------------------------------------------------------ */
/*  Reusable section content (shared by mobile tabs + desktop grid)    */
/* ------------------------------------------------------------------ */

function DocumentInfoCard({ document }) {
    return (
        <Card title="Document Information" icon={FileText}>
            <dl className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
                <Row label="Tracking Number" mono>
                    {document.tracking_number}
                </Row>
                <Row label="Document Type">
                    {document.type?.name ?? '—'}
                </Row>
                <Row label="Transaction Category">
                    {document.transaction_category?.name ?? '—'}
                    {document.processing_days_per_office && (
                        <span className="ml-1 text-[11px] text-slate-500 sm:text-xs">
                            · {document.processing_days_per_office} day
                            {document.processing_days_per_office > 1
                                ? 's'
                                : ''}{' '}
                            per office
                        </span>
                    )}
                </Row>
                <Row label="Reference Number">
                    {document.reference_number ?? '—'}
                </Row>
                <Row label="Document Date">
                    {document.document_date
                        ? new Date(
                              document.document_date
                          ).toLocaleDateString()
                        : '—'}
                </Row>
                <Row label="Originating Office">
                    {document.originating_office?.name ?? '—'}
                </Row>
                <Row label="Created By">
                    {document.creator?.name ?? '—'}
                </Row>
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

function CurrentStatusCard({ document, lastEvent }) {
    return (
        <Card title="Current Status" icon={Building2}>
            <dl className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
                <Row label="Current Location">
                    {document.current_office?.name ?? '—'}
                </Row>
                <Row label="Authorized Destination">
                    {document.current_destination?.name ?? '—'}
                </Row>
                <Row label="Last Action">
                    {lastEvent?.event_type ?? '—'}
                </Row>
                <Row label="Last Action Time">
                    {lastEvent
                        ? new Date(lastEvent.created_at).toLocaleString()
                        : '—'}
                </Row>
                <Row label="Total Routing Time">
                    {formatDuration(document.total_routing_seconds ?? null)}
                </Row>
                <Row label="Completed At">
                    {document.completed_at
                        ? new Date(document.completed_at).toLocaleString()
                        : '—'}
                </Row>
            </dl>
        </Card>
    );
}

function RouteCard({ document }) {
    return (
        <Card title="Route" icon={Building2}>
            <RouteTimeline
                routes={document.routes ?? []}
                currentDestinationId={
                    document.current_destination_office_id
                }
            />
        </Card>
    );
}

function ProcessingTimeCardSection({ timingRoutes }) {
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
                            </p>
                            <ProcessingTimeCard route={r} />
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
                                <span className="text-[11px] text-slate-400">
                                    {new Date(
                                        event.created_at
                                    ).toLocaleString()}
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
                <p className="text-sm text-slate-500">
                    No activity recorded yet.
                </p>
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
                    This single QR code is used for the entire lifecycle of the
                    document.
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
                    <Button
                        className="w-full"
                        onClick={() => onOpen('forward')}
                    >
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
                {Icon && (
                    <Icon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                )}
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                    {title}
                </h3>
            </header>
            <div className="p-4">{children}</div>
        </section>
    );
}

/**
 * Responsive row:
 *  - Mobile: label + value inline (compact list, border between rows)
 *  - Desktop (sm+): label above value (block, inside a 2-column grid)
 */
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