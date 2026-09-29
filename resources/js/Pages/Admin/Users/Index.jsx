import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Copy,
    KeyRound,
    Pencil,
    Plus,
    Power,
    Search,
    ShieldOff,
    X,
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';
import Modal from '@/Components/UI/Modal';
import { useToast } from '@/Components/UI/Toast';

export default function Index({ users, offices, filters }) {
    const toast = useToast();

    const [search, setSearch] = useState(filters.search ?? '');
    const [officeId, setOfficeId] = useState(filters.office_id ?? '');

    // Modal state for the freshly-generated PIN
    const [generatedPin, setGeneratedPin] = useState(null); // { user, pin }
    const [busyUserId, setBusyUserId] = useState(null);
    const [copied, setCopied] = useState(false);

    /* ---------------- Filters ---------------- */

    function apply(e) {
        e?.preventDefault();
        const params = {};
        if (search) params.search = search;
        if (officeId) params.office_id = officeId;
        router.get(route('users.index'), params, {
            preserveState: true,
            replace: true,
        });
    }

    function reset() {
        setSearch('');
        setOfficeId('');
        router.get(route('users.index'));
    }

    /* ---------------- PIN actions ---------------- */

    async function generatePin(user) {
        const hasPin = user.has_pin;
        const confirmMsg = hasPin
            ? `Reset the PIN for ${user.name}? The current PIN will stop working immediately.`
            : `Generate a new 4-digit PIN for ${user.name}?`;

        if (!confirm(confirmMsg)) return;

        setBusyUserId(user.id);
        try {
            const res = await fetch(route('users.regenerate-pin', user.id), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN':
                        document.querySelector('meta[name="csrf-token"]')
                            ?.content ?? '',
                    Accept: 'application/json',
                },
            });

            if (!res.ok) throw new Error('Request failed');

            const json = await res.json();
            setCopied(false);
            setGeneratedPin({ user: json.user, pin: json.pin });

            // Refresh the table so the PIN column updates.
            router.reload({ only: ['users'] });
        } catch (e) {
            toast.error('Could not generate PIN. Please try again.');
        } finally {
            setBusyUserId(null);
        }
    }

    async function clearPin(user) {
        if (
            !confirm(
                `Clear the PIN for ${user.name}? They will need to use their password to log in until a new PIN is issued.`
            )
        ) {
            return;
        }

        setBusyUserId(user.id);
        try {
            const res = await fetch(route('users.clear-pin', user.id), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN':
                        document.querySelector('meta[name="csrf-token"]')
                            ?.content ?? '',
                    Accept: 'application/json',
                },
            });

            if (!res.ok) throw new Error('Request failed');

            toast.success('PIN cleared.');
            router.reload({ only: ['users'] });
        } catch (e) {
            toast.error('Could not clear PIN.');
        } finally {
            setBusyUserId(null);
        }
    }

    function deactivate(user) {
        if (!confirm(`Deactivate ${user.name}?`)) return;
        router.delete(route('users.destroy', user.id), {
            preserveScroll: true,
            onSuccess: () => toast.success('User deactivated.'),
        });
    }

    function copyPin(pin) {
        try {
            navigator.clipboard.writeText(pin);
            setCopied(true);
            toast.success('PIN copied to clipboard.');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Could not copy. Please copy manually.');
        }
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-semibold text-slate-800 sm:text-lg">
                            Users
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Manage accounts, roles, offices, and PINs
                        </p>
                    </div>
                    <Button onClick={() => router.visit(route('users.create'))}>
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">New User</span>
                    </Button>
                </div>
            }
        >
            <Head title="Users" />

            <div className="mx-auto max-w-7xl space-y-4 px-3 py-3 sm:px-6 sm:py-5 lg:px-8">
                {/* ---------- Filters ---------- */}
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <form
                        onSubmit={apply}
                        className="flex flex-wrap items-end gap-2.5"
                    >
                        <div className="relative min-w-[200px] flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search name or username"
                                className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            />
                        </div>

                        <select
                            value={officeId}
                            onChange={(e) => setOfficeId(e.target.value)}
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                        >
                            <option value="">All offices</option>
                            {offices.map((o) => (
                                <option key={o.id} value={o.id}>
                                    {o.name}
                                </option>
                            ))}
                        </select>

                        <Button type="submit" variant="secondary">
                            Apply
                        </Button>
                        {(search || officeId) && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={reset}
                            >
                                <X className="h-4 w-4" /> Clear
                            </Button>
                        )}
                    </form>
                </div>

                {/* ---------- Desktop table ---------- */}
                <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white lg:block">
                    <table className="w-full table-fixed text-left text-[13px]">
                        <colgroup>
                            <col style={{ width: '180px' }} />
                            <col style={{ width: '140px' }} />
                            <col />
                            <col style={{ width: '120px' }} />
                            <col style={{ width: '90px' }} />
                            <col style={{ width: '110px' }} />
                            <col style={{ width: '160px' }} />
                        </colgroup>
                        <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-3 py-2 font-semibold">
                                    Name
                                </th>
                                <th className="px-3 py-2 font-semibold">
                                    Username
                                </th>
                                <th className="px-3 py-2 font-semibold">
                                    Office
                                </th>
                                <th className="px-3 py-2 font-semibold">
                                    Role
                                </th>
                                <th className="px-3 py-2 font-semibold">
                                    Status
                                </th>
                                <th className="px-3 py-2 font-semibold">
                                    PIN
                                </th>
                                <th className="px-3 py-2 text-right font-semibold">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.data.map((u) => (
                                <tr
                                    key={u.id}
                                    className="transition hover:bg-slate-50/60"
                                >
                                    <td className="truncate px-3 py-2 font-medium text-slate-800">
                                        {u.name}
                                    </td>
                                    <td className="truncate px-3 py-2 font-mono text-[12px] text-slate-600">
                                        {u.username}
                                    </td>
                                    <td className="truncate px-3 py-2 text-slate-600">
                                        {u.office?.name ?? '—'}
                                    </td>
                                    <td className="truncate px-3 py-2 text-slate-600">
                                        {u.role}
                                    </td>
                                    <td className="px-3 py-2">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                                                u.is_active
                                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                                    : 'bg-slate-100 text-slate-500 ring-slate-200'
                                            }`}
                                        >
                                            {u.is_active
                                                ? 'ACTIVE'
                                                : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        {u.has_pin ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 ring-1 ring-inset ring-sky-200">
                                                •••• Set
                                            </span>
                                        ) : (
                                            <span className="text-[11px] italic text-slate-400">
                                                not set
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center justify-end gap-1">
                                            {/* Generate / Reset PIN */}
                                            <button
                                                type="button"
                                                onClick={() => generatePin(u)}
                                                disabled={busyUserId === u.id}
                                                className="rounded p-1.5 text-sky-600 transition hover:bg-sky-50 hover:text-sky-800 disabled:opacity-40"
                                                title={
                                                    u.has_pin
                                                        ? 'Reset PIN'
                                                        : 'Generate PIN'
                                                }
                                            >
                                                <KeyRound className="h-3.5 w-3.5" />
                                            </button>

                                            {/* Clear PIN (only if one exists) */}
                                            {u.has_pin && (
                                                <button
                                                    type="button"
                                                    onClick={() => clearPin(u)}
                                                    disabled={
                                                        busyUserId === u.id
                                                    }
                                                    className="rounded p-1.5 text-amber-500 transition hover:bg-amber-50 hover:text-amber-700 disabled:opacity-40"
                                                    title="Clear PIN"
                                                >
                                                    <ShieldOff className="h-3.5 w-3.5" />
                                                </button>
                                            )}

                                            {/* Edit */}
                                            <Link
                                                href={route(
                                                    'users.edit',
                                                    u.id
                                                )}
                                                className="rounded p-1.5 text-slate-500 transition hover:bg-slate-100"
                                                title="Edit"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Link>

                                            {/* Deactivate */}
                                            {u.is_active && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        deactivate(u)
                                                    }
                                                    className="rounded p-1.5 text-red-500 transition hover:bg-red-50"
                                                    title="Deactivate"
                                                >
                                                    <Power className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-3 py-10 text-center text-sm text-slate-500"
                                    >
                                        No users match your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ---------- Mobile cards ---------- */}
                <div className="space-y-2 lg:hidden">
                    {users.data.map((u) => (
                        <div
                            key={u.id}
                            className="rounded-lg border border-slate-200 bg-white p-3"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="truncate font-medium text-slate-800">
                                        {u.name}
                                    </p>
                                    <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                                        {u.username}
                                    </p>
                                </div>
                                <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                                        u.is_active
                                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                            : 'bg-slate-100 text-slate-500 ring-slate-200'
                                    }`}
                                >
                                    {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                                <span>
                                    Office:{' '}
                                    <span className="text-slate-700">
                                        {u.office?.name ?? '—'}
                                    </span>
                                </span>
                                <span>
                                    Role:{' '}
                                    <span className="text-slate-700">
                                        {u.role}
                                    </span>
                                </span>
                                <span>
                                    PIN:{' '}
                                    <span
                                        className={
                                            u.has_pin
                                                ? 'font-semibold text-sky-700'
                                                : 'italic text-slate-400'
                                        }
                                    >
                                        {u.has_pin ? '•••• Set' : 'not set'}
                                    </span>
                                </span>
                            </div>

                            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => generatePin(u)}
                                    disabled={busyUserId === u.id}
                                >
                                    <KeyRound className="h-3.5 w-3.5" />
                                    {u.has_pin ? 'Reset PIN' : 'Set PIN'}
                                </Button>
                                {u.has_pin && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => clearPin(u)}
                                        disabled={busyUserId === u.id}
                                    >
                                        <ShieldOff className="h-3.5 w-3.5" />{' '}
                                        Clear
                                    </Button>
                                )}
                                <Link
                                    href={route('users.edit', u.id)}
                                    className="ml-auto rounded-md px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                                >
                                    Edit
                                </Link>
                            </div>
                        </div>
                    ))}
                    {users.data.length === 0 && (
                        <div className="rounded-lg border border-slate-200 bg-white py-10 text-center text-sm text-slate-500">
                            No users match your filters.
                        </div>
                    )}
                </div>

                {/* ---------- Pagination ---------- */}
                {users.links?.length > 3 && (
                    <nav className="flex flex-wrap justify-center gap-1">
                        {users.links.map((link, i) => (
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
                )}
            </div>

            {/* ---------- Generated PIN modal ---------- */}
            <Modal
                show={!!generatedPin}
                onClose={() => setGeneratedPin(null)}
                title="PIN generated"
                maxWidth="max-w-sm"
                footer={
                    <Button
                        onClick={() => setGeneratedPin(null)}
                        className="w-full"
                    >
                        Done
                    </Button>
                }
            >
                {generatedPin && (
                    <div className="text-center">
                        <p className="text-sm text-slate-600">
                            New PIN for{' '}
                            <span className="font-semibold text-slate-900">
                                {generatedPin.user.name}
                            </span>
                        </p>

                        <div className="mt-4 rounded-xl border-2 border-dashed border-sky-200 bg-sky-50 px-4 py-5">
                            <p className="font-mono text-4xl font-bold tracking-[0.4em] text-sky-900">
                                {generatedPin.pin}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => copyPin(generatedPin.pin)}
                            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            <Copy className="h-3.5 w-3.5" />
                            {copied ? 'Copied!' : 'Copy to clipboard'}
                        </button>

                        <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
                            This is the only time this PIN will be shown.
                            Give it to the user securely. If they lose it,
                            you can generate a new one.
                        </p>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}