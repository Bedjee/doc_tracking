import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    Eye,
    EyeOff,
    Hash,
    Loader2,
    LockKeyhole,
} from 'lucide-react';

import InputError from '@/Components/InputError';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const OPOL_LOGO = '/images/opol.png';

const FIELD_BASE =
    'block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:ring-4';

const FIELD_OK =
    'border-slate-200 hover:border-slate-300 focus:border-blue-700 focus:ring-blue-700/10';

const FIELD_ERROR =
    'border-red-300 focus:border-red-500 focus:ring-red-500/10';

/* ================================================================== */
/*  KEYFRAMES                                                          */
/* ================================================================== */

const KEYFRAMES = `
  @keyframes dt-fade-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes dt-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes dt-glow {
    0%, 100% { opacity: 0.10; transform: translate(-50%, -50%) scale(1); }
    50%      { opacity: 0.16; transform: translate(-50%, -50%) scale(1.07); }
  }
  @keyframes dt-drift {
    0%, 100% { transform: translate3d(0, 0, 0); }
    50%      { transform: translate3d(22px, -16px, 0); }
  }
  @keyframes dt-drift-slow {
    0%, 100% { transform: translate3d(0, 0, 0); }
    50%      { transform: translate3d(-28px, 18px, 0); }
  }
  .dt-fade-up { animation: dt-fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .dt-fade    { animation: dt-fade 0.8s ease-out both; }
  .dt-glow    { animation: dt-glow 10s ease-in-out infinite; }
  .dt-drift   { animation: dt-drift 16s ease-in-out infinite; }
  .dt-drift-slow { animation: dt-drift-slow 20s ease-in-out infinite; }

  @media (prefers-reduced-motion: reduce) {
    .dt-fade-up, .dt-fade, .dt-glow, .dt-drift, .dt-drift-slow {
      animation: none !important;
    }
  }
`;

/* ================================================================== */
/*  BACKGROUND DECORATION                                              */
/* ================================================================== */

function BackgroundDecoration() {
    return (
        <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden="true"
        >
            <div className="dt-glow absolute left-1/2 top-1/2 h-[520px] w-[820px] rounded-full bg-blue-400/20 blur-[150px]" />

            <svg
                className="dt-drift absolute -right-32 -top-32 h-[500px] w-[500px] text-blue-300/[0.09]"
                viewBox="0 0 500 500"
                fill="none"
            >
                <circle cx="250" cy="250" r="249" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="250" cy="250" r="182" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="250" cy="250" r="115" stroke="currentColor" strokeWidth="1.5" />
            </svg>

            <svg
                className="dt-drift-slow absolute -bottom-40 -left-40 h-[600px] w-[600px] text-blue-200/[0.07]"
                viewBox="0 0 600 600"
                fill="none"
            >
                <circle cx="300" cy="300" r="299" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="300" cy="300" r="222" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="300" cy="300" r="145" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="300" cy="300" r="68" stroke="currentColor" strokeWidth="1.5" />
            </svg>

            <svg
                className="absolute inset-x-0 bottom-0 h-[260px] w-full text-blue-400/[0.08]"
                viewBox="0 0 1440 260"
                fill="none"
                preserveAspectRatio="none"
            >
                <path
                    d="M0 200 C 360 100, 1080 300, 1440 160 L1440 260 L0 260 Z"
                    fill="currentColor"
                />
            </svg>

            <svg
                className="absolute inset-x-0 top-0 h-[220px] w-full text-blue-300/[0.07]"
                viewBox="0 0 1440 220"
                fill="none"
                preserveAspectRatio="none"
            >
                <path
                    d="M0 140 C 320 40, 1120 240, 1440 100"
                    stroke="currentColor"
                    strokeWidth="1.5"
                />
            </svg>
        </div>
    );
}

/* ================================================================== */
/*  MODE TABS                                                          */
/* ================================================================== */

function ModeTabs({ mode, onChange }) {
    return (
        <div
            role="tablist"
            aria-label="Login method"
            className="grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1"
        >
            <button
                type="button"
                role="tab"
                aria-selected={mode === 'pin'}
                onClick={() => onChange('pin')}
                className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                    mode === 'pin'
                        ? 'bg-white text-blue-800 shadow-sm ring-1 ring-slate-900/5'
                        : 'text-slate-500 hover:text-slate-800'
                }`}
            >
                
                PIN
            </button>

            <button
                type="button"
                role="tab"
                aria-selected={mode === 'password'}
                onClick={() => onChange('password')}
                className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                    mode === 'password'
                        ? 'bg-white text-blue-800 shadow-sm ring-1 ring-slate-900/5'
                        : 'text-slate-500 hover:text-slate-800'
                }`}
            >
                
                Password
            </button>
        </div>
    );
}

/* ================================================================== */
/*  LOGIN CARD                                                         */
/* ================================================================== */

