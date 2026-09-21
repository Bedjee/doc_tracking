import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    FileSearch,
    ShieldCheck,
    Clock,
    User,
    LockKeyhole,
    Eye,
    EyeOff,
    ArrowRight,
    Loader2,
    Check,
    Smartphone,
} from 'lucide-react';

import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const OPOL_LOGO = '/images/opol.png';
const BALAY_BG = '/images/balay.jpg';

const FEATURES = [
    {
        icon: FileSearch,
        title: 'Track Documents',
        description: 'Know the status of your documents in real time.',
    },
    {
        icon: ShieldCheck,
        title: 'Secure & Reliable',
        description: 'Your data is safe with us.',
    },
    {
        icon: Clock,
        title: 'Faster Service',
        description: 'Reduce manual process and improve workflow.',
    },
];

/* ================================================================== */
/*  DESKTOP-ONLY COMPONENTS                                            */
/* ================================================================== */

function LoginBrand({ size = 'lg', align = 'left', variant = 'light' }) {
    const logoSizes = {
        sm: 'h-12 w-12',
        md: 'h-16 w-16',
        lg: 'h-20 w-20 lg:h-24 lg:w-24',
    };
    const titleSizes = {
        sm: 'text-lg',
        md: 'text-xl',
        lg: 'text-2xl lg:text-3xl',
    };
    const textColor = variant === 'light' ? 'text-white' : 'text-blue-950';
    const subColor =
        variant === 'light' ? 'text-blue-100/90' : 'text-slate-500';
    const alignClass =
        align === 'center' ? 'items-center text-center' : 'items-start text-left';

    return (
        <div className={`flex flex-col gap-4 ${alignClass}`}>
            <div className="flex items-center gap-4">
                <img
                    src={OPOL_LOGO}
                    alt="OPOL LGU Seal"
                    className={`${logoSizes[size]} flex-shrink-0 object-contain drop-shadow-lg`}
                    draggable="false"
                />
                <div className={align === 'center' ? 'text-left' : ''}>
                    <p
                        className={`font-bold uppercase leading-tight tracking-wide ${titleSizes[size]} ${textColor}`}
                    >
                        DOCTRAK
                    </p>
                    <p className={`text-sm font-medium ${subColor}`}>
                        For Municipality of Opol
                    </p>
                    <p className={`text-sm ${subColor}`}></p>
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ icon: Icon, title, description }) {
    return (
        <li className="flex items-start gap-4">
            <span className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm">
                <Icon
                    className="h-5 w-5 text-white"
                    strokeWidth={1.8}
                    aria-hidden="true"
                />
            </span>
            <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-blue-100/85">
                    {description}
                </p>
            </div>
        </li>
    );
}

function DesktopHero() {
    return (
        <section className="relative isolate hidden overflow-hidden bg-blue-950 lg:block lg:min-h-screen">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${BALAY_BG}')` }}
                aria-hidden="true"
            />
            <div
                className="absolute inset-0 bg-gradient-to-br from-blue-950/95 via-blue-900/85 to-blue-800/70"
                aria-hidden="true"
            />

            <svg
                className="pointer-events-none absolute bottom-0 left-0 h-44 w-full"
                viewBox="0 0 1440 320"
                preserveAspectRatio="none"
                aria-hidden="true"
            >
                <path
                    fill="#1d4ed8"
                    fillOpacity="0.85"
                    d="M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,213.3C840,224,960,224,1080,208C1200,192,1320,160,1380,144L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
                />
            </svg>

            <div className="relative flex min-h-screen flex-col justify-between px-14 py-12 xl:px-16">
                <div>
                    <LoginBrand size="lg" />
                </div>

                <div className="mt-12 max-w-xl">
                    <h1 className="text-4xl font-bold leading-tight text-white xl:text-[2.6rem]">
                        Document Tracking System
                    </h1>

                    <p className="mt-3 text-base font-medium text-blue-100">
                        Efficient. Transparent. Accountable.
                    </p>

                    <p className="mt-3 max-w-md text-sm leading-relaxed text-blue-100/85">
                        Track, manage, and monitor all official documents of the
                        OPOL LGU in one system.
                    </p>
                </div>

                <ul className="max-w-md space-y-6">
                    {FEATURES.map((feature) => (
                        <FeatureItem key={feature.title} {...feature} />
                    ))}
                </ul>

                <div className="relative z-10">
                    <p
                        className="text-3xl leading-tight text-white/95"
                        style={{
                            fontFamily:
                                "'Great Vibes', 'Dancing Script', 'Brush Script MT', cursive",
                        }}
                    >
                        Bawat Dokumento,
                    </p>
                    <p
                        className="-mt-1 pl-6 text-3xl leading-tight text-white/95"
                        style={{
                            fontFamily:
                                "'Great Vibes', 'Dancing Script', 'Brush Script MT', cursive",
                        }}
                    >
                        Mahalaga.
                    </p>
                    <span className="mt-1 block h-px w-24 bg-white/40" />
                </div>
            </div>
        </section>
    );
}

function DesktopPasswordInput({
    id = 'd-password',
    value,
    onChange,
    placeholder = 'Password',
    autoComplete = 'current-password',
    error,
}) {
    const [visible, setVisible] = useState(false);

    return (
        <div>
            <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <LockKeyhole
                        className="h-5 w-5"
                        strokeWidth={1.8}
                        aria-hidden="true"
                    />
                </span>

                <TextInput
                    id={id}
                    name="password"
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className={`block w-full py-3 pl-11 pr-11 text-base sm:text-sm ${
                        error
                            ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                            : ''
                    }`}
                />

                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    aria-pressed={visible}
                    className="absolute inset-y-0 right-0 flex items-center rounded-r-md pr-3.5 text-slate-400 transition hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1"
                >
                    {visible ? (
                        <EyeOff
                            className="h-5 w-5"
                            strokeWidth={1.8}
                            aria-hidden="true"
                        />
                    ) : (
                        <Eye
                            className="h-5 w-5"
                            strokeWidth={1.8}
                            aria-hidden="true"
                        />
                    )}
                </button>
            </div>

            <InputError message={error} className="mt-2" />
        </div>
    );
}

function DesktopLoginCard({
    data,
    setData,
    errors,
    processing,
    submit,
    status,
    canResetPassword,
}) {
    return (
        <div className="w-full max-w-[420px]">
            <div className="rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/5 sm:p-8 sm:shadow-2xl sm:shadow-slate-900/10 lg:p-9">
                <div className="flex flex-col items-center text-center">
                    <img
                        src={OPOL_LOGO}
                        alt="OPOL LGU Seal"
                        className="h-16 w-16 object-contain sm:h-20 sm:w-20"
                        draggable="false"
                    />
                    <p className="mt-3 text-base font-bold uppercase tracking-wide text-blue-950 sm:text-lg">
                        OPOL LGU
                    </p>
                    <h2 className="mt-1 text-sm font-semibold text-slate-800 sm:text-base lg:text-lg">
                        DOCTRAK
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                        Please login to your account
                    </p>
                </div>

                {status && (
                    <div
                        role="status"
                        className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
                    >
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="mt-7 space-y-4">
                    <div>
                        <label htmlFor="d-username" className="sr-only">
                            Username
                        </label>
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                <User
                                    className="h-5 w-5"
                                    strokeWidth={1.8}
                                    aria-hidden="true"
                                />
                            </span>
                            <TextInput
                                id="d-username"
                                name="username"
                                type="text"
                                value={data.username}
                                onChange={(e) =>
                                    setData('username', e.target.value)
                                }
                                placeholder="Username"
                                autoComplete="username"
                                className={`block w-full py-3 pl-11 text-base sm:text-sm ${
                                    errors.username
                                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                                        : ''
                                }`}
                            />
                        </div>
                        <InputError
                            message={errors.username}
                            className="mt-2"
                        />
                    </div>

                    <DesktopPasswordInput
                        id="d-password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        error={errors.password}
                    />

                    {/* ---------- Remember this device ---------- */}
                    <div className="flex items-start justify-between gap-3 pt-1">
                        <div className="min-w-0 flex-1">
                            <label
                                htmlFor="d-remember"
                                className="flex cursor-pointer select-none items-center"
                            >
                                <Checkbox
                                    id="d-remember"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData('remember', e.target.checked)
                                    }
                                />
                                <span className="ml-2 text-xs font-medium text-slate-700 sm:text-sm">
                                    Remember this device
                                </span>
                            </label>

                            <p className="ml-6 mt-0.5 text-[10px] leading-snug text-slate-400 sm:text-[11px]">
                                Stay signed in on this browser, even after
                                closing it. Only enable on a device you trust.
                            </p>
                        </div>

                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="flex-shrink-0 rounded text-xs font-medium text-blue-700 underline-offset-4 transition hover:text-blue-900 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 sm:text-sm"
                            >
                                Forgot password?
                            </Link>
                        )}
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="group relative flex w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 py-3.5 text-sm font-semibold uppercase tracking-wider text-white shadow-lg shadow-blue-900/20 transition-all duration-200 hover:bg-blue-900 hover:shadow-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-800/70 disabled:shadow-none"
                        >
                            {processing ? (
                                <>
                                    <Loader2
                                        className="h-4 w-4 animate-spin"
                                        strokeWidth={2.2}
                                        aria-hidden="true"
                                    />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Login</span>
                                    <ArrowRight
                                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                                        strokeWidth={2.2}
                                        aria-hidden="true"
                                    />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-7 border-t border-slate-100 pt-5 text-center">
                    <p className="text-[11px] font-medium text-slate-600 sm:text-xs">
                        OPOL LGU&nbsp;|&nbsp;Document Tracking System
                    </p>
                    <p className="mt-1 text-[10px] italic text-slate-400 sm:text-[11px]">
                        For a more efficient and responsive public service.
                    </p>
                </div>
            </div>

            <p className="mt-5 text-center text-[11px] text-slate-400 sm:text-xs">
                For authorized personnel only. Unauthorized access is
                prohibited.
            </p>
        </div>
    );
}

/* ================================================================== */
/*  MOBILE-ONLY COMPONENTS (GLASSMORPHISM)                             */
/* ================================================================== */

function GlassInput({
    id,
    name,
    type = 'text',
    value,
    onChange,
    placeholder,
    icon: Icon,
    error,
    autoComplete,
    trailing,
}) {
    return (
        <div>
            <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-white/60">
                    <Icon
                        className="h-4 w-4"
                        strokeWidth={1.8}
                        aria-hidden="true"
                    />
                </span>

                <input
                    id={id}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className={`w-full rounded-lg border bg-white/10 py-2 pl-9 pr-9 text-sm leading-5 text-white placeholder-white/55 backdrop-blur-md transition-all duration-200 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30 ${
                        error
                            ? 'border-red-400/70 focus:border-red-400'
                            : 'border-white/20 focus:border-white/50'
                    }`}
                />

                {trailing}
            </div>

            {error && (
                <p className="mt-1 pl-1 text-[11px] font-medium text-red-300">
                    {error}
                </p>
            )}
        </div>
    );
}

function GlassPasswordInput({
    id,
    value,
    onChange,
    placeholder = 'Password',
    error,
}) {
    const [visible, setVisible] = useState(false);

    return (
        <GlassInput
            id={id}
            name="password"
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            autoComplete="current-password"
            icon={LockKeyhole}
            error={error}
            trailing={
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    aria-pressed={visible}
                    className="absolute inset-y-0 right-0 flex items-center rounded-r-lg pr-3 text-white/60 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                    {visible ? (
                        <EyeOff
                            className="h-4 w-4"
                            strokeWidth={1.8}
                            aria-hidden="true"
                        />
                    ) : (
                        <Eye
                            className="h-4 w-4"
                            strokeWidth={1.8}
                            aria-hidden="true"
                        />
                    )}
                </button>
            }
        />
    );
}

function GlassCheckbox({ id, checked, onChange }) {
    return (
        <span className="relative flex h-5 w-5 items-center justify-center">
            <input
                id={id}
                name="remember"
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/30 bg-white/10 backdrop-blur-md transition-all duration-200 checked:border-blue-400 checked:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            <Check
                className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                strokeWidth={3}
                aria-hidden="true"
            />
        </span>
    );
}

function MobileGlassCard({
    data,
    setData,
    errors,
    processing,
    submit,
    status,
    canResetPassword,
}) {
    return (
        <div className="relative w-full max-w-md">
            <div
                className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-blue-500/10 blur-2xl"
                aria-hidden="true"
            />

            <div className="relative rounded-2xl border border-white/20 bg-white/10 p-5 shadow-2xl shadow-blue-950/50 backdrop-blur-2xl sm:rounded-3xl sm:p-7">
                <div className="flex flex-col items-center text-center">
                    <img
                        src={OPOL_LOGO}
                        alt="OPOL LGU Seal"
                        className="h-12 w-12 object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)] sm:h-16 sm:w-16"
                        draggable="false"
                    />
                    <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-100/85">
                        OPOL LGU
                    </p>
                    <h1 className="mt-0.5 text-lg font-bold uppercase tracking-wider text-white drop-shadow-sm sm:text-xl">
                        DOCTRAK
                    </h1>
                    <p className="mt-1 text-[11px] text-white/70 sm:text-xs">
                        Document Tracking System
                    </p>
                </div>

                {status && (
                    <div
                        role="status"
                        className="mt-5 rounded-xl border border-emerald-300/30 bg-emerald-400/15 px-3.5 py-2.5 text-xs font-medium text-emerald-100 backdrop-blur-md sm:text-sm"
                    >
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="mt-6 space-y-3.5">
                    <GlassInput
                        id="m-username"
                        name="username"
                        type="text"
                        value={data.username}
                        onChange={(e) => setData('username', e.target.value)}
                        placeholder="Username"
                        autoComplete="username"
                        icon={User}
                        error={errors.username}
                    />

                    <GlassPasswordInput
                        id="m-password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        error={errors.password}
                    />

                    {/* ---------- Remember this device ---------- */}
                    <div className="rounded-xl border border-white/15 bg-white/5 p-3 backdrop-blur-md">
                        <label
                            htmlFor="m-remember"
                            className="flex cursor-pointer select-none items-start gap-2.5"
                        >
                            <span className="mt-0.5">
                                <GlassCheckbox
                                    id="m-remember"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData('remember', e.target.checked)
                                    }
                                />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-1.5 text-sm font-medium text-white">
                                    <Smartphone
                                        className="h-3.5 w-3.5 text-blue-200"
                                        aria-hidden="true"
                                    />
                                    Remember this device
                                </span>
                                <span className="mt-0.5 block text-[11px] leading-snug text-white/65">
                                    Stay signed in on this phone so you can scan
                                    QR codes without logging in every time.
                                </span>
                            </span>
                        </label>

                        {canResetPassword && (
                            <div className="mt-2.5 border-t border-white/10 pt-2.5 text-right">
                                <Link
                                    href={route('password.request')}
                                    className="rounded text-xs font-medium text-blue-100 underline-offset-4 transition hover:text-white hover:underline focus:outline-none focus:ring-2 focus:ring-white/40"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="pt-1.5">
                        <button
                            type="submit"
                            disabled={processing}
                            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-lg shadow-blue-900/50 transition-all duration-200 hover:bg-blue-500 hover:shadow-blue-900/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-blue-600/60 disabled:shadow-none"
                        >
                            {processing ? (
                                <>
                                    <Loader2
                                        className="h-4 w-4 animate-spin"
                                        strokeWidth={2.2}
                                        aria-hidden="true"
                                    />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Login</span>
                                    <ArrowRight
                                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                                        strokeWidth={2.2}
                                        aria-hidden="true"
                                    />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-5 border-t border-white/15 pt-4 text-center">
                    <p className="text-[10px] font-medium text-white/75 sm:text-[11px]">
                        OPOL LGU&nbsp;|&nbsp;DOCTRAK
                    </p>
                    <p className="mt-1 text-[10px] italic text-white/50">
                        For a more efficient and responsive public service.
                    </p>
                </div>
            </div>

            <p className="mt-4 text-center text-[10px] text-white/55 sm:text-[11px]">
                For authorized personnel only. Unauthorized access is
                prohibited.
            </p>
        </div>
    );
}

function MobileGlassView(props) {
    return (
        <div className="relative min-h-[100dvh] overflow-hidden lg:hidden">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${BALAY_BG}')` }}
                aria-hidden="true"
            />

            <div
                className="absolute inset-0 bg-gradient-to-br from-blue-950/85 via-blue-900/55 to-blue-950/85"
                aria-hidden="true"
            />

            <div
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,6,23,0.55)_100%)]"
                aria-hidden="true"
            />

            <div className="relative flex min-h-[100dvh] items-center justify-center px-5 py-10 sm:px-6 sm:py-12">
                <MobileGlassCard {...props} />
            </div>
        </div>
    );
}

/* ================================================================== */
/*  MAIN PAGE                                                          */
/* ================================================================== */

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const shared = {
        data,
        setData,
        errors,
        processing,
        submit,
        status,
        canResetPassword,
    };

    return (
        <>
            <Head title="Login — OPOL LGU Document Tracking System">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <MobileGlassView {...shared} />

            <div className="hidden min-h-screen bg-slate-100 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
                <DesktopHero />

                <main className="flex min-h-screen items-center justify-center px-10 py-12">
                    <DesktopLoginCard {...shared} />
                </main>
            </div>
        </>
    );
}