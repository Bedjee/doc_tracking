/**
 * Resolves a route name based on the current user's role.
 * Falls back to the base name if the role-specific one doesn't exist.
 */
export function navFor(user, name, params) {
    const attempts = [];

    if (user?.role === 'administrator') {
        attempts.push(`admin.${name}`);
    } else if (user?.role === 'office_head') {
        attempts.push(`head.${name}`);
    }
    attempts.push(name);

    for (const candidate of attempts) {
        try {
            return route(candidate, params);
        } catch {
            // Try next
        }
    }
    return '#';
}

/** Returns true if the current route matches any of the given names. */
export function currentIs(prefixes) {
    return prefixes.some((p) => route().current(p));
}