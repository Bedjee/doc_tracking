import { Head, Link, router } from '@inertiajs/react';
import { Building2, Pencil, Plus, Power } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';
import { useToast } from '@/Components/UI/Toast';

export default function Index({ offices }) {
    const toast = useToast();

    function deactivate(office) {
        if (!confirm(`Deactivate ${office.name}? Existing documents keep their history.`)) return;
        router.delete(route('offices.destroy', office.id), {
            preserveScroll: true,
            onSuccess: () => toast.success('Office deactivated.'),
        });
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">Offices / Departments</h2>
                    <Button onClick={() => router.visit(route('offices.create'))}>
                        <Plus className="h-4 w-4" /> New Office
                    </Button>
                </div>
            }
        >
            <Head title="Offices" />

            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Office</th>
                                <th className="px-4 py-3">Code</th>
                                <th className="px-4 py-3">Users</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {offices.data.map((office) => (
                                <tr key={office.id}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-slate-400" />
                                            <span className="font-medium text-slate-800">{office.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{office.code}</td>
                                    <td className="px-4 py-3 text-slate-600">{office.users_count}</td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                                            office.is_active
                                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                                : 'bg-slate-100 text-slate-500 ring-slate-200'
                                        }`}>
                                            {office.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Link
                                                href={route('offices.edit', office.id)}
                                                className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Link>
                                            {office.is_active && (
                                                <button
                                                    onClick={() => deactivate(office)}
                                                    className="rounded p-1.5 text-red-500 hover:bg-red-50"
                                                >
                                                    <Power className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}