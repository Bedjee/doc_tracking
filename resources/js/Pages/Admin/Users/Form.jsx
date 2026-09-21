// resources/js/Pages/Users/Form.jsx
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';

const ROLES = [
    { value: 'office_user', label: 'Office User' },
    { value: 'office_head', label: 'Office Head / Supervisor' },
    { value: 'administrator', label: 'Administrator' },
];

export default function Form({ user, offices }) {
    const editing = Boolean(user);

    const { data, setData, post, put, processing, errors } = useForm({
        name: user?.name ?? '',
        username: user?.username ?? '',
        email: user?.email ?? '',
        password: '',
        office_id: user?.office_id ?? '',
        role: user?.role ?? 'office_user',
        is_active: user?.is_active ?? true,
    });

    function submit(e) {
        e.preventDefault();
        editing ? put(route('users.update', user.id)) : post(route('users.store'));
    }

    return (
        <AuthenticatedLayout header={<h2 className="text-lg font-semibold text-slate-800">{editing ? 'Edit User' : 'New User'}</h2>}>
            <Head title={editing ? 'Edit User' : 'New User'} />
            <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
                    <Field label="Full Name" error={errors.name} required>
                        <input value={data.name} onChange={(e) => setData('name', e.target.value)} className="input" />
                    </Field>
                    <Field label="Username" error={errors.username} required>
                        <input value={data.username} onChange={(e) => setData('username', e.target.value)} className="input font-mono" />
                    </Field>
                    <Field label="Email" error={errors.email}>
                        <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="input" />
                    </Field>
                    <Field label={editing ? 'New Password (leave blank to keep)' : 'Password'} error={errors.password} required={!editing}>
                        <input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} className="input" />
                    </Field>
                    <Field label="Office / Department" error={errors.office_id} required>
                        <select value={data.office_id} onChange={(e) => setData('office_id', e.target.value)} className="input">
                            <option value="">— Select office —</option>
                            {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                    </Field>
                    <Field label="Role" error={errors.role} required>
                        <select value={data.role} onChange={(e) => setData('role', e.target.value)} className="input">
                            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </Field>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />
                        Active
                    </label>
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={() => router.visit(route('users.index'))}>Cancel</Button>
                    <Button type="submit" loading={processing}>{editing ? 'Save changes' : 'Create user'}</Button>
                </div>
            </form>
            <style>{`.input{width:100%;border-radius:.375rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem}.input:focus{outline:none;border-color:#0f172a;box-shadow:0 0 0 3px rgba(15,23,42,.08)}`}</style>
        </AuthenticatedLayout>
    );
}

function Field({ label, error, required, children }) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">{label} {required && <span className="text-red-500">*</span>}</span>
            {children}
            {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
        </label>
    );
}