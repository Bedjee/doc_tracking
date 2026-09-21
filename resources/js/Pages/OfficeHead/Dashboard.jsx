import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    FileText,
    Inbox,
    RotateCcw,
    Send,
    TrendingUp,
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export default function OfficeHeadDashboard({
    counts = {},
    operational = {},
    dailyActivity = [],
    statusDistribution = [],
    officePerformance = [],
}) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-slate-800 sm:text-lg">
                            Office Head Dashboard
                        </h2>
                        <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">
                            Operational overview for your office
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() =>
                            router.visit(route('head.monitor.index'))
                        }
                        aria-label="Monitor Documents"
                    >
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">
                            Monitor Documents
                        </span>
                    </Button>
                </div>
            }
        >
            <Head title="Office Head Dashboard" />

            <div className="mx-auto max-w-7xl space-y-3 px-3 py-3 sm:space-y-4 sm:px-6 sm:py-5 lg:px-8">
                {/* ============ OPERATIONAL STRIP ============ */}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                    <MetricTile
                        label="Awaiting receipt"
                        value={operational.awaiting_receipt ?? 0}
                        icon={Clock}
                        tone="sky"
                        href={route('head.documents.index')}
                    />
                    <MetricTile
                        label="In hand"
                        value={operational.in_hand ?? 0}
                        icon={Inbox}
                        tone="indigo"
                        href={route('head.documents.index')}
                    />
                    <MetricTile
                        label="Overdue"
                        value={operational.overdue ?? 0}
                        icon={AlertTriangle}
                        tone="red"
                        href={route('head.documents.index', {
                            overdue_only: 1,
                        })}
                        emphasize={(operational.overdue ?? 0) > 0}
                    />
                    <MetricTile
                        label="Completed this week"
                        value={operational.completed_this_week ?? 0}
                        icon={CheckCircle2}
                        tone="emerald"
                        href={route('head.documents.index')}
                    />
                </div>

                {/* ============ CHARTS ROW ============ */}
                <div className="grid gap-3 lg:grid-cols-3">
                    {/* Activity line chart */}
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-2">
                        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">
                                    Activity — last 14 days
                                </h3>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                    Documents created vs completed
                                </p>
                            </div>
                            <div className="flex items-center gap-3 text-[11px]">
                                <Legend color="#3b82f6" label="Created" />
                                <Legend color="#10b981" label="Completed" />
                            </div>
                        </header>
                        <div className="p-3 sm:p-4">
                            <ActivityChart data={dailyActivity} />
                        </div>
                    </section>

                    {/* Status donut */}
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <header className="border-b border-slate-100 px-4 py-3">
                            <h3 className="text-sm font-semibold text-slate-800">
                                Status distribution
                            </h3>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                                All documents in your office
                            </p>
                        </header>
                        <div className="p-4">
                            <StatusDonut data={statusDistribution} />
                        </div>
                    </section>
                </div>

                {/* ============ BOTTOM ROW ============ */}
                <div className="grid gap-3 lg:grid-cols-3">
                    {/* Destination office performance */}
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-2">
                        <header className="border-b border-slate-100 px-4 py-3">
                            <h3 className="text-sm font-semibold text-slate-800">
                                Destination offices
                            </h3>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                                Where your documents go most — and how fast
                                they're handled
                            </p>
                        </header>
                        <div className="p-4">
                            <OfficePerformanceList
                                offices={officePerformance}
                            />
                        </div>
                    </section>

                    {/* Compact counters */}
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                       <header className="border-b border-slate-100 px-4 py-3">
    <div className="flex items-center justify-between gap-2">
        <div>
            <h3 className="text-sm font-semibold text-slate-800">
                Quick totals
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
                Current snapshot
            </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-700">
            {counts.total ?? 0}
        </span>
    </div>
</header>
                        <div className="grid grid-cols-2 gap-px bg-slate-100">
                            <CountCell
                                label="Total"
                                value={counts.total ?? 0}
                                icon={FileText}
                                tone="slate"
                            />
                            <CountCell
                                label="Ongoing"
                                value={counts.ongoing ?? 0}
                                icon={Send}
                                tone="sky"
                            />
                            <CountCell
                                label="In Hand"
                                value={counts.received ?? 0}
                                icon={Inbox}
                                tone="indigo"
                            />
                            <CountCell
                                label="Completed"
                                value={counts.completed ?? 0}
                                icon={CheckCircle2}
                                tone="emerald"
                            />
                            <CountCell
                                label="Returned"
                                value={counts.returned ?? 0}
                                icon={RotateCcw}
                                tone="amber"
                            />
                            <CountCell
                                label="Attention"
                                value={operational.overdue ?? 0}
                                icon={AlertTriangle}
                                tone="red"
                            />
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

/* ================================================================== */
/*  ACTIVITY LINE CHART (SVG)                                          */
/* ================================================================== */

function ActivityChart({ data = [] }) {
    if (!data.length) {
        return (
            <div className="flex h-40 items-center justify-center text-xs text-slate-400">
                No activity data yet.
            </div>
        );
    }

    const hasAny = data.some((d) => d.created > 0 || d.completed > 0);

    if (!hasAny) {
        return (
            <div className="flex h-40 flex-col items-center justify-center gap-1.5 text-center">
                <TrendingUp className="h-5 w-5 text-slate-300" />
                <p className="text-xs font-medium text-slate-500">
                    No activity in the last 14 days
                </p>
                <p className="text-[11px] text-slate-400">
                    Charts will populate as documents flow through your office.
                </p>
            </div>
        );
    }

    const width = 520;
    const height = 160;
    const pad = { top: 12, right: 12, bottom: 26, left: 28 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;

    const maxVal = Math.max(
        1,
        ...data.flatMap((d) => [d.created, d.completed])
    );

    const x = (i) =>
        pad.left + (i / Math.max(1, data.length - 1)) * innerW;
    const y = (v) => pad.top + innerH - (v / maxVal) * innerH;

    const createdLine = data
        .map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.created)}`)
        .join(' ');
    const completedLine = data
        .map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.completed)}`)
        .join(' ');
    const createdArea = `${createdLine} L ${x(
        data.length - 1
    )} ${pad.top + innerH} L ${x(0)} ${pad.top + innerH} Z`;

    // Y-axis ticks
    const yTicks = [0, 0.5, 1].map((r) => ({
        y: pad.top + innerH - r * innerH,
        value: Math.round(maxVal * r),
    }));

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-auto w-full"
            role="img"
            aria-label="Daily document activity"
        >
            <defs>
                <linearGradient id="createdArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* Gridlines */}
            {yTicks.map((t) => (
                <g key={t.y}>
                    <line
                        x1={pad.left}
                        x2={width - pad.right}
                        y1={t.y}
                        y2={t.y}
                        stroke="#e2e8f0"
                        strokeWidth="1"
                        strokeDasharray="3 4"
                    />
                    <text
                        x={pad.left - 6}
                        y={t.y + 3}
                        textAnchor="end"
                        className="fill-slate-400"
                        style={{ fontSize: 9 }}
                    >
                        {t.value}
                    </text>
                </g>
            ))}

            {/* Created area */}
            <path d={createdArea} fill="url(#createdArea)" />

            {/* Created line */}
            <path
                d={createdLine}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Completed line */}
            <path
                d={completedLine}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4 3"
            />

            {/* Points on created */}
            {data.map((d, i) => (
                <circle
                    key={i}
                    cx={x(i)}
                    cy={y(d.created)}
                    r="2.5"
                    fill="#fff"
                    stroke="#3b82f6"
                    strokeWidth="1.6"
                />
            ))}

            {/* X-axis labels — every other day */}
            {data.map((d, i) => {
                if (i % 2 !== 0 && i !== data.length - 1) return null;
                return (
                    <text
                        key={i}
                        x={x(i)}
                        y={height - 8}
                        textAnchor="middle"
                        className="fill-slate-400"
                        style={{ fontSize: 9 }}
                    >
                        {d.label}
                    </text>
                );
            })}
        </svg>
    );
}

function Legend({ color, label }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
            />
            {label}
        </span>
    );
}

/* ================================================================== */
/*  STATUS DONUT (SVG)                                                 */
/* ================================================================== */

function StatusDonut({ data = [] }) {
    const total = data.reduce((s, d) => s + (d.value ?? 0), 0);
    const R = 56;
    const C = 2 * Math.PI * R;
    const size = 160;
    const cx = size / 2;
    const cy = size / 2;

    return (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:flex-col">
            {/* Donut */}
            <div className="relative">
                <svg
                    viewBox={`0 0 ${size} ${size}`}
                    className="h-36 w-36"
                    role="img"
                    aria-label="Status distribution"
                >
                    {/* Base ring */}
                    <circle
                        cx={cx}
                        cy={cy}
                        r={R}
                        fill="none"
                        stroke="#f1f5f9"
                        strokeWidth="16"
                    />

                    {/* Slices */}
                    {total > 0 &&
                        (() => {
                            let offset = 0;
                            return data.map((slice) => {
                                if (!slice.value) return null;
                                const pct = slice.value / total;
                                const dash = pct * C;
                                const el = (
                                    <circle
                                        key={slice.name}
                                        cx={cx}
                                        cy={cy}
                                        r={R}
                                        fill="none"
                                        stroke={slice.color}
                                        strokeWidth="16"
                                        strokeDasharray={`${dash} ${C}`}
                                        strokeDashoffset={-offset}
                                        transform={`rotate(-90 ${cx} ${cy})`}
                                    />
                                );
                                offset += dash;
                                return el;
                            });
                        })()}

                    {/* Center total */}
                    <text
                        x={cx}
                        y={cy - 2}
                        textAnchor="middle"
                        className="fill-slate-900"
                        style={{ fontSize: 20, fontWeight: 700 }}
                    >
                        {total.toLocaleString()}
                    </text>
                    <text
                        x={cx}
                        y={cy + 14}
                        textAnchor="middle"
                        className="fill-slate-400"
                        style={{ fontSize: 9, letterSpacing: 1 }}
                    >
                        TOTAL
                    </text>
                </svg>
            </div>

            {/* Legend */}
            <ul className="w-full space-y-1.5">
                {data.map((slice) => {
                    const pct = total
                        ? Math.round((slice.value / total) * 100)
                        : 0;
                    return (
                        <li
                            key={slice.name}
                            className="flex items-center justify-between gap-3 text-xs"
                        >
                            <span className="flex min-w-0 items-center gap-2">
                                <span
                                    className="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                                    style={{ backgroundColor: slice.color }}
                                />
                                <span className="truncate text-slate-600">
                                    {slice.name}
                                </span>
                            </span>
                            <span className="flex-shrink-0 tabular-nums text-slate-700">
                                <span className="font-semibold">
                                    {slice.value}
                                </span>
                                <span className="ml-1 text-slate-400">
                                    {pct}%
                                </span>
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

/* ================================================================== */
/*  OFFICE PERFORMANCE — horizontal bars                               */
/* ================================================================== */

function OfficePerformanceList({ offices = [] }) {
    if (!offices.length) {
        return (
            <p className="py-6 text-center text-xs text-slate-400">
                No routing history yet.
            </p>
        );
    }

    const maxTotal = Math.max(...offices.map((o) => o.total), 1);

    return (
        <ul className="space-y-3">
            {offices.map((office) => {
                const pct = (office.total / maxTotal) * 100;
                return (
                    <li key={office.name} className="space-y-1">
                        <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="flex min-w-0 items-center gap-2">
                                <span className="truncate font-medium text-slate-700">
                                    {office.name}
                                </span>
                            </span>
                            <span className="flex flex-shrink-0 items-center gap-3 tabular-nums">
                                <span className="text-slate-500">
                                    {office.total} doc
                                    {office.total !== 1 ? 's' : ''}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                    <TrendingUp className="h-3 w-3 text-slate-400" />
                                    {office.avg_hours}h avg
                                </span>
                            </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

/* ================================================================== */
/*  SMALL TILES + CELLS                                                */
/* ================================================================== */

const METRIC_TONES = {
    sky: {
        chip: 'bg-sky-50 text-sky-700',
        ring: 'hover:border-sky-300',
    },
    indigo: {
        chip: 'bg-indigo-50 text-indigo-700',
        ring: 'hover:border-indigo-300',
    },
    emerald: {
        chip: 'bg-emerald-50 text-emerald-700',
        ring: 'hover:border-emerald-300',
    },
    red: {
        chip: 'bg-red-50 text-red-700',
        ring: 'hover:border-red-300',
    },
};

function MetricTile({ label, value, icon: Icon, tone = 'sky', href, emphasize }) {
    const t = METRIC_TONES[tone] ?? METRIC_TONES.sky;
    const safe = typeof value === 'number' ? value : 0;

    return (
        <Link
            href={href}
            className={`flex flex-col gap-2 rounded-xl border bg-white p-3 transition hover:shadow-sm sm:p-4 ${
                emphasize
                    ? 'border-red-200 ring-1 ring-red-100'
                    : 'border-slate-200'
            } ${t.ring}`}
        >
            <div className="flex items-center justify-between gap-2">
                <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${t.chip}`}
                >
                    <Icon className="h-4 w-4" />
                </span>
                {emphasize && safe > 0 && (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        !
                    </span>
                )}
            </div>
            <div>
                <p className="text-2xl font-semibold leading-none tabular-nums text-slate-900 sm:text-3xl">
                    {safe.toLocaleString()}
                </p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    {label}
                </p>
            </div>
        </Link>
    );
}

const COUNT_TONES = {
    slate: 'text-slate-700 bg-slate-100',
    sky: 'text-sky-700 bg-sky-50',
    indigo: 'text-indigo-700 bg-indigo-50',
    emerald: 'text-emerald-700 bg-emerald-50',
    amber: 'text-amber-700 bg-amber-50',
    red: 'text-red-700 bg-red-50',
};

function CountCell({ label, value, icon: Icon, tone = 'slate' }) {
    const safe = typeof value === 'number' ? value : 0;

    return (
        <div className="flex items-center gap-3 bg-white p-3">
            <span
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                    COUNT_TONES[tone] ?? COUNT_TONES.slate
                }`}
            >
                <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
                <p className="text-base font-semibold leading-none tabular-nums text-slate-900">
                    {safe.toLocaleString()}
                </p>
                <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    {label}
                </p>
            </div>
        </div>
    );
}