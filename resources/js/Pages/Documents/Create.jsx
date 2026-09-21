import { useEffect, useMemo, useRef, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    Building2,
    Check,
    ChevronDown,
    Clock,
    ImagePlus,
    Loader2,
    Lock,
    Plus,
    RotateCcw,
    ScanText,
    Search,
    Sparkles,
    Trash2,
    Undo2,
    X,
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';
import { useToast } from '@/Components/UI/Toast';

export default function Create({
    offices = [],
    types = [],
    categories = [],
    defaultOriginatingOfficeId = null,
}) {
    const toast = useToast();
    const fileInput = useRef(null);

    const [ocrLoading, setOcrLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [ocrRaw, setOcrRaw] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        document_type_id: '',
        transaction_category_id: '',
        reference_number: '',
        document_date: '',
        subject: '',
        originating_office_id: defaultOriginatingOfficeId ?? '',
        route: [],
        return_to_sender: false,
        remarks: '',
        document_image_path: '',
        ocr_raw_text: '',
    });

    const officeById = useMemo(
        () => Object.fromEntries(offices.map((o) => [String(o.id), o])),
        [offices]
    );

    // Destinations exclude the user's own office — you can't route a
    // document back to yourself through the normal flow.
    const selectableOffices = useMemo(
        () =>
            offices.filter(
                (o) => String(o.id) !== String(data.originating_office_id)
            ),
        [offices, data.originating_office_id]
    );

    const selectedCategory = useMemo(
        () =>
            categories.find(
                (c) => String(c.id) === String(data.transaction_category_id)
            ),
        [categories, data.transaction_category_id]
    );

    const processingDaysLabel = useMemo(() => {
        if (!selectedCategory) return '';
        const { min_days, max_days } = selectedCategory;
        if (min_days === max_days) {
            return `${min_days} day${min_days > 1 ? 's' : ''}`;
        }
        return `${min_days}–${max_days} days`;
    }, [selectedCategory]);

    // If the user has no office assigned, we cannot create documents.
    const hasOffice = !!data.originating_office_id;

    /* ---------------- OCR ---------------- */

    async function handleImage(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        setImagePreview(URL.createObjectURL(file));
        setOcrLoading(true);

        const body = new FormData();
        body.append('image', file);

        try {
            const res = await fetch(route('documents.ocr'), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN':
                        document.querySelector('meta[name="csrf-token"]')
                            ?.content ?? '',
                    Accept: 'application/json',
                },
                body,
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(
                    json.message ||
                        Object.values(json.errors ?? {})[0]?.[0] ||
                        'OCR request failed'
                );
            }

            const s = json.suggestions ?? {};

            setData({
                ...data,
                document_image_path:
                    json.document_image_path ?? data.document_image_path,
                ocr_raw_text: json.raw_text ?? data.ocr_raw_text ?? '',
                title: !data.title && s.title ? s.title : data.title,
                reference_number:
                    !data.reference_number && s.reference_number
                        ? s.reference_number
                        : data.reference_number,
                document_date:
                    !data.document_date && s.document_date
                        ? s.document_date
                        : data.document_date,
                subject:
                    !data.subject && s.subject ? s.subject : data.subject,
            });

            setOcrRaw(json.raw_text ?? '');

            if (
                s.title ||
                s.reference_number ||
                s.document_date ||
                s.subject
            ) {
                toast.success(
                    'OCR finished. Review and confirm the detected information.'
                );
            } else {
                toast.warning(
                    'OCR found no usable text. Please fill in the fields manually.'
                );
            }
        } catch (e) {
            console.error('OCR error:', e);
            toast.error(e.message || 'OCR could not read the image.');
        } finally {
            setOcrLoading(false);
        }
    }

    /* ---------------- Route builder ---------------- */

    function addOffice(id) {
        if (!id) return;
        const numId = Number(id);
        if (data.route.includes(numId)) {
            toast.warning('That office is already in the route.');
            return;
        }
        setData('route', [...data.route, numId]);
    }

    function removeOffice(index) {
        setData(
            'route',
            data.route.filter((_, i) => i !== index)
        );
    }

    function move(index, direction) {
        const next = [...data.route];
        const target = index + direction;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        setData('route', next);
    }

    function submit(e) {
        e.preventDefault();
        post(route('documents.store'));
    }

    const originName =
        officeById[String(data.originating_office_id)]?.name ?? '—';

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-lg font-semibold text-slate-800">
                    Register New Document
                </h2>
            }
        >
            <Head title="Register Document" />

            <form
                onSubmit={submit}
                className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 lg:px-8"
            >
                {/* ---------- No office warning ---------- */}
                {!hasOffice && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        <p className="font-semibold">
                            Your account is not assigned to an office.
                        </p>
                        <p className="mt-1">
                            Ask an administrator to assign you to an office
                            before you can register documents.
                        </p>
                    </div>
                )}

                {/* ---------- Step 1: Photo + OCR ---------- */}
                <section className="rounded-xl border border-slate-200 bg-white p-5">
                    <header className="mb-4 flex items-start gap-3">
                        <ScanText className="mt-0.5 h-5 w-5 text-slate-500" />
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">
                                Document photo &amp; OCR assist
                            </h3>
                            <p className="text-xs text-slate-500">
                                Upload a photo of the first page. OCR suggests
                                values — you always confirm them.
                            </p>
                        </div>
                    </header>

                    <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
                        <div>
                            <input
                                ref={fileInput}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handleImage}
                            />
                            {imagePreview ? (
                                <div className="relative overflow-hidden rounded-lg border border-slate-200">
                                    <img
                                        src={imagePreview}
                                        alt="Document preview"
                                        className="h-44 w-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImagePreview(null);
                                            setData({
                                                ...data,
                                                document_image_path: '',
                                            });
                                            if (fileInput.current)
                                                fileInput.current.value = '';
                                        }}
                                        className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-slate-600 shadow"
                                        aria-label="Remove image"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInput.current?.click()}
                                    className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 transition hover:border-slate-400 hover:bg-slate-50"
                                >
                                    {ocrLoading ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        <ImagePlus className="h-6 w-6" />
                                    )}
                                    <span className="text-xs font-medium">
                                        {ocrLoading
                                            ? 'Reading document…'
                                            : 'Take / upload photo'}
                                    </span>
                                </button>
                            )}

                            {ocrRaw && (
                                <details className="mt-3 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
                                    <summary className="cursor-pointer font-medium">
                                        OCR raw text
                                    </summary>
                                    <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px]">
                                        {ocrRaw}
                                    </pre>
                                </details>
                            )}
                        </div>

                        <div className="space-y-4">
                            <Field
                                label="Document Title"
                                error={errors.title}
                                required
                            >
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData('title', e.target.value)
                                    }
                                    placeholder="e.g. Request for Purchase Order"
                                    className="input"
                                />
                                {data.title && (
                                    <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600">
                                        <Sparkles className="h-3 w-3" />{' '}
                                        Confirm or edit the suggested title.
                                    </p>
                                )}
                            </Field>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label="Reference Number"
                                    error={errors.reference_number}
                                >
                                    <input
                                        type="text"
                                        value={data.reference_number}
                                        onChange={(e) =>
                                            setData(
                                                'reference_number',
                                                e.target.value
                                            )
                                        }
                                        className="input"
                                    />
                                </Field>
                                <Field
                                    label="Document Date"
                                    error={errors.document_date}
                                >
                                    <input
                                        type="date"
                                        value={data.document_date}
                                        onChange={(e) =>
                                            setData(
                                                'document_date',
                                                e.target.value
                                            )
                                        }
                                        className="input"
                                    />
                                </Field>
                            </div>

                            <Field
                                label="Document Type"
                                error={errors.document_type_id}
                            >
                                <select
                                    value={data.document_type_id}
                                    onChange={(e) =>
                                        setData(
                                            'document_type_id',
                                            e.target.value
                                        )
                                    }
                                    className="input"
                                >
                                    <option value="">— Select type —</option>
                                    {types.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                    </div>

                    {/* ---------- Transaction Category ---------- */}
                    <div className="mt-4">
                        <Field
                            label="Transaction Category"
                            error={errors.transaction_category_id}
                            required
                        >
                            <select
                                value={data.transaction_category_id}
                                onChange={(e) =>
                                    setData({
                                        ...data,
                                        transaction_category_id: e.target.value,
                                    })
                                }
                                className="input"
                            >
                                <option value="">— Select category —</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ·{' '}
                                        {c.min_days === c.max_days
                                            ? `${c.min_days} day${
                                                  c.min_days > 1 ? 's' : ''
                                              }`
                                            : `${c.min_days}–${c.max_days} days`}{' '}
                                        per office
                                    </option>
                                ))}
                            </select>
                        </Field>

                        {selectedCategory && (
                            <div className="mt-2 flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
                                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <div>
                                    <p className="font-semibold">
                                        {selectedCategory.name}
                                    </p>
                                    <p className="mt-0.5">
                                        Each office in the route will have{' '}
                                        <strong>{processingDaysLabel}</strong> to
                                        process this document, counted from the
                                        moment it is received.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4">
                        <Field
                            label="Subject / Description"
                            error={errors.subject}
                        >
                            <textarea
                                rows={3}
                                value={data.subject}
                                onChange={(e) =>
                                    setData('subject', e.target.value)
                                }
                                className="input resize-y"
                            />
                        </Field>
                    </div>
                </section>

                {/* ---------- Step 2: Office + Route ---------- */}
                <section className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="mb-4 text-sm font-semibold text-slate-900">
                        Originating office &amp; route
                    </h3>

                    {/* ---------- Locked originating office ---------- */}
                    <div>
                        <span className="mb-1 block text-xs font-medium text-slate-600">
                            Originating Office
                        </span>

                        <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
                                <Building2 className="h-4 w-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800">
                                    {originName}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                                    <Lock className="h-3 w-3" />
                                    Locked to your assigned office
                                </p>
                            </div>
                        </div>

                        <p className="mt-1.5 text-[11px] text-slate-500">
                            Documents can only be registered under your own
                            office. Routing destinations are chosen below.
                        </p>

                        {errors.originating_office_id && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.originating_office_id}
                            </p>
                        )}
                    </div>

                    <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Route preview
                        </p>

                        <ol className="mt-3 space-y-1.5 text-sm">
                            <li className="flex items-center gap-2 font-semibold text-slate-800">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] text-white">
                                    1
                                </span>
                                {originName}
                                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-600">
                                    Origin
                                </span>
                            </li>

                            {data.route.map((officeId, index) => (
                                <li
                                    key={`${officeId}-${index}`}
                                    className="flex items-center gap-2"
                                >
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-slate-600 ring-1 ring-slate-300">
                                        {index + 2}
                                    </span>
                                    <span className="flex-1 truncate text-slate-700">
                                        {officeById[String(officeId)]?.name ??
                                            'Unknown'}
                                    </span>
                                    <div className="flex items-center gap-0.5">
                                        <IconBtn
                                            onClick={() => move(index, -1)}
                                            disabled={index === 0}
                                            label="Move up"
                                        >
                                            <ArrowUp className="h-3.5 w-3.5" />
                                        </IconBtn>
                                        <IconBtn
                                            onClick={() => move(index, 1)}
                                            disabled={
                                                index === data.route.length - 1
                                            }
                                            label="Move down"
                                        >
                                            <ArrowDown className="h-3.5 w-3.5" />
                                        </IconBtn>
                                        <IconBtn
                                            onClick={() => removeOffice(index)}
                                            label="Remove"
                                            danger
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </IconBtn>
                                    </div>
                                </li>
                            ))}

                            {data.route.length === 0 && (
                                <li className="pl-8 text-xs italic text-slate-400">
                                    No destinations added yet.
                                </li>
                            )}

                            {/* ---------- Return to Sender final step ---------- */}
                            {data.return_to_sender && data.route.length > 0 && (
                                <li className="flex items-center gap-2">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-300">
                                        {data.route.length + 2}
                                    </span>
                                    <span className="flex-1 truncate font-medium text-slate-700">
                                        {originName}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 ring-1 ring-inset ring-blue-200">
                                        <Undo2 className="h-2.5 w-2.5" />
                                        Return to Sender
                                    </span>
                                </li>
                            )}
                        </ol>

                        {/* ---------- Office picker ---------- */}
                        <div className="mt-4">
                            <OfficePicker
                                offices={selectableOffices}
                                addedIds={data.route}
                                onSelect={addOffice}
                            />
                        </div>

                        {errors.route && (
                            <p className="mt-2 text-xs text-red-600">
                                {errors.route}
                            </p>
                        )}

                        {/* ---------- Return to Sender option ---------- */}
                        <div className="mt-4 border-t border-slate-200 pt-4">
                            <label
                                className={`flex select-none items-start gap-3 ${
                                    data.route.length === 0
                                        ? 'cursor-not-allowed opacity-60'
                                        : 'cursor-pointer'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={data.return_to_sender}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            return_to_sender: e.target.checked,
                                        })
                                    }
                                    disabled={data.route.length === 0}
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                                        <Undo2 className="h-3.5 w-3.5 text-blue-600" />
                                        Return to Sender
                                    </span>
                                    <span className="mt-0.5 block text-xs text-slate-500">
                                        The document will only be marked as{' '}
                                        <strong className="font-semibold">
                                            Completed
                                        </strong>{' '}
                                        after it is physically returned to{' '}
                                        <span className="font-semibold text-slate-700">
                                            {originName}
                                        </span>
                                        .
                                    </span>
                                </span>
                            </label>

                            {data.return_to_sender && (
                                <div className="mt-2 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                                    <Undo2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <p>
                                        <strong>{originName}</strong> is now the
                                        final step in the route. The document
                                        will make a round trip — it will not be
                                        considered finished until it arrives
                                        back at your office.
                                    </p>
                                </div>
                            )}

                            {data.route.length === 0 && (
                                <p className="mt-2 text-[11px] text-slate-400">
                                    Add at least one destination office before
                                    enabling this option.
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* ---------- Step 3: Remarks ---------- */}
                <section className="rounded-xl border border-slate-200 bg-white p-5">
                    <Field label="Remarks (optional)" error={errors.remarks}>
                        <textarea
                            rows={2}
                            value={data.remarks}
                            onChange={(e) => setData('remarks', e.target.value)}
                            className="input resize-y"
                        />
                    </Field>
                </section>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => router.visit(route('documents.index'))}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        loading={processing}
                        size="lg"
                        disabled={!hasOffice}
                    >
                        Register Document
                    </Button>
                </div>
            </form>

            <style>{`
                .input {
                    width: 100%;
                    border-radius: 0.375rem;
                    border: 1px solid #cbd5e1;
                    padding: 0.5rem 0.75rem;
                    font-size: 0.875rem;
                    color: #0f172a;
                    background: #fff;
                }
                .input:focus {
                    outline: none;
                    border-color: #0f172a;
                    box-shadow: 0 0 0 3px rgba(15,23,42,0.08);
                }

                @keyframes fade-in {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to   { transform: translateY(0); }
                }

                .animate-fade-in {
                    animation: fade-in 150ms ease-out;
                }

                @media (max-width: 639px) {
                    .office-picker-panel {
                        animation: slide-up 220ms cubic-bezier(0.16, 1, 0.3, 1);
                    }
                }
                @media (min-width: 640px) {
                    .office-picker-panel {
                        animation: fade-in 150ms ease-out;
                    }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Field wrapper                                                      */
/* ------------------------------------------------------------------ */

function Field({ label, error, required, children }) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
                {label} {required && <span className="text-red-500">*</span>}
            </span>
            {children}
            {error && (
                <span className="mt-1 block text-xs text-red-600">{error}</span>
            )}
        </label>
    );
}

