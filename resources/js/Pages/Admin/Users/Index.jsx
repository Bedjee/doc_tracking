// resources/js/Pages/Users/Index.jsx
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Power } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';

export default function Index({ users, offices, filters }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">Users</h2>
                    <Button onClick={() => router.visit(route('users.create'))}>
                        <Plus className="h-4 w-4" /> New User
                    </Button>
                </div>
            }
        >
            <Head title="Users" />
            <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Username</th>
                                <th className="px-4 py-3">Office</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.data.map((u) => (
                                <tr key={u.id}>
                                    <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{u.username}</td>
                                    <td className="px-4 py-3 text-slate-600">{u.office?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-600">{u.role}</td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                                            u.is_active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-slate-200'
                                        }`}>
                                            {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link href={route('users.edit', u.id)} className="inline-block rounded p-1.5 text-slate-500 hover:bg-slate-100">
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Link>
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