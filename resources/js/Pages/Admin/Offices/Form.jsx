import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';

export default function Form({ office }) {
    const editing = Boolean(office);

    const { data, setData, post, put, processing, errors } = useForm({
        name: office?.name ?? '',
        code: office?.code ?? '',
        description: office?.description ?? '',
        is_active: office?.is_active ?? true,
    });

    function submit(e) {
        e.preventDefault();
        editing ? put(route('offices.update', office.id)) : post(route('offices.store'));
    }

    return (
        <AuthenticatedLayout header={<h2 className="text-lg font-semibold text-slate-800">{editing ? 'Edit Office' : 'New Office'}</h2>}>
            <Head title={editing ? 'Edit Office' : 'New Office'} />

            <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
                    <Field label="Office Name" error={errors.name} required>
                        <input value={data.name} onChange={(e) => setData('name', e.target.value)} className="input" />
                    </Field>
                    <Field label="Office Code" error={errors.code} required>
                        <input value={data.code} onChange={(e) => setData('code', e.target.value.toUpperCase())} className="input font-mono" placeholder="e.g. ACC" />
                    </Field>
                    <Field label="Description" error={errors.description}>
                        <textarea rows={2} value={data.description} onChange={(e) => setData('description', e.target.value)} className="input" />
                    </Field>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="rounded border-slate-300" />
                        Active (available as a routing destination)
                    </label>
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={() => router.visit(route('offices.index'))}>Cancel</Button>
                    <Button type="submit" loading={processing}>{editing ? 'Save changes' : 'Create office'}</Button>
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