/* ------------------------------------------------------------------ */
/*  Small icon button                                                  */
/* ------------------------------------------------------------------ */

function IconBtn({ children, onClick, disabled, danger, label }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className={`rounded p-1 transition disabled:opacity-30 ${
                danger
                    ? 'text-red-500 hover:bg-red-50'
                    : 'text-slate-500 hover:bg-slate-200'
            }`}
        >
            {children}
        </button>
    );
}

/* ------------------------------------------------------------------ */
/*  Office picker — searchable modal / bottom-sheet                    */
/* ------------------------------------------------------------------ */

function OfficePicker({ offices = [], addedIds = [], onSelect }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    // Reset query and autofocus the search when opening
    useEffect(() => {
        if (!open) {
            setQuery('');
            return;
        }
        const t = setTimeout(() => inputRef.current?.focus(), 80);
        return () => clearTimeout(t);
    }, [open]);

    // Esc closes
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === 'Escape' && setOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    // Lock body scroll while open (matters on mobile)
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    const addedSet = useMemo(
        () => new Set(addedIds.map(String)),
        [addedIds]
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return offices;
        return offices.filter(
            (o) =>
                o.name?.toLowerCase().includes(q) ||
                o.code?.toLowerCase().includes(q)
        );
    }, [offices, query]);

    function choose(id) {
        onSelect(id);
        setOpen(false);
    }

    // Enter picks the first available match
    function onSearchKeyDown(e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const firstAvailable = filtered.find(
            (o) => !addedSet.has(String(o.id))
        );
        if (firstAvailable) choose(firstAvailable.id);
    }

    return (
        <>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="group flex w-full items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-left transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
                <span className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
                        <Plus className="h-4 w-4" strokeWidth={2.4} />
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-800">
                            Add destination office
                        </span>
                        <span className="block truncate text-[11px] text-slate-500">
                            {offices.length} office
                            {offices.length === 1 ? '' : 's'} available
                        </span>
                    </span>
                </span>
                <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-400 transition group-hover:text-slate-600" />
            </button>

            {/* Picker overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Add destination office"
                >
                    {/* Backdrop */}
                    <div
                        className="animate-fade-in absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />

                    {/* Panel */}
                    <div className="office-picker-panel relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 sm:max-h-[80vh] sm:rounded-2xl">
                        {/* Mobile drag handle */}
                        <div className="flex justify-center pt-2.5 sm:hidden">
                            <div className="h-1 w-10 rounded-full bg-slate-300" />
                        </div>

                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-3">
                            <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-slate-800">
                                    Add destination office
                                </h3>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                    Choose where this document goes next
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="-mr-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="border-b border-slate-100 px-3 py-2.5">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) =>
                                        setQuery(e.target.value)
                                    }
                                    onKeyDown={onSearchKeyDown}
                                    placeholder="Search offices…"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                />
                                {query && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setQuery('');
                                            inputRef.current?.focus();
                                        }}
                                        className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                                        aria-label="Clear search"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* List */}
                        <div className="min-h-0 flex-1 overflow-y-auto p-2">
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-10 text-center">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                        <Search className="h-4 w-4" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-700">
                                        No offices found
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        Try a different search term.
                                    </p>
                                </div>
                            ) : (
                                <ul className="space-y-0.5">
                                    {filtered.map((office) => {
                                        const isAdded = addedSet.has(
                                            String(office.id)
                                        );
                                        return (
                                            <li key={office.id}>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        !isAdded &&
                                                        choose(office.id)
                                                    }
                                                    disabled={isAdded}
                                                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2.5 text-left transition ${
                                                        isAdded
                                                            ? 'cursor-not-allowed bg-slate-50 opacity-70'
                                                            : 'hover:bg-slate-100 active:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10'
                                                    }`}
                                                >
                                                    <span className="flex min-w-0 items-center gap-3">
                                                        <span
                                                            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                                                                isAdded
                                                                    ? 'bg-emerald-50 text-emerald-600'
                                                                    : 'bg-slate-100 text-slate-500'
                                                            }`}
                                                        >
                                                            <Building2 className="h-4 w-4" />
                                                        </span>
                                                        <span className="min-w-0">
                                                            <span className="block truncate text-sm font-medium text-slate-800">
                                                                {office.name}
                                                            </span>
                                                            {isAdded ? (
                                                                <span className="block text-[11px] text-emerald-600">
                                                                    Already added
                                                                </span>
                                                            ) : office.code ? (
                                                                <span className="block truncate text-[11px] text-slate-500">
                                                                    {office.code}
                                                                </span>
                                                            ) : null}
                                                        </span>
                                                    </span>

                                                    {isAdded ? (
                                                        <Check
                                                            className="h-4 w-4 flex-shrink-0 text-emerald-500"
                                                            strokeWidth={2.6}
                                                        />
                                                    ) : (
                                                        <Plus
                                                            className="h-4 w-4 flex-shrink-0 text-slate-300"
                                                            strokeWidth={2.4}
                                                        />
                                                    )}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {/* Footer hint */}
                        <div className="border-t border-slate-100 px-4 py-2.5 text-center">
                            <p className="text-[10px] text-slate-400">
                                Tap an office to add it to the route.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}