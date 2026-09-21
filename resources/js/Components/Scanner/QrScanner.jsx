import { useEffect, useRef, useState } from 'react';
import {
    Camera,
    CameraOff,
    Flashlight,
    FlashlightOff,
    Loader2,
    Volume2,
    VolumeX,
} from 'lucide-react';
import Button from '@/Components/UI/Button';

const SCANNER_ID = 'qr-scanner-viewport';

export default function QrScanner({ onResult, onError }) {
    const scannerRef = useRef(null);
    const lockRef = useRef(false);
    const [active, setActive] = useState(false);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState(null);
    const [torchSupported, setTorchSupported] = useState(false);
    const [torchOn, setTorchOn] = useState(false);
    const [soundOn, setSoundOn] = useState(true);

    /* -------- cleanup on unmount -------- */
    useEffect(() => {
        return () => {
            stopScanner();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* -------- lock body scroll while camera is active -------- */
    useEffect(() => {
        if (!active) return undefined;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, [active]);

    /* -------- feedback -------- */
    function vibrate() {
        try {
            navigator.vibrate?.(60);
        } catch {
            /* not supported */
        }
    }

    function beep() {
        if (!soundOn) return;
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 900;
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
            setTimeout(() => ctx.close?.(), 400);
        } catch {
            /* audio not allowed */
        }
    }

    /* -------- start camera -------- */
    async function startScanner() {
        setStarting(true);
        setError(null);
        lockRef.current = false;

        try {
            const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

            const scanner = new Html5Qrcode(SCANNER_ID, {
                verbose: false,
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true,
                },
            });
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 15,

                    // Responsive qrbox: adapts to whatever aspect the camera
                    // actually delivers. Never forces a square.
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        // ~80% of the shorter dimension, capped so it doesn't
                        // grow larger than ~340px on big desktop viewports.
                        const edge = Math.max(180, Math.min(340, Math.floor(minEdge * 0.8)));
                        return { width: edge, height: edge };
                    },

                    // No aspectRatio constraint — let the camera use its native
                    // aspect. This is the key fix for desktop webcams.
                    disableFlip: false,
                },
                (decodedText) => {
                    if (lockRef.current) return;
                    lockRef.current = true;

                    vibrate();
                    beep();
                    onResult?.(decodedText);
                    stopScanner();
                },
                () => {
                    /* per-frame decode miss — ignore */
                }
            );

            setActive(true);

            // Detect torch support (Android Chrome yes, iOS & most desktops no).
            try {
                const caps = scanner.getRunningTrackCameraCapabilities?.();
                setTorchSupported(!!caps?.torchFeature?.isSupported?.());
            } catch {
                setTorchSupported(false);
            }
        } catch (e) {
            const message =
                e?.message?.replace(/^.*?:\s*/, '') ||
                'Unable to access the camera. Please grant permission and try again.';
            setError(message);
            onError?.(message);
        } finally {
            setStarting(false);
        }
    }

    /* -------- stop camera -------- */
    async function stopScanner() {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        setTorchOn(false);
        setActive(false);
        if (!scanner) return;
        try {
            await scanner.stop();
            scanner.clear();
        } catch {
            /* already stopped */
        }
    }

    /* -------- torch toggle -------- */
    async function toggleTorch() {
        const scanner = scannerRef.current;
        if (!scanner) return;
        try {
            const next = !torchOn;
            await scanner.applyVideoConstraints({ advanced: [{ torch: next }] });
            setTorchOn(next);
        } catch {
            onError?.('Flashlight is not available on this device.');
        }
    }

    /* -------- render -------- */
    return (
        <div className="space-y-3">
            {/* Camera viewport — always a square on mobile, capped on desktop */}
            <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-slate-900 sm:max-w-lg">
                {/* Use padding-top trick to lock aspect to 1:1 without
                    forcing the camera into a distorted frame */}
                <div className="relative w-full pb-[100%]">
                    <div className="absolute inset-0">
                        <div id={SCANNER_ID} className="h-full w-full" />
                    </div>

                    {/* Viewfinder overlay */}
                    {active && (
                        <div className="pointer-events-none absolute inset-0">
                            {/* Dark mask with a transparent square in the middle */}
                            <div
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl"
                                style={{
                                    width: '70%',
                                    height: '70%',
                                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                                }}
                            />

                            {/* Corner brackets + scan line */}
                            <div
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                style={{ width: '70%', height: '70%' }}
                            >
                                <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-emerald-400" />
                                <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-emerald-400" />
                                <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-emerald-400" />
                                <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-emerald-400" />

                                <div className="absolute inset-0 overflow-hidden">
                                    <div className="qr-scan-line absolute inset-x-0 h-0.5 bg-emerald-400/90 shadow-[0_0_14px_2px_rgba(52,211,153,0.6)]" />
                                </div>
                            </div>

                            <div className="absolute inset-x-0 top-3 flex justify-center">
                                <p className="rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
                                    Align the QR code inside the frame
                                </p>
                            </div>
                        </div>
                    )}

                    {/* In-viewport controls */}
                    {active && (
                        <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-3 px-4">
                            {torchSupported && (
                                <button
                                    type="button"
                                    onClick={toggleTorch}
                                    aria-label="Toggle flashlight"
                                    className="rounded-full bg-white/15 p-3 text-white backdrop-blur-md transition hover:bg-white/25 active:scale-95"
                                >
                                    {torchOn ? (
                                        <Flashlight className="h-5 w-5" />
                                    ) : (
                                        <FlashlightOff className="h-5 w-5" />
                                    )}
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setSoundOn((v) => !v)}
                                aria-label="Toggle sound"
                                className="rounded-full bg-white/15 p-3 text-white backdrop-blur-md transition hover:bg-white/25 active:scale-95"
                            >
                                {soundOn ? (
                                    <Volume2 className="h-5 w-5" />
                                ) : (
                                    <VolumeX className="h-5 w-5" />
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={stopScanner}
                                aria-label="Stop camera"
                                className="rounded-full bg-red-500 p-3 text-white shadow-lg transition hover:bg-red-600 active:scale-95"
                            >
                                <CameraOff className="h-5 w-5" />
                            </button>
                        </div>
                    )}

                    {/* Idle state */}
                    {!active && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                                {starting ? (
                                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                                ) : (
                                    <Camera className="h-6 w-6 text-white/70" />
                                )}
                            </div>
                            <p className="text-sm font-medium text-white/80">
                                {starting ? 'Starting camera…' : 'Camera is off'}
                            </p>
                            {error && (
                                <p className="max-w-xs text-xs text-red-300">{error}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Primary action button */}
            {!active ? (
                <Button
                    type="button"
                    onClick={startScanner}
                    loading={starting}
                    size="lg"
                    className="w-full"
                >
                    <Camera className="h-5 w-5" />
                    {error ? 'Try again' : 'Start camera'}
                </Button>
            ) : (
                <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="w-full sm:hidden"
                    onClick={stopScanner}
                >
                    <CameraOff className="h-5 w-5" /> Stop camera
                </Button>
            )}

            <style>{`
                @keyframes qrScanY {
                    0%   { top: 0%; }
                    50%  { top: calc(100% - 2px); }
                    100% { top: 0%; }
                }
                .qr-scan-line {
                    animation: qrScanY 2.4s ease-in-out infinite;
                }

                /* The video fills its container without cropping.
                   'contain' keeps the full camera frame visible so the
                   user's aim matches what the decoder sees. */
                #${SCANNER_ID} video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: contain !important;
                    background: #000 !important;
                }

                /* Hide html5-qrcode's default chrome */
                #${SCANNER_ID}__dashboard {
                    display: none !important;
                }
                #${SCANNER_ID}__scan_region {
                    background: transparent !important;
                }
                #${SCANNER_ID}__scan_region img {
                    display: none !important;
                }
            `}</style>
        </div>
    );
}