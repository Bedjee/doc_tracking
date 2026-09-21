const STYLES = {
    CREATED:   'bg-slate-100 text-slate-700 ring-slate-200',
    ONGOING:   'bg-sky-50 text-sky-700 ring-sky-200',
    RECEIVED:  'bg-indigo-50 text-indigo-700 ring-indigo-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    RETURNED:  'bg-amber-50 text-amber-700 ring-amber-200',
    CANCELLED: 'bg-red-50 text-red-700 ring-red-200',
};

export default function DocumentStatusBadge({ status, className = '' }) {
    const style = STYLES[status] ?? STYLES.CREATED;

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${style} ${className}`}>
            {status}
        </span>
    );
}