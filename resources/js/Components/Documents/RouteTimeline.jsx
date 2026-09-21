import { AlertTriangle, Check, CheckCircle2, Circle, Dot, Undo2 } from 'lucide-react';
import LiveElapsed from './LiveElapsed';

const STEP_META = {
    DONE:     { icon: Check,  ring: 'bg-emerald-600 border-emerald-600 text-white', line: 'bg-emerald-500' },
    RECEIVED: { icon: Dot,    ring: 'bg-indigo-600 border-indigo-600 text-white',  line: 'bg-slate-200' },
    CURRENT:  { icon: Circle, ring: 'bg-white border-amber-500 text-amber-500',    line: 'bg-slate-200' },
    PENDING:  { icon: Circle, ring: 'bg-white border-slate-300 text-slate-300',    line: 'bg-slate-200' },
    SKIPPED:  { icon: Circle, ring: 'bg-white border-slate-200 text-slate-300',    line: 'bg-slate-200' },
};

function Timestamp({ value }) {
    if (!value) return null;
    return (
        <span className="tabular-nums">
            {new Date(value).toLocaleString()}
        </span>
    );
}

export default function RouteTimeline({
    routes = [],
    currentDestinationId = null,
    frozen = false,
}) {
    if (!routes.length) {
        return <p className="text-sm text-slate-500">No route defined.</p>;
    }

    return (
        <ol className="relative space-y-0">
            {routes.map((step, index) => {
                const meta = STEP_META[step.status] ?? STEP_META.PENDING;
                const Icon = meta.icon;
                const isLast = index === routes.length - 1;

                const isOrigin = index === 0;

                // A step is "held" only while the document is in flight.
                // Once frozen (terminal document), nothing is still held.
                const isHeld = !frozen && step.received_at && !step.forwarded_at;
                const isOverdue = !frozen && step.is_overdue;
                const isAwaitingReceipt =
                    !frozen && step.status === 'CURRENT' && !step.received_at;

                // The final step on a completed document is what closes the
                // route — whether it was the destination or the trip back to
                // the origin for a return-to-sender flow.
                const isFinalCompletedStep = frozen && isLast;

                // Distinct ring for the return-to-sender leg.
                const ring = step.is_return_to_sender
                    ? step.status === 'DONE' || isFinalCompletedStep
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : step.status === 'RECEIVED'
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : step.status === 'CURRENT'
                            ? 'bg-white border-blue-500 text-blue-500'
                            : 'bg-white border-blue-200 text-blue-300'
                    : meta.ring;

                const line = step.is_return_to_sender ? 'bg-blue-400' : meta.line;

                return (
                    <li
                        key={step.id ?? step.sequence}
                        className="relative flex gap-3 pb-5 last:pb-0"
                    >
                        {!isLast && (
                            <span
                                className={`absolute left-[13px] top-7 h-full w-0.5 ${line}`}
                                aria-hidden
                            />
                        )}
                        <span
                            className={`relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${ring}`}
                        >
                            <Icon className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>

                        <div className="min-w-0 flex-1 pt-0.5">
                            {/* ---------- Header row ---------- */}
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-slate-800">
                                    {step.sequence}. {step.office?.name ?? 'Unknown office'}
                                </p>

                                {step.is_return && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700 ring-1 ring-inset ring-amber-200">
                                        <Undo2 className="h-3 w-3" /> Return
                                    </span>
                                )}

                                {step.is_return_to_sender && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-700 ring-1 ring-inset ring-blue-200">
                                        <Undo2 className="h-3 w-3" /> Return to Sender
                                    </span>
                                )}

                                {/* The final step on a completed document gets
                                    a green "Completed" chip instead of the
                                    misleading "Still held". */}
                                {isFinalCompletedStep && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                        <CheckCircle2 className="h-3 w-3" /> Completed
                                    </span>
                                )}

                                {isHeld && isOverdue && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-700 ring-1 ring-inset ring-red-200">
                                        <AlertTriangle className="h-3 w-3" /> Overdue
                                    </span>
                                )}

                                {isHeld && !isOverdue && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-indigo-700 ring-1 ring-inset ring-indigo-200">
                                        Still held
                                    </span>
                                )}

                                {isAwaitingReceipt && (
                                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700 ring-1 ring-inset ring-amber-200">
                                        Awaiting receipt
                                    </span>
                                )}

                                {step.status === 'SKIPPED' && (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                                        Skipped
                                    </span>
                                )}
                            </div>

                            {/* ---------- Timestamps ---------- */}
                            <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                                {step.received_at && (
                                    <div>
                                        <span className="font-medium text-slate-600">
                                            Received:{' '}
                                        </span>
                                        <Timestamp value={step.received_at} />
                                    </div>
                                )}

                                {step.forwarded_at && (
                                    <div>
                                        <span className="font-medium text-slate-600">
                                            Released:{' '}
                                        </span>
                                        <Timestamp value={step.forwarded_at} />
                                    </div>
                                )}

                                {isOrigin && step.forwarded_at && (
                                    <div className="italic text-slate-400">
                                        Originating office — no prior receipt.
                                    </div>
                                )}

                                {!isOrigin &&
                                    !step.received_at &&
                                    step.status !== 'SKIPPED' &&
                                    !frozen && (
                                        <div className="italic text-slate-400">
                                            Not yet received.
                                        </div>
                                    )}
                            </div>

                            {/* ---------- Processing time ---------- */}
                            {step.received_at && (
                                <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-xs">
                                    <span className="font-medium text-slate-600">
                                        Processing time:
                                    </span>
                                    <span
                                        className={`font-semibold ${
                                            isHeld
                                                ? isOverdue
                                                    ? 'text-red-700'
                                                    : 'text-indigo-700'
                                                : 'text-slate-800'
                                        }`}
                                    >
                                        <LiveElapsed
                                            from={step.received_at}
                                            forwardedAt={step.forwarded_at}
                                            frozen={frozen}
                                        />
                                    </span>

                                    {/* "(still counting)" only appears while
                                        the document is genuinely in flight. */}
                                    {isHeld && !frozen && (
                                        <span className="text-slate-400">
                                            (still counting)
                                        </span>
                                    )}

                                    {/* On the final completed step, tag the
                                        value as final. */}
                                    {isFinalCompletedStep && !step.forwarded_at && (
                                        <span className="text-emerald-600">
                                            (final)
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}