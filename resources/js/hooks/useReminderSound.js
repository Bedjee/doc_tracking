import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';

const STORAGE_KEY = 'reminder-audio-enabled';
const STATE_KEY = 'reminder-last-state';

/**
 * Path to the sound file.
 */
const SOUND_URL = '/sounds/notif_sound.wav';

/**
 * Minimum gap between two consecutive plays. Prevents a chime storm when
 * the user clicks several links quickly.
 */
const MIN_PLAY_GAP_MS = 900;

/**
 * Plays a chime while a reminder is active.
 *
 *  - Plays on every Inertia navigation, as long as there are unread
 *    reminders. This is the "continuous reminder" behaviour.
 *  - Also plays on tier escalation (urgent / overdue), with higher volume.
 *  - The first play after landing on a page fires on the first user
 *    interaction — that gesture unlocks the browser's autoplay policy.
 *  - Silenced while the tab is hidden.
 *  - Respects a mute toggle persisted in localStorage.
 */
export function useReminderSound(reminders) {
    const [enabled, setEnabled] = useState(() => {
        if (typeof window === 'undefined') return true;
        return localStorage.getItem(STORAGE_KEY) !== 'off';
    });

    const audioRef = useRef(null);
    const unlockedRef = useRef(false);
    const lastPlayRef = useRef(0);

    /* ---- Refs that always reflect the latest values for event handlers ---- */
    const remindersRef = useRef(reminders);
    const enabledRef = useRef(enabled);

    useEffect(() => {
        remindersRef.current = reminders;
    }, [reminders]);

    useEffect(() => {
        enabledRef.current = enabled;
    }, [enabled]);

    /* ---- Preload the audio element once ---- */
    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const audio = new Audio(SOUND_URL);
        audio.preload = 'auto';
        audio.volume = 0.7;
        audioRef.current = audio;

        return () => {
            try {
                audio.pause();
                audio.src = '';
            } catch {
                /* noop */
            }
            audioRef.current = null;
        };
    }, []);

    /* ---- Core player (throttled) ---- */
    const playSound = useCallback((priority = 'soft') => {
        const audio = audioRef.current;
        if (!audio) return;

        const now = Date.now();
        if (now - lastPlayRef.current < MIN_PLAY_GAP_MS) return;
        lastPlayRef.current = now;

        try {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = priority === 'strong' ? 0.85 : 0.6;

            const p = audio.play();
            if (p && typeof p.catch === 'function') {
                p.catch(() => {
                    /* autoplay blocked or file missing */
                });
            }
        } catch {
            /* noop */
        }
    }, []);

    /* ---- Unlock on first user gesture; chime once if reminders are active ---- */
    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const unlock = () => {
            if (unlockedRef.current) return;
            const audio = audioRef.current;
            if (!audio) return;

            const prevVolume = audio.volume;
            audio.volume = 0;
            const p = audio.play();

            if (p && typeof p.then === 'function') {
                p.then(() => {
                    audio.pause();
                    audio.currentTime = 0;
                    audio.volume = prevVolume;
                    unlockedRef.current = true;

                    // First interaction is a good moment to chime if
                    // reminders are already waiting.
                    if (
                        enabledRef.current &&
                        remindersRef.current?.length > 0
                    ) {
                        // Slight delay so it doesn't overlap the click sound.
                        setTimeout(() => playSound('soft'), 80);
                    }
                }).catch(() => {
                    // Browser still refusing — retry on the next gesture.
                    audio.volume = prevVolume;
                });
            } else {
                audio.volume = prevVolume;
                unlockedRef.current = true;
            }
        };

        window.addEventListener('pointerdown', unlock);
        window.addEventListener('keydown', unlock);

        return () => {
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };
    }, [playSound]);

    /* ---- Persist mute preference ---- */
    const setMuted = useCallback((muted) => {
        setEnabled(!muted);
        try {
            localStorage.setItem(STORAGE_KEY, muted ? 'off' : 'on');
        } catch {
            /* ignore quota errors */
        }
    }, []);

    /* ---- React to queue changes (escalation, new items) ---- */
    useEffect(() => {
        if (!enabled) return;
        if (typeof window === 'undefined') return;
        if (document.visibilityState !== 'visible') return;

        const currentTier = highestTier(reminders);
        const currentCount = reminders.length;

        let last = null;
        try {
            last = JSON.parse(sessionStorage.getItem(STATE_KEY) || 'null');
        } catch {
            last = null;
        }

        const next = { count: currentCount, tier: currentTier };

        let priority = null;

        if (last && last.count !== undefined && last.tier) {
            const escalated = tierRank(currentTier) > tierRank(last.tier);

            if (escalated) {
                priority = 'strong';
            } else if (currentCount > last.count) {
                priority =
                    currentTier === 'overdue' || currentTier === 'urgent'
                        ? 'strong'
                        : 'soft';
            }
        }
        // We intentionally don't play on the very first observation of a
        // session — the unlock handler already covers that.

        try {
            sessionStorage.setItem(STATE_KEY, JSON.stringify(next));
        } catch {
            /* ignore */
        }

        if (priority && unlockedRef.current) {
            playSound(priority);
        }
    }, [reminders, enabled, playSound]);

    /* ---- Play on every navigation while reminders are active ---- */
    useEffect(() => {
        const handler = () => {
            // Muted? Skip.
            if (!enabledRef.current) return;

            // Not yet unlocked by a user gesture? Skip; the unlock handler
            // will play the first chime when the user interacts.
            if (!unlockedRef.current) return;

            // Tab hidden? Don't play.
            if (document.visibilityState !== 'visible') return;

            // No active reminders? Nothing to remind about.
            const list = remindersRef.current;
            if (!list || list.length === 0) return;

            playSound('soft');
        };

        // Inertia v1: router.on returns a listener id / cleanup.
        const cleanup = router.on('navigate', handler);

        return () => {
            try {
                if (typeof cleanup === 'function') cleanup();
            } catch {
                /* noop */
            }
        };
    }, [playSound]);

    return {
        enabled,
        muted: !enabled,
        setMuted,
    };
}

/* ---------------- helpers ---------------- */

function highestTier(reminders) {
    if (!reminders?.length) return 'none';
    return reminders.reduce(
        (acc, r) => (tierRank(r.tier) > tierRank(acc) ? r.tier : acc),
        'none'
    );
}

function tierRank(tier) {
    switch (tier) {
        case 'overdue': return 4;
        case 'urgent':  return 3;
        case 'warning': return 2;
        case 'info':    return 1;
        default:        return 0;
    }
}