import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { FileText, Pencil, Plus, Power, X } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';
import Modal from '@/Components/UI/Modal';
import { useToast } from '@/Components/UI/Toast';

export default function DocumentTypesIndex({ types }) {
    const toast = useToast();
    const [editing, setEditing] = useState(null);
    const [creating, setCreating] = useState(false);

    const [form, setForm] = useState({
        name: '',
        code: '',
        description: '',
        is_active: true,
    });

    function openCreate() {
        setForm({ name: '', code: '', description: '', is_active: true });
        setCreating(true);
    }

    function openEdit(type) {
        setForm({
            name: type.name,
            code: type.code,
            description: type.description ?? '',
            is_active: type.is_active,
        });
        setEditing(type);
    }

    function close() {
        setCreating(false);
        setEditing(null);
    }

    function submit(e) {
        e.preventDefault();
        const payload = { ...form };

        if (editing) {
            router.put(route('document-types.update', editing.id), payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Document type updated.');
                    close();
                },
                onError: (err) => toast.error(Object.values(err)[0] ?? 'Unable to save.'),
            });
        } else {
            router.post(route('document-types.store'), payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Document type created.');
                    close();
                },
                onError: (err) => toast.error(Object.values(err)[0] ?? 'Unable to save.'),
            });
        }
    }

    function deactivate(type) {
        if (!confirm(`Deactivate "${type.name}"? Existing documents keep their type.`)) return;
        router.delete(route('document-types.destroy', type.id), {
            preserveScroll: true,
            onSuccess: () => toast.success('Document type deactivated.'),
        });
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Document Types
                        </h2>
                        <p className="text-xs text-slate-500">
                            Configure the categories available when registering documents
                        </p>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" /> New Type
                    </Button>
                </div>
            }
        >
            <Head title="Document Types" />

            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Name</th>
                                <th className="px-4 py-3 font-semibold">Code</th>
                                <th className="px-4 py-3 font-semibold">Description</th>
                                <th className="px-4 py-3 font-semibold">Status</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {types.map((type) => (
                                <tr key={type.id} className="transition hover:bg-slate-50/60">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-slate-400" />
                                            <span className="font-medium text-slate-800">{type.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{type.code}</td>
                                    <td className="px-4 py-3 text-slate-600">{type.description ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                                            type.is_active
                                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                                : 'bg-slate-100 text-slate-500 ring-slate-200'
                                        }`}>
                                            {type.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() => openEdit(type)}
                                                className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                                                aria-label="Edit"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            {type.is_active && (
                                                <button
                                                    type="button"
                                                    onClick={() => deactivate(type)}
                                                    className="rounded p-1.5 text-red-500 hover:bg-red-50"
                                                    aria-label="Deactivate"
                                                >
                                                    <Power className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {types.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                                        No document types configured yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                show={creating || !!editing}
                onClose={close}
                title={editing ? 'Edit Document Type' : 'New Document Type'}
                footer={
                    <>
                        <Button variant="secondary" onClick={close}>Cancel</Button>
                        <Button onClick={submit}>{editing ? 'Save changes' : 'Create type'}</Button>
                    </>
                }
            >
                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Name *</label>
                        <input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Code *</label>
                        <input
                            value={form.code}
                            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
                            placeholder="e.g. RPO"
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
                        <textarea
                            rows={2}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                            className="rounded border-slate-300"
                        />
                        Active (available for new documents)
                    </label>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}