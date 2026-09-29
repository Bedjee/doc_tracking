import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { Eye, EyeOff, Hash, KeyRound, ShieldCheck } from 'lucide-react';
import Modal from '@/Components/UI/Modal';
import Button from '@/Components/UI/Button';
import { useToast } from '@/Components/UI/Toast';

/**
 * Change or set the authenticated user's 4-digit PIN.
 *
 *   hasPin = true  → requires current PIN + new PIN + confirm
 *   hasPin = false → requires new PIN + confirm
 */
export default function ChangePinModal({ show, onClose, hasPin = false }) {
    const toast = useToast();

    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPins, setShowPins] = useState(false);

    const currentRef = useRef(null);
    const newRef = useRef(null);
    const confirmRef = useRef(null);

    /* ---------------- reset + autofocus when opening ---------------- */
    useEffect(() => {
        if (!show) {
            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');
            setErrors({});
            setBusy(false);
            setShowPins(false);
            return;
        }

        const t = setTimeout(() => {
            (hasPin ? currentRef : newRef).current?.focus();
        }, 120);

        return () => clearTimeout(t);
    }, [show, hasPin]);

    /* ---------------- input sanitizer ---------------- */
    function digitsOnly(value) {
        return value.replace(/\D/g, '').slice(0, 4);
    }

    /* ---------------- client-side validation ---------------- */
    function validate() {
        const next = {};

        if (hasPin && currentPin.length !== 4) {
            next.current_pin = 'Enter your current 4-digit PIN.';
        }
        if (newPin.length !== 4) {
            next.pin = 'Enter a 4-digit PIN.';
        }
        if (!hasPin && newPin.length === 4 && confirmPin.length === 4 && newPin !== confirmPin) {
            next.pin = 'The PINs do not match.';
        }
        if (hasPin && newPin.length === 4 && confirmPin.length === 4 && newPin !== confirmPin) {
            next.pin = 'The PINs do not match.';
        }

        setErrors(next);

        return Object.keys(next).length === 0;
    }

    /* ---------------- submit ---------------- */
    function submit(e) {
        e?.preventDefault();

        if (!validate()) return;

        setBusy(true);

        router.post(
            route('settings.pin.update'),
            {
                current_pin: hasPin ? currentPin : null,
                pin: newPin,
                pin_confirmation: confirmPin,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        hasPin
                            ? 'PIN updated successfully.'
                            : 'PIN set successfully.'
                    );
                    onClose?.();
                },
                onError: (e) => {
                    setErrors(e);
                    const first = Object.values(e ?? {})[0];
                    if (first) toast.error(first);
                },
                onFinish: () => setBusy(false),
            }
        );
    }

    /* ---------------- do not close while submitting ---------------- */
    function handleClose() {
        if (busy) return;
        onClose?.();
    }

    return (
        <Modal
            show={show}
            onClose={handleClose}
            title={hasPin ? 'Change PIN' : 'Set PIN'}
            maxWidth="max-w-sm"
            footer={
                <>
                    <Button
                        variant="secondary"
                        onClick={handleClose}
                        disabled={busy}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={submit}
                        loading={busy}
                        className="flex-1"
                    >
                        {hasPin ? 'Save PIN' : 'Set PIN'}
                    </Button>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-4">
                {/* ---------- Intro ---------- */}
                <div className="flex items-start gap-2.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-[11px] leading-snug text-sky-800">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <p>
                        {hasPin
                            ? 'Your PIN is a 4-digit code you can use instead of your password. Never share it with anyone.'
                            : 'Set a 4-digit PIN so you can sign in faster next time. Never share it with anyone.'}
                    </p>
                </div>

                {/* ---------- Show / hide toggle ---------- */}
                <div className="flex items-center justify-end">
                    <button
                        type="button"
                        onClick={() => setShowPins((v) => !v)}
                        className="inline-flex items-center gap-1.5 rounded text-[11px] font-medium text-slate-500 transition hover:text-slate-700 focus:outline-none focus-visible:text-slate-700"
                    >
                        {showPins ? (
                            <>
                                <EyeOff className="h-3.5 w-3.5" />
                                Hide PINs
                            </>
                        ) : (
                            <>
                                <Eye className="h-3.5 w-3.5" />
                                Show PINs
                            </>
                        )}
                    </button>
                </div>

                {/* ---------- Current PIN (only if hasPin) ---------- */}
                {hasPin && (
                    <PinField
                        id="current_pin"
                        label="Current PIN"
                        value={currentPin}
                        onChange={setCurrentPin}
                        inputRef={currentRef}
                        error={errors.current_pin}
                        show={showPins}
                        onComplete={() => newRef.current?.focus()}
                    />
                )}

                {/* ---------- New PIN ---------- */}
                <PinField
                    id="pin"
                    label={hasPin ? 'New PIN' : 'PIN'}
                    value={newPin}
                    onChange={setNewPin}
                    inputRef={newRef}
                    error={errors.pin}
                    show={showPins}
                    onComplete={() => confirmRef.current?.focus()}
                />

                {/* ---------- Confirm ---------- */}
                <PinField
                    id="pin_confirmation"
                    label="Confirm PIN"
                    value={confirmPin}
                    onChange={setConfirmPin}
                    inputRef={confirmRef}
                    error={errors.pin_confirmation}
                    show={showPins}
                    onComplete={submit}
                />

                {/* ---------- Match hint ---------- */}
                {newPin.length === 4 &&
                    confirmPin.length === 4 &&
                    newPin === confirmPin &&
                    !errors.pin && (
                        <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-emerald-600">
                            <KeyRound className="h-3 w-3" />
                            PINs match
                        </p>
                    )}
            </form>
        </Modal>
    );
}

/* ================================================================== */
/*  PIN input                                                          */
/* ================================================================== */

function PinField({
    id,
    label,
    value,
    onChange,
    inputRef,
    error,
    show,
    onComplete,
}) {
    return (
        <div>
            <label
                htmlFor={id}
                className="mb-1.5 block text-xs font-medium text-slate-600"
            >
                {label}
            </label>

            <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Hash className="h-4 w-4" strokeWidth={1.8} />
                </span>

                <input
                    ref={inputRef}
                    id={id}
                    name={id}
                    type={show ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    autoComplete="off"
                    value={value}
                    onChange={(e) => {
                        const next = e.target.value
                            .replace(/\D/g, '')
                            .slice(0, 4);
                        onChange(next);
                        if (next.length === 4) onComplete?.();
                    }}
                    placeholder="••••"
                    aria-label={label}
                    className={`block w-full rounded-lg border bg-white px-3 py-2.5 pl-9 text-center font-mono text-2xl tracking-[0.5em] text-slate-900 shadow-sm outline-none transition focus:ring-4 ${
                        error
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                            : 'border-slate-200 hover:border-slate-300 focus:border-blue-700 focus:ring-blue-700/10'
                    }`}
                />
            </div>

            {/* PIN progress dots */}
            <div className="mt-1.5 flex justify-center gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                    <span
                        key={i}
                        className={`h-1 w-7 rounded-full transition-colors duration-150 ${
                            i < value.length ? 'bg-blue-800' : 'bg-slate-200'
                        }`}
                        aria-hidden
                    />
                ))}
            </div>

            {error && (
                <p className="mt-1.5 text-center text-[11px] font-medium text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}