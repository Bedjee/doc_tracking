import { useEffect, useState } from 'react';
import { formatDuration, formatDurationLong } from '@/lib/formatDuration';

/**
 * Renders an elapsed duration. Ticks every second for live steps; frozen when
 * either `forwardedAt` is provided or `frozen` is true.
 *
 *   - forwardedAt set             → freeze at that instant (step was released)
 *   - frozen (completed document) → snapshot at mount, never updates
 *   - neither                     → tick live
 */
export default function LiveElapsed({
    from,
    forwardedAt = null,
    frozen = false,
    long = false,
}) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (forwardedAt || frozen) return undefined;

        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [forwardedAt, frozen]);

    if (!from) return <span>—</span>;

    const start = new Date(from).getTime();

    let end;
    if (forwardedAt) {
        end = new Date(forwardedAt).getTime();
    } else if (frozen) {
        // `now` never updates because the effect returns early,
        // so this captures the mount time and stays there.
        end = Math.max(start, now);
    } else {
        end = now;
    }

    const seconds = Math.max(0, Math.floor((end - start) / 1000));

    return (
        <span className="tabular-nums">
            {long ? formatDurationLong(seconds) : formatDuration(seconds)}
        </span>
    );
}