function LoginCard({
    passwordForm,
    pinForm,
    mode,
    switchMode,
    status,
    canResetPassword,
}) {
    const [showPassword, setShowPassword] = useState(false);
    const activeForm = mode === 'pin' ? pinForm : passwordForm;

    return (
        <div
            className="dt-fade-up relative z-10 w-full max-w-[380px]"
            style={{ animationDelay: '0.05s' }}
        >
            <div className="rounded-2xl bg-white p-6 shadow-[0_24px_60px_-20px_rgba(2,6,23,0.55)] ring-1 ring-white/10 sm:p-7">
                {/* ---------- Brand ---------- */}
                <div className="flex flex-col items-center text-center">
                    <img
                        src={OPOL_LOGO}
                        alt="OPOL LGU Seal"
                        className="h-10 w-10 object-contain sm:h-11 sm:w-11"
                        draggable="false"
                    />
                    <h1 className="mt-3 text-sm font-bold uppercase tracking-[0.24em] text-slate-900 sm:text-base">
                        Doctrak
                    </h1>
                    <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                        Municipality of Opol
                    </p>
                </div>

                {/* ---------- Mode tabs ---------- */}
                <div className="mt-5">
                    <ModeTabs mode={mode} onChange={switchMode} />
                </div>

                {status && (
                    <div
                        role="status"
                        className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700"
                    >
                        {status}
                    </div>
                )}

                {/* ---------- Form ---------- */}
                <form
                    onSubmit={
                        mode === 'pin' ? pinForm.submit : passwordForm.submit
                    }
                    className="mt-5 space-y-3.5"
                >
                    {mode === 'pin' ? (
                        /* ---------- PIN-ONLY ---------- */
                        <div>
                            <label
                                htmlFor="pin"
                                className="mb-2 block text-center text-xs font-medium text-slate-500"
                            >
                                Enter your 4-digit PIN
                            </label>

                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                    <Hash className="h-4 w-4" strokeWidth={1.8} />
                                </span>

                                <input
                                    id="pin"
                                    name="pin"
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={4}
                                    autoComplete="off"
                                    autoFocus
                                    value={pinForm.data.pin}
                                    onChange={(e) =>
                                        pinForm.setData(
                                            'pin',
                                            e.target.value
                                                .replace(/\D/g, '')
                                                .slice(0, 4)
                                        )
                                    }
                                    placeholder="••••"
                                    aria-label="4-digit PIN"
                                    className={`${FIELD_BASE} pl-9 py-3.5 text-center font-mono text-2xl tracking-[0.6em] ${
                                        pinForm.errors.pin
                                            ? FIELD_ERROR
                                            : FIELD_OK
                                    }`}
                                />
                            </div>

                            {/* Progress dots */}
                            <div className="mt-3 flex justify-center gap-1.5">
                                {[0, 1, 2, 3].map((i) => (
                                    <span
                                        key={i}
                                        className={`h-1.5 w-9 rounded-full transition-colors duration-150 ${
                                            i < pinForm.data.pin.length
                                                ? 'bg-blue-800'
                                                : 'bg-slate-200'
                                        }`}
                                        aria-hidden
                                    />
                                ))}
                            </div>

                            <InputError
                                message={pinForm.errors.pin}
                                className="mt-2 text-center"
                            />
                        </div>
                    ) : (
                        /* ---------- PASSWORD ---------- */
                        <>
                            <div>
                                <label
                                    htmlFor="username"
                                    className="mb-1.5 block text-xs font-medium text-slate-600"
                                >
                                    Username
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    value={passwordForm.data.username}
                                    onChange={(e) =>
                                        passwordForm.setData(
                                            'username',
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter your username"
                                    autoComplete="username"
                                    autoFocus
                                    className={`${FIELD_BASE} ${
                                        passwordForm.errors.username
                                            ? FIELD_ERROR
                                            : FIELD_OK
                                    }`}
                                />
                                <InputError
                                    message={passwordForm.errors.username}
                                    className="mt-1.5"
                                />
                            </div>

                            <div>
                                <div className="mb-1.5 flex items-center justify-between gap-3">
                                    <label
                                        htmlFor="password"
                                        className="block text-xs font-medium text-slate-600"
                                    >
                                        Password
                                    </label>

                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="rounded text-[11px] font-medium text-blue-700 transition-colors duration-200 hover:text-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
                                        >
                                            Forgot?
                                        </Link>
                                    )}
                                </div>

                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        value={passwordForm.data.password}
                                        onChange={(e) =>
                                            passwordForm.setData(
                                                'password',
                                                e.target.value
                                            )
                                        }
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        className={`${FIELD_BASE} pr-10 ${
                                            passwordForm.errors.password
                                                ? FIELD_ERROR
                                                : FIELD_OK
                                        }`}
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword((v) => !v)
                                        }
                                        aria-label={
                                            showPassword
                                                ? 'Hide password'
                                                : 'Show password'
                                        }
                                        aria-pressed={showPassword}
                                        className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-3 text-slate-400 transition-colors duration-200 hover:text-slate-700 focus:outline-none focus-visible:text-slate-700"
                                    >
                                        <span className="relative block h-4 w-4">
                                            <Eye
                                                className={`absolute inset-0 h-4 w-4 transition-all duration-200 ${
                                                    showPassword
                                                        ? 'rotate-90 scale-75 opacity-0'
                                                        : 'rotate-0 scale-100 opacity-100'
                                                }`}
                                                strokeWidth={1.8}
                                                aria-hidden="true"
                                            />
                                            <EyeOff
                                                className={`absolute inset-0 h-4 w-4 transition-all duration-200 ${
                                                    showPassword
                                                        ? 'rotate-0 scale-100 opacity-100'
                                                        : '-rotate-90 scale-75 opacity-0'
                                                }`}
                                                strokeWidth={1.8}
                                                aria-hidden="true"
                                            />
                                        </span>
                                    </button>
                                </div>
                                <InputError
                                    message={passwordForm.errors.password}
                                    className="mt-1.5"
                                />
                            </div>
                        </>
                    )}

                    {/* Remember this device */}
                    <label
                        htmlFor="remember"
                        className="flex cursor-pointer select-none items-center gap-2 pt-0.5"
                    >
                        <span className="relative flex h-4 w-4 flex-none items-center justify-center">
                            <input
                                id="remember"
                                name="remember"
                                type="checkbox"
                                checked={activeForm.data.remember}
                                onChange={(e) =>
                                    activeForm.setData(
                                        'remember',
                                        e.target.checked
                                    )
                                }
                                className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 bg-white transition-all duration-200 checked:border-blue-800 checked:bg-blue-800 hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 focus-visible:ring-offset-1"
                            />
                            <Check
                                className="pointer-events-none absolute h-2.5 w-2.5 scale-50 text-white opacity-0 transition-all duration-200 peer-checked:scale-100 peer-checked:opacity-100"
                                strokeWidth={3.5}
                                aria-hidden="true"
                            />
                        </span>

                        <span className="text-xs text-slate-600">
                            Remember this device
                        </span>
                    </label>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={activeForm.processing}
                        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(30,64,175,0.9)] transition-all duration-300 hover:bg-blue-900 hover:shadow-[0_12px_26px_-10px_rgba(30,64,175,0.95)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-blue-800"
                    >
                        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                        {activeForm.processing ? (
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
                                <span>
                                    {mode === 'pin'
                                        ? 'Sign in'
                                        : 'Sign in'}
                                </span>
                                <ArrowRight
                                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                                    strokeWidth={2.2}
                                    aria-hidden="true"
                                />
                            </>
                        )}
                    </button>
                </form>

                {/* ---------- Contextual footer ---------- */}
                <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
                    {mode === 'pin'
                        ? 'Forgot your PIN? Ask your administrator to reset it.'
                        : 'Use your username and password to sign in.'}
                </p>
            </div>

            <p
                className="dt-fade mt-4 text-center text-[10.5px] leading-relaxed text-blue-100/55"
                style={{ animationDelay: '0.5s' }}
            >
                For authorized personnel only. Unauthorized access is
                prohibited.
            </p>
        </div>
    );
}

/* ================================================================== */
/*  MAIN PAGE                                                          */
/* ================================================================== */

export default function Login({ status, canResetPassword }) {
    // Always open on PIN — it's the primary method.
    const [mode, setMode] = useState('pin');

    /* --------- PIN form (PIN only, no username) --------- */
    const pinFormRaw = useForm({
        pin: '',
        remember: true,
    });

    /* --------- Password form (full credentials) --------- */
    const passwordFormRaw = useForm({
        username: '',
        password: '',
        remember: false,
    });

    const pinForm = {
        ...pinFormRaw,
        submit: (e) => {
            e?.preventDefault();
            pinFormRaw.post(route('login.pin'), {
                onFinish: () => pinFormRaw.reset('pin'),
            });
        },
    };

    const passwordForm = {
        ...passwordFormRaw,
        submit: (e) => {
            e?.preventDefault();
            passwordFormRaw.post(route('login'), {
                onFinish: () => passwordFormRaw.reset('password'),
            });
        },
    };

    /* --------- Mode switch: clear errors on the other tab --------- */
    function switchMode(next) {
        if (next === mode) return;

        if (next === 'pin') {
            passwordFormRaw.clearErrors();
        } else {
            pinFormRaw.clearErrors();
        }

        setMode(next);
    }

    return (
        <>
            <Head title="Login — OPOL LGU Document Tracking System" />

            <style>{KEYFRAMES}</style>

            <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-gradient-to-br from-[#0e2f68] via-[#0a1f44] to-[#050f28] px-5 py-10 sm:px-6">
                <BackgroundDecoration />

                <LoginCard
                    passwordForm={passwordForm}
                    pinForm={pinForm}
                    mode={mode}
                    switchMode={switchMode}
                    status={status}
                    canResetPassword={canResetPassword}
                />
            </div>
        </>
    );
}