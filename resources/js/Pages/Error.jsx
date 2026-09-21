import { Head, Link } from '@inertiajs/react';
import { AlertOctagon, ArrowLeft, Lock, SearchX, ServerCrash } from 'lucide-react';

const META = {
    403: {
        icon: Lock,
        title: 'Access Denied',
        message: 'You do not have permission to view this page.',
    },
    404: {
        icon: SearchX,
        title: 'Page Not Found',
        message: 'The page you are looking for could not be found.',
    },
    500: {
        icon: ServerCrash,
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again later.',
    },
    503: {
        icon: ServerCrash,
        title: 'Service Unavailable',
        message: 'The service is temporarily unavailable. Please try again shortly.',
    },
};

export default function Error({ status = 500 }) {
    const meta = META[status] ?? META[500];
    const Icon = meta.icon ?? AlertOctagon;

    return (
        <>
            <Head title={`${status} — ${meta.title}`} />

            <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
                <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                        <Icon className="h-6 w-6" />
                    </div>

                    <p className="mt-4 text-4xl font-semibold tabular-nums text-slate-900">
                        {status}
                    </p>
                    <h1 className="mt-1 text-lg font-semibold text-slate-800">
                        {meta.title}
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">{meta.message}</p>

                    <Link
                        href="/dashboard"
                        className="mt-6 inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </>
    );
}