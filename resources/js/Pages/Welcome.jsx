import { useEffect, useRef, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    Clock,
    FileSearch,
    Hash,
    Loader2,
    LogIn,
    ScanLine,
    ShieldCheck,
    User,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const OPOL_LOGO = '/images/opol.png';
const BALAY_BG = '/images/balay.jpg';

const FEATURES = [
    {
        icon: FileSearch,
        title: 'Track Documents',
        description: 'Know the status of every physical document in real time.',
    },
    {
        icon: ShieldCheck,
        title: 'Secure & Reliable',
        description: 'Server-side authorization on every scan, receive, and forward.',
    },
    {
        icon: Clock,
        title: 'Faster Service',
        description: 'Reduce manual follow-ups and improve office workflows.',
    },
];

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export default function Welcome({ auth, canResetPassword = false }) {
    /* If the user is already signed in, redirect them to the dashboard.
       Doing it via a form avoids a flash of the login UI. */
    useEffect(() => {
        if (auth?.user) {
            window.location.replace('/dashboard');
        }
    }, [auth?.user]);

    return (
        <>
            <Head title="Welcome — OPOL LGU Document Tracking System">
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

            {/* Mobile + desktop share the same layout here. The PIN
                form is compact enough to work well on any screen. */}
            <div className="relative min-h-[100dvh] overflow-hidden bg-slate-950">
                {/* Background */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${BALAY_BG}')` }}
                    aria-hidden="true"
                />
                <div
                    className="absolute inset-0 bg-gradient-to-br from-blue-950/95 via-blue-900/80 to-blue-950/95"
                    aria-hidden="true"
                />
                <div
                    className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,6,23,0.7)_100%)]"
                    aria-hidden="true"
                />

                {/* Content */}
                <div className="relative mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-5 py-8 sm:px-8 lg:py-12">
                    {/* ---------- Header ---------- */}
                    <header className="flex items-center justify-between gap-4">
                        <Link href="/" className="flex items-center gap-3">
                            <img
                                src={OPOL_LOGO}
                                alt="OPOL LGU Seal"
                                className="h-11 w-11 flex-shrink-0 object-contain drop-shadow-lg sm:h-12 sm:w-12"
                                draggable="false"
                            />
                            <div className="leading-tight">
                                <p className="text-sm font-bold uppercase tracking-[0.18em] text-white sm:text-base">
                                    DOCTRAK
                                </p>
                                <p className="text-[10px] font-medium text-blue-100/80 sm:text-xs">
                                    Municipality of Opol
                                </p>
                            </div>
                        </Link>

                        <Link
                            href={route('login')}
                            className="hidden items-center gap-1.5 rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur-md transition hover:border-white/40 hover:bg-white/10 hover:text-white sm:inline-flex"
                        >
                            <LogIn className="h-3.5 w-3.5" />
                            Password login
                        </Link>
                    </header>

                    {/* ---------- Main ---------- */}
                    <main className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-2 lg:gap-16 lg:py-12">
                        {/* Left column — hero copy */}
                        <section className="max-w-lg">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-blue-100/90 backdrop-blur-md">
                                <ScanLine className="h-3 w-3" />
                                Physical document tracking
                            </span>

                            <h1 className="mt-5 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                                Every document,{' '}
                                <span className="text-blue-300">
                                    exactly where it should be.
                                </span>
                            </h1>

                            <p className="mt-4 max-w-md text-sm leading-relaxed text-blue-100/85 sm:text-base">
                                A secure QR-based routing layer for the
                                Municipality of Opol. Register, route, and
                                track physical documents between offices —
                                without replacing the paper itself.
                            </p>

                            <ul className="mt-8 space-y-5">
                                {FEATURES.map((feature) => (
                                    <FeatureItem
                                        key={feature.title}
                                        {...feature}
                                    />
                                ))}
                            </ul>

                            <p
                                className="mt-10 text-2xl leading-tight text-white/90 sm:text-3xl"
                                style={{
                                    fontFamily:
                                        "'Great Vibes', 'Dancing Script', 'Brush Script MT', cursive",
                                }}
                            >
                                Bawat Dokumento, Mahalaga.
                            </p>
                        </section>

                        {/* Right column — PIN login card */}
                        <section className="w-full max-w-md justify-self-center lg:justify-self-end">
                            <PinLoginCard />
                        </section>
                    </main>

                    {/* ---------- Footer ---------- */}
                    <footer className="flex flex-col items-center gap-1 pt-6 text-center text-[11px] text-blue-100/60 sm:text-xs">
                        <p>
                            © {new Date().getFullYear()} Municipality of Opol ·
                            DOCTRAK
                        </p>
                        <p className="italic">
                            For authorized personnel only. Unauthorized access is
                            prohibited.
                        </p>
                    </footer>
                </div>
            </div>
        </>
    );
}

/* ================================================================== */
/*  Feature item                                                       */
/* ================================================================== */

function FeatureItem({ icon: Icon, title, description }) {
    return (
        <li className="flex items-start gap-4">
            <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm sm:h-11 sm:w-11">
                <Icon
                    className="h-4 w-4 text-white sm:h-5 sm:w-5"
                    strokeWidth={1.8}
                    aria-hidden="true"
                />
            </span>
            <div>
                <p className="text-sm font-semibold text-white sm:text-base">
                    {title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-blue-100/80 sm:text-sm">
                    {description}
                </p>
            </div>
        </li>
    );
}

/* ================================================================== */
/*  PIN login card                                                     */
/* ================================================================== */

function PinLoginCard() {
    const pinRef = useRef(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        pin: '',
        remember: true, // Default to checked — this is a shared-office system.
    });

    // Focus the PIN field once a username is entered.
    function handleUsernameKeyDown(e) {
        if (e.key === 'Enter' && data.username.trim() && data.pin.length < 4) {
            e.preventDefault();
            pinRef.current?.focus();
        }
    }

    function handlePinChange(e) {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
        setData('pin', digits);
    }

    function handlePinKeyDown(e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (canSubmit) submit();
    }

    function submit(e) {
        e?.preventDefault();
        if (!canSubmit) return;
        post(route('login.pin'), {
            onFinish: () => reset('pin'),
        });
    }

    const canSubmit =
        data.username.trim().length > 0 &&
        data.pin.length === 4 &&
        !processing;

    return (
        <div className="relative">
            {/* Glow behind the card */}
            <div
                className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-blue-500/15 blur-2xl"
                aria-hidden="true"
            />

            <div className="relative rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl shadow-blue-950/50 backdrop-blur-2xl sm:rounded-3xl sm:p-8">
                {/* Card branding */}
                <div className="flex flex-col items-center text-center">
                    <img
                        src={OPOL_LOGO}
                        alt="OPOL LGU Seal"
                        className="h-14 w-14 object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)] sm:h-16 sm:w-16"
                        draggable="false"
                    />
                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-100/85">
                        OPOL LGU
                    </p>
                    <h1 className="mt-0.5 text-xl font-bold uppercase tracking-wider text-white drop-shadow-sm sm:text-2xl">
                        DOCTRAK
                    </h1>
                    <p className="mt-1 text-xs text-white/70 sm:text-sm">
                        Sign in with your PIN
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="mt-6 space-y-3.5">
                    {/* Username */}
                    <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/60">
                            <User className="h-4 w-4" strokeWidth={1.8} />
                        </span>
                        <input
                            type="text"
                            name="username"
                            value={data.username}
                            onChange={(e) =>
                                setData('username', e.target.value)
                            }
                            onKeyDown={handleUsernameKeyDown}
                            placeholder="Username"
                            autoComplete="username"
                            autoFocus
                            className={`w-full rounded-xl border bg-white/10 py-3 pl-10 pr-3 text-sm leading-5 text-white placeholder-white/55 backdrop-blur-md transition focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30 ${
                                errors.username
                                    ? 'border-red-400/70 focus:border-red-400'
                                    : 'border-white/20 focus:border-white/50'
                            }`}
                        />
                    </div>

                    {/* PIN */}
                    <div>
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/60">
                                <Hash className="h-4 w-4" strokeWidth={1.8} />
                            </span>
                            <input
                                ref={pinRef}
                                type="password"
                                name="pin"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={4}
                                autoComplete="off"
                                value={data.pin}
                                onChange={handlePinChange}
                                onKeyDown={handlePinKeyDown}
                                placeholder="••••"
                                aria-label="4-digit PIN"
                                className={`w-full rounded-xl border bg-white/10 py-3 pl-10 pr-3 text-center font-mono text-xl tracking-[0.6em] text-white placeholder-white/40 backdrop-blur-md transition focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30 ${
                                    errors.pin
                                        ? 'border-red-400/70 focus:border-red-400'
                                        : 'border-white/20 focus:border-white/50'
                                }`}
                            />
                        </div>

                        {/* PIN dot indicators */}
                        <div className="mt-2 flex justify-center gap-1.5">
                            {[0, 1, 2, 3].map((i) => (
                                <span
                                    key={i}
                                    className={`h-1.5 w-6 rounded-full transition-colors duration-150 ${
                                        i < data.pin.length
                                            ? 'bg-blue-300'
                                            : 'bg-white/15'
                                    }`}
                                    aria-hidden
                                />
                            ))}
                        </div>

                        {errors.pin && (
                            <p className="mt-2 text-center text-[11px] font-medium text-red-300">
                                {errors.pin}
                            </p>
                        )}
                        {!errors.pin && errors.username && (
                            <p className="mt-2 text-center text-[11px] font-medium text-red-300">
                                {errors.username}
                            </p>
                        )}
                    </div>

                    {/* Remember me */}
                    <label className="mt-2 flex cursor-pointer select-none items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        <span className="relative flex h-5 w-5 items-center justify-center">
                            <input
                                type="checkbox"
                                name="remember"
                                checked={data.remember}
                                onChange={(e) =>
                                    setData('remember', e.target.checked)
                                }
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/30 bg-white/10 transition checked:border-blue-400 checked:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-white/40"
                            />
                            <svg
                                className="pointer-events-none absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-xs font-medium text-white/90">
                                Keep me signed in on this device
                            </span>
                            <span className="mt-0.5 block text-[10px] leading-snug text-white/60">
                                Don't ask for a PIN every time. Only enable
                                on a device you trust.
                            </span>
                        </span>
                    </label>

                    {/* Submit */}
                    <div className="pt-1">
                        <button
                            type="submit"
                            disabled={!canSubmit || processing}
                            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-lg shadow-blue-900/50 transition-all duration-200 hover:bg-blue-500 hover:shadow-blue-900/60 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-not-allowed disabled:bg-blue-600/40 disabled:shadow-none"
                        >
                            {processing ? (
                                <>
                                    <Loader2
                                        className="h-4 w-4 animate-spin"
                                        strokeWidth={2.2}
                                        aria-hidden="true"
                                    />
                                    <span>Signing in…</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign in</span>
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

                {/* Alternate login */}
                <div className="mt-5 border-t border-white/15 pt-4">
                    <p className="text-center text-[11px] text-white/60 sm:text-xs">
                        Forgot your PIN? Ask your administrator to reset it.
                    </p>
                    <div className="mt-3 flex justify-center">
                        <Link
                            href={route('login')}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-100 underline-offset-4 transition hover:text-white hover:underline sm:text-sm"
                        >
                            <Building2 className="h-3.5 w-3.5" />
                            Sign in with password instead
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}