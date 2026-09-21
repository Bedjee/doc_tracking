/**
 * Formats a signed number of seconds into a short human string.
 *   formatDuration(90000)  → "1d 1h"
 *   formatDuration(5400)   → "1h 30m"
 *   formatDuration(45)     → "45s"
 *   formatDuration(-5400)  → "1h 30m"  (absolute value)
 */
export function formatDuration(seconds) {
    if (seconds === null || seconds === undefined) return '—';

    const abs = Math.abs(seconds);
    const days = Math.floor(abs / 86400);
    const hours = Math.floor((abs % 86400) / 3600);
    const minutes = Math.floor((abs % 3600) / 60);
    const secs = Math.floor(abs % 60);

    if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${secs}s`;
}

/**
 * Long-form for tooltips and detailed views.
 *   formatDurationLong(90000)  → "1 day 1 hour"
 *   formatDurationLong(5400)   → "1 hour 30 min"
 *   formatDurationLong(45)     → "45 sec"
 */
export function formatDurationLong(seconds) {
    if (seconds === null || seconds === undefined) return '—';

    const abs = Math.abs(seconds);
    const days = Math.floor(abs / 86400);
    const hours = Math.floor((abs % 86400) / 3600);
    const minutes = Math.floor((abs % 3600) / 60);
    const secs = Math.floor(abs % 60);

    const parts = [];
    if (days) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes) parts.push(`${minutes} min`);
    if (!days && !hours && secs) parts.push(`${secs} sec`);

    return parts.join(' ') || '0 sec';
}

/**
 * Range label like "3 days" or "20–30 days".
 */
export function formatRange(minDays, maxDays) {
    if (!minDays && !maxDays) return '—';
    if (minDays === maxDays) {
        return `${minDays} day${minDays > 1 ? 's' : ''}`;
    }
    return `${minDays}–${maxDays} days`;
}