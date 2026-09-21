import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    Building2,
    CheckCircle2,
    Clock,
    FileText,
    Inbox,
    Plus,
    Send,
    TrendingUp,
    Users as UsersIcon,
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';
import DocumentStatusBadge from '@/Components/Documents/DocumentStatusBadge';

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export default function AdminDashboard({
    counts = {},
    systemTotals = {},
    operational = {},
    dailyActivity = [],
    statusDistribution = [],
    officePerformance = [],
    topCategories = [],
    recentDocuments = [],
}) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-slate-800 sm:text-lg">
                            Administrator Dashboard
                        </h2>
                        <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">
                            System-wide monitoring · Municipality of Opol
                        </p>
                    </div>
                    <div className="flex flex-shrink-0 gap-2">
                        <Button
                            variant="secondary"
                            onClick={() =>
                                router.visit(route('admin.documents.index'))
                            }
                            aria-label="All Documents"
                        >
                            <FileText className="h-4 w-4" />
                            <span className="hidden sm:inline">
                                All Documents
                            </span>
                        </Button>
                        <Button
                            onClick={() => router.visit(route('users.create'))}
                            aria-label="New User"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">New User</span>
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title="Admin Dashboard" />

            <div className="mx-auto max-w-7xl space-y-3 px-3 py-3 sm:space-y-4 sm:px-6 sm:py-5 lg:px-8">
                {/* ============================================ */}
                {/*  OPERATIONAL TILES                            */}
                {/* ============================================ */}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                    <MetricTile
                        label="In Progress"
                        value={operational.active ?? 0}
                        icon={Send}
                        tone="sky"
                        href={route('admin.documents.index')}
                        sublabel={`${counts.created ?? 0} created · ${counts.ongoing ?? 0} ongoing`}
                    />
                    <MetricTile
                        label="Overdue"
                        value={operational.overdue ?? 0}
                        icon={AlertTriangle}
                        tone="red"
                        href={route('admin.monitor.index', {
                            scope: 'active',
                            overdue_only: 1,
                        })}
                        emphasize={(operational.overdue ?? 0) > 0}
                    />
                    <MetricTile
                        label="Awaiting Receipt"
                        value={operational.awaiting_receipt ?? 0}
                        icon={Inbox}
                        tone="indigo"
                        href={route('admin.monitor.index')}
                    />
                    <MetricTile
                        label="Completed This Week"
                        value={operational.completed_this_week ?? 0}
                        icon={CheckCircle2}
                        tone="emerald"
                        href={route('admin.documents.index')}
                        sublabel={`${operational.created_this_week ?? 0} created`}
                    />
                </div>

                {/* ============================================ */}
                {/*  CHARTS                                       */}
                {/* ============================================ */}
                <div className="grid gap-3 lg:grid-cols-3">
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-2">
                        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">
                                    System activity — last 30 days
                                </h3>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                    Documents created vs completed across all
                                    offices
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

                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <header className="border-b border-slate-100 px-4 py-3">
                            <h3 className="text-sm font-semibold text-slate-800">
                                Status distribution
                            </h3>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                                All documents in the system
                            </p>
                        </header>
                        <div className="p-4">
                            <StatusDonut data={statusDistribution} />
                        </div>
                    </section>
                </div>

                {/* ============================================ */}
                {/*  PERFORMANCE + SYSTEM INFO                    */}
                {/* ============================================ */}
                <div className="grid gap-3 lg:grid-cols-3">
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-2">
                        <header className="border-b border-slate-100 px-4 py-3">
                            <h3 className="text-sm font-semibold text-slate-800">
                                Office performance
                            </h3>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                                Top 6 offices by routed-document volume ·
                                average handling time
                            </p>
                        </header>
                        <div className="p-4">
                            <OfficePerformanceList
                                offices={officePerformance}
                            />
                        </div>
                    </section>

                    <div className="space-y-3">
                        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <header className="border-b border-slate-100 px-4 py-3">
                                <h3 className="text-sm font-semibold text-slate-800">
                                    System totals
                                </h3>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                    Users &amp; offices
                                </p>
                            </header>
                            <div className="grid grid-cols-2 gap-px bg-slate-100">
                                <Link
                                    href={route('users.index')}
                                    className="flex flex-col gap-1.5 bg-white p-3 transition hover:bg-slate-50"
                                >
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                                        <UsersIcon className="h-3.5 w-3.5" />
                                    </span>
                                    <p className="text-lg font-semibold leading-none tabular-nums text-slate-900">
                                        {(systemTotals.users ?? 0).toLocaleString()}
                                    </p>
                                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                        Active users
                                    </p>
                                </Link>
                                <Link
                                    href={route('offices.index')}
                                    className="flex flex-col gap-1.5 bg-white p-3 transition hover:bg-slate-50"
                                >
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                                        <Building2 className="h-3.5 w-3.5" />
                                    </span>
                                    <p className="text-lg font-semibold leading-none tabular-nums text-slate-900">
                                        {(systemTotals.offices ?? 0).toLocaleString()}
                                    </p>
                                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                        Active offices
                                    </p>
                                </Link>
                            </div>
                        </section>

                        {/* ---------- Top categories (was: Top document types) ---------- */}
                        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <header className="border-b border-slate-100 px-4 py-3">
                                <h3 className="text-sm font-semibold text-slate-800">
                                    Top categories
                                </h3>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                    Workload by processing window
                                </p>
                            </header>
                            <div className="p-4">
                                <CategoryList categories={topCategories} />
                            </div>
                        </section>
                    </div>
                </div>

                {/* ============================================ */}
                {/*  RECENT DOCUMENTS                             */}
                {/* ============================================ */}
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-800">
                                Recent documents
                            </h3>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                                Latest documents registered in the system
                            </p>
                        </div>
                        <Link
                            href={route('admin.documents.index')}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                            View all
                            <ArrowRight className="h-3 w-3" />
                        </Link>
                    </header>

                    <ul className="divide-y divide-slate-100">
                        {recentDocuments.map((doc) => (
                            <li key={doc.id}>
                                <Link
                                    href={route(
                                        'admin.documents.show',
                                        doc.id
                                    )}
                                    className="flex items-center justify-between gap-3 px-4 py-2.5 transition hover:bg-slate-50/70"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-sm font-medium text-slate-800">
                                                {doc.title}
                                            </p>
                                        </div>
                                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                                            <span className="truncate font-mono">
                                                {doc.tracking_number}
                                            </span>
                                            {doc.current_office?.name && (
                                                <>
                                                    <span
                                                        className="text-slate-300"
                                                        aria-hidden
                                                    >
                                                        ·
                                                    </span>
                                                    <span className="truncate">
                                                        {doc.current_office.name}
                                                    </span>
                                                </>
                                            )}
                                            {doc.current_destination
                                                ?.name && (
                                                <>
                                                    <span
                                                        className="text-slate-300"
                                                        aria-hidden
                                                    >
                                                        →
                                                    </span>
                                                    <span className="truncate">
                                                        {
                                                            doc
                                                                .current_destination
                                                                .name
                                                        }
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <DocumentStatusBadge
                                            status={doc.status}
                                        />
                                    </div>
                                </Link>
                            </li>
                        ))}
                        {recentDocuments.length === 0 && (
                            <li className="px-4 py-8 text-center text-xs text-slate-500">
                                No documents registered yet.
                            </li>
                        )}
                    </ul>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

/* ================================================================== */
/*  ACTIVITY LINE CHART                                                */
/* ================================================================== */

function ActivityChart({ data = [] }) {
    if (!data.length) {
        return (
            <div className="flex h-44 items-center justify-center text-xs text-slate-400">
                No activity data yet.
            </div>
        );
    }

    const hasAny = data.some((d) => d.created > 0 || d.completed > 0);

    if (!hasAny) {
        return (
            <div className="flex h-44 flex-col items-center justify-center gap-1.5 text-center">
                <TrendingUp className="h-5 w-5 text-slate-300" />
                <p className="text-xs font-medium text-slate-500">
                    No activity in the last 30 days
                </p>
                <p className="text-[11px] text-slate-400">
                    Charts will populate as documents are registered.
                </p>
            </div>
        );
    }

    const width = 720;
    const height = 180;
    const pad = { top: 14, right: 12, bottom: 26, left: 30 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;

    const maxVal = Math.max(
        1,
        ...data.flatMap((d) => [d.created, d.completed])
    );

    const x = (i) => pad.left + (i / Math.max(1, data.length - 1)) * innerW;
    const y = (v) => pad.top + innerH - (v / maxVal) * innerH;

    const createdLine = data
        .map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.created)}`)
        .join(' ');
    const completedLine = data
        .map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.completed)}`)
        .join(' ');
    const createdArea = `${createdLine} L ${x(data.length - 1)} ${
        pad.top + innerH
    } L ${x(0)} ${pad.top + innerH} Z`;

    const yTicks = [0, 0.5, 1].map((r) => ({
        y: pad.top + innerH - r * innerH,
        value: Math.round(maxVal * r),
    }));

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-auto w-full"
            role="img"
            aria-label="System activity"
        >
            <defs>
                <linearGradient id="adminArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
            </defs>

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

            <path d={createdArea} fill="url(#adminArea)" />
            <path
                d={createdLine}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d={completedLine}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4 3"
            />

            {data.map((d, i) => {
                if (i % 5 !== 0 && i !== data.length - 1) return null;
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
/*  STATUS DONUT                                                       */
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
            <div className="relative flex-shrink-0">
                <svg
                    viewBox={`0 0 ${size} ${size}`}
                    className="h-36 w-36"
                    role="img"
                    aria-label="Status distribution"
                >
                    <circle
                        cx={cx}
                        cy={cy}
                        r={R}
                        fill="none"
                        stroke="#f1f5f9"
                        strokeWidth="16"
                    />

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
/*  OFFICE PERFORMANCE                                                 */
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
            {offices.map((office, i) => {
                const pct = (office.total / maxTotal) * 100;
                const isFast = office.avg_hours > 0 && office.avg_hours <= 24;
                const isSlow = office.avg_hours > 72;

                return (
                    <li key={`${office.name}-${i}`} className="min-w-0 space-y-1.5">
                        <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold tabular-nums text-slate-500">
                                {i + 1}
                            </span>

                            <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
                                {office.name}
                            </span>

                            <span className="flex flex-shrink-0 items-center gap-1.5 text-[11px] tabular-nums">
                                <span className="whitespace-nowrap text-slate-500">
                                    {office.total}{' '}
                                    {office.total !== 1 ? 'docs' : 'doc'}
                                </span>
                                <span
                                    className={`inline-flex items-center whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                        isSlow
                                            ? 'bg-red-50 text-red-700'
                                            : isFast
                                              ? 'bg-emerald-50 text-emerald-700'
                                              : 'bg-slate-100 text-slate-700'
                                    }`}
                                >
                                    {office.avg_hours}h
                                </span>
                            </span>
                        </div>

                        <div className="ml-7 h-1.5 overflow-hidden rounded-full bg-slate-100">
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
/*  TOP CATEGORIES LIST (was: Top document types)                      */
/* ================================================================== */

function formatCategoryRange(minDays, maxDays) {
    if (!minDays && !maxDays) return null;
    if (!maxDays || minDays === maxDays) {
        return `${minDays} day${minDays > 1 ? 's' : ''}`;
    }
    return `${minDays}–${maxDays} days`;
}

function CategoryList({ categories = [] }) {
    if (!categories.length) {
        return (
            <p className="py-4 text-center text-[11px] text-slate-400">
                No categorized documents yet.
            </p>
        );
    }

    const maxTotal = Math.max(...categories.map((c) => c.total), 1);

    return (
        <ul className="space-y-2">
            {categories.map((cat) => {
                const pct = (cat.total / maxTotal) * 100;
                const range = formatCategoryRange(cat.min_days, cat.max_days);

                return (
                    <li key={cat.name}>
                        <div className="flex items-baseline justify-between gap-2 text-[11px]">
                            <span className="min-w-0 flex-1 truncate font-medium text-slate-700">
                                {cat.name}
                                {range && (
                                    <span className="ml-1.5 inline-flex items-center gap-0.5 whitespace-nowrap text-[10px] font-normal text-slate-500">
                                        <Clock className="h-2.5 w-2.5" />
                                        {range}
                                    </span>
                                )}
                            </span>
                            <span className="flex-shrink-0 tabular-nums text-slate-500">
                                {cat.total}
                            </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-slate-700"
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
/*  METRIC TILE                                                        */
/* ================================================================== */

const METRIC_TONES = {
    sky:     { chip: 'bg-sky-50 text-sky-700',         ring: 'hover:border-sky-300' },
    indigo:  { chip: 'bg-indigo-50 text-indigo-700',   ring: 'hover:border-indigo-300' },
    emerald: { chip: 'bg-emerald-50 text-emerald-700', ring: 'hover:border-emerald-300' },
    red:     { chip: 'bg-red-50 text-red-700',         ring: 'hover:border-red-300' },
};

function MetricTile({
    label,
    value,
    icon: Icon,
    tone = 'sky',
    href,
    emphasize,
    sublabel,
}) {
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
                {sublabel && (
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">
                        {sublabel}
                    </p>
                )}
            </div>
        </Link>
    );
}