import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import Modal from '@/Components/UI/Modal';
import Button from '@/Components/UI/Button';
import { Link, usePage, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    Building2,
    ChevronLeft,
    ChevronRight,
    Eye,
    FileText,
    LayoutDashboard,
    LogOut,
    Menu,
    ScanLine,
    Users as UsersIcon,
    X,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Role helpers                                                       */
/* ------------------------------------------------------------------ */

function navUrl(user, baseName) {
    const candidates = [];
    if (user?.role === 'administrator') candidates.push(`admin.${baseName}`);
    else if (user?.role === 'office_head') candidates.push(`head.${baseName}`);
    candidates.push(baseName);

    for (const name of candidates) {
        try {
            return route(name);
        } catch {
            /* try next */
        }
    }
    return '#';
}

function isAny(patterns) {
    return patterns.some((p) => {
        try {
            return route().current(p);
        } catch {
            return false;
        }
    });
}

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

export default function AuthenticatedLayout({ header, children }) {
    const { auth } = usePage().props;
    const user = auth.user;

    const isAdmin = user.role === 'administrator';
    const isHead = user.role === 'office_head';

    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [logoutOpen, setLogoutOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('sidebar-collapsed');
        if (stored === 'true') setCollapsed(true);
    }, []);

    function toggleCollapsed() {
        setCollapsed((v) => {
            localStorage.setItem('sidebar-collapsed', String(!v));
            return !v;
        });
    }

    useEffect(() => {
        const remove = router.on('navigate', () => setMobileOpen(false));
        return () => {
            try {
                if (typeof remove === 'function') remove();
            } catch {
                /* noop */
            }
        };
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileOpen]);

    /* -------- logout -------- */
    function requestLogout() {
        // Close the mobile drawer first so the modal appears on top cleanly.
        setMobileOpen(false);
        setLogoutOpen(true);
    }

    function confirmLogout() {
        setLoggingOut(true);
        router.post(
            route('logout'),
            {},
            {
                onFinish: () => {
                    setLoggingOut(false);
                    setLogoutOpen(false);
                },
            }
        );
    }

    const nav = [
        {
            label: 'Dashboard',
            icon: LayoutDashboard,
            href: route('dashboard'),
            active: isAny(['dashboard']),
        },
        {
            label: 'Documents',
            icon: FileText,
            href: navUrl(user, 'documents.index'),
            active: isAny([
                'documents.*',
                'admin.documents.*',
                'head.documents.*',
            ]),
        },
        ...(!isAdmin
            ? [
                  {
                      label: 'Scan',
                      icon: ScanLine,
                      href: route('scan.index'),
                      active: isAny(['scan.*']),
                  },
              ]
            : []),
        ...(isHead
            ? [
                  {
                      label: 'Monitor',
                      icon: Eye,
                      href: route('head.monitor.index'),
                      active: isAny(['head.monitor.*']),
                  },
              ]
            : []),
        ...(isAdmin
            ? [
                  {
                      label: 'Live Monitor',
                      icon: Eye,
                      href: route('admin.monitor.index'),
                      active: isAny(['admin.monitor.*']),
                  },
                  {
                      label: 'Offices',
                      icon: Building2,
                      href: route('offices.index'),
                      active: isAny(['offices.*']),
                  },
                  {
                      label: 'Users',
                      icon: UsersIcon,
                      href: route('users.index'),
                      active: isAny(['users.*']),
                  },
              ]
            : []),
    ];

    return (
        <div className="min-h-screen bg-slate-100">
            {/* ============ MOBILE DRAWER ============ */}
            <div
                className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
                    mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
            />

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-slate-900 transition-transform duration-300 ease-out lg:hidden ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                aria-label="Mobile navigation"
            >
                <SidebarContent
                    user={user}
                    nav={nav}
                    collapsed={false}
                    onClose={() => setMobileOpen(false)}
                    onLogoutClick={requestLogout}
                    showClose
                />
            </aside>

            {/* ============ DESKTOP SIDEBAR ============ */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 hidden flex-col bg-slate-900 transition-[width] duration-300 ease-out lg:flex ${
                    collapsed ? 'w-[72px]' : 'w-64'
                }`}
                aria-label="Main navigation"
            >
                <SidebarContent
                    user={user}
                    nav={nav}
                    collapsed={collapsed}
                    onToggleCollapsed={toggleCollapsed}
                    onLogoutClick={requestLogout}
                />
            </aside>

            {/* ============ MAIN AREA ============ */}
            <div
                className={`flex min-h-screen flex-col transition-[padding] duration-300 ease-out ${
                    collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
                }`}
            >
                <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-3 backdrop-blur lg:hidden">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            aria-label="Open navigation"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <Link href="/" className="flex items-center gap-2">
                            <ApplicationLogo className="h-7 w-auto" />
                        </Link>
                    </div>

                    <TopBarUserMenu
                        user={user}
                        onLogoutClick={requestLogout}
                    />
                </header>

                {header && (
                    <header className="hidden border-b border-slate-200 bg-white lg:block">
                        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                {header && (
                    <header className="border-b border-slate-200 bg-white lg:hidden">
                        <div className="px-4 py-3">{header}</div>
                    </header>
                )}

                <main className="flex-1">{children}</main>
            </div>

            {/* ============ LOGOUT CONFIRMATION MODAL ============ */}
            <Modal
                show={logoutOpen}
                onClose={() => !loggingOut && setLogoutOpen(false)}
                maxWidth="max-w-sm"
            >
                <div className="px-1 pb-1 pt-1 text-center sm:px-2 sm:pt-2">
                    {/* Icon */}
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/50">
                        <LogOut className="h-5 w-5" strokeWidth={2} />
                    </div>

                    {/* Title + body */}
                    <h2 className="mt-3 text-base font-semibold text-slate-900">
                        Log out?
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                        You'll need to sign in again to access your account.
                        {user?.name && (
                            <>
                                {' '}
                                Signed in as{' '}
                                <span className="font-medium text-slate-700">
                                    {user.name}
                                </span>
                                .
                            </>
                        )}
                    </p>

                    {/* Actions */}
                    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
                        <Button
                            type="button"
                            variant="secondary"
                            size="lg"
                            className="flex-1"
                            onClick={() => setLogoutOpen(false)}
                            disabled={loggingOut}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="danger"
                            size="lg"
                            className="flex-1"
                            onClick={confirmLogout}
                            loading={loggingOut}
                        >
                            <LogOut className="h-4 w-4" />
                            Log out
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Sidebar content (shared by desktop + mobile drawer)                */
/* ------------------------------------------------------------------ */

function SidebarContent({
    user,
    nav,
    collapsed = false,
    onToggleCollapsed,
    onClose,
    onLogoutClick,
    showClose = false,
}) {
    return (
        <>
            {/* ---- Brand header ---- */}
            <div
                className={`flex h-16 flex-shrink-0 items-center border-b border-white/10 ${
                    collapsed ? 'justify-center px-2' : 'justify-between px-4'
                }`}
            >
                <Link
                    href="/"
                    className="flex items-center gap-2.5 overflow-hidden"
                >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                        <ApplicationLogo className="h-5 w-5" white />
                    </div>
                    {!collapsed && (
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold uppercase tracking-wider text-white">
                                DOCTRAK
                            </p>
                            <p className="truncate text-[10px] text-slate-400">
                                OPOL LGU
                            </p>
                        </div>
                    )}
                </Link>

                {showClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                        aria-label="Close navigation"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* ---- Nav items ---- */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
                {nav.map((item) => (
                    <SidebarLink
                        key={item.label}
                        {...item}
                        collapsed={collapsed}
                    />
                ))}
            </nav>

            {/* ---- Footer: user info + logout + collapse toggle ---- */}
            <div className="flex-shrink-0 space-y-1 border-t border-white/10 p-2">
                <SidebarUserCard user={user} collapsed={collapsed} />

                {/* Logout — now opens the confirmation modal */}
                <button
                    type="button"
                    onClick={onLogoutClick}
                    title={collapsed ? 'Log Out' : undefined}
                    className={`group relative flex w-full items-center rounded-lg text-sm font-medium text-slate-300 transition hover:bg-red-500/15 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-400/40 ${
                        collapsed
                            ? 'justify-center p-2.5'
                            : 'gap-3 px-3 py-2.5'
                    }`}
                >
                    <LogOut
                        className="h-[18px] w-[18px] flex-shrink-0"
                        strokeWidth={1.8}
                    />
                    {!collapsed && <span>Log Out</span>}

                    {collapsed && (
                        <span className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                            Log Out
                        </span>
                    )}
                </button>

                {/* Collapse toggle */}
                {onToggleCollapsed && (
                    <button
                        type="button"
                        onClick={onToggleCollapsed}
                        title={collapsed ? 'Expand sidebar' : undefined}
                        aria-label={
                            collapsed
                                ? 'Expand sidebar'
                                : 'Collapse sidebar'
                        }
                        className={`inline-flex w-full items-center rounded-lg text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20 ${
                            collapsed
                                ? 'justify-center p-2'
                                : 'gap-3 px-3 py-2'
                        }`}
                    >
                        {collapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <>
                                <ChevronLeft className="h-4 w-4 flex-shrink-0" />
                                <span>Collapse</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </>
    );
}

/* ------------------------------------------------------------------ */
/*  Sidebar user card (non-interactive — just shows who's signed in)   */
/* ------------------------------------------------------------------ */

function SidebarUserCard({ user, collapsed }) {
    const initials = getInitials(user.name);

    if (collapsed) {
        return (
            <div
                className="flex items-center justify-center p-1"
                title={`${user.name} — ${user.office?.name ?? 'No office'}`}
            >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold uppercase text-white">
                    {initials}
                </span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold uppercase text-white">
                {initials}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-xs font-semibold text-white">
                    {user.name}
                </p>
                <p className="truncate text-[10px] text-slate-400">
                    {user.office?.name ?? 'No office'}
                </p>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Sidebar navigation link                                            */
/* ------------------------------------------------------------------ */

function SidebarLink({ label, icon: Icon, href, active, collapsed }) {
    return (
        <Link
            href={href}
            title={collapsed ? label : undefined}
            aria-current={active ? 'page' : undefined}
            className={`group relative flex items-center rounded-lg text-sm font-medium transition ${
                collapsed
                    ? 'justify-center px-0 py-2.5'
                    : 'gap-3 px-3 py-2.5'
            } ${
                active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
        >
            <Icon
                className={`h-[18px] w-[18px] flex-shrink-0 ${
                    active
                        ? 'text-white'
                        : 'text-slate-400 group-hover:text-white'
                }`}
                strokeWidth={1.8}
            />
            {!collapsed && <span className="truncate">{label}</span>}

            {collapsed && (
                <span className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    {label}
                </span>
            )}
        </Link>
    );
}

/* ------------------------------------------------------------------ */
/*  Top bar user menu (mobile only — stays a dropdown)                 */
/* ------------------------------------------------------------------ */

function TopBarUserMenu({ user, onLogoutClick }) {
    const initials = getInitials(user.name);

    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 text-sm transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold uppercase text-white">
                        {initials}
                    </span>
                    <span className="hidden text-xs font-medium text-slate-700 sm:inline">
                        {user.name.split(' ')[0]}
                    </span>
                </button>
            </Dropdown.Trigger>
            <Dropdown.Content align="right" width="56">
                <div className="px-4 py-2">
                    <p className="text-sm font-semibold text-slate-800">
                        {user.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                        {user.office?.name ?? 'No office assigned'}
                    </p>
                </div>
                <div className="border-t border-slate-100" />

                {/* Custom button (not Dropdown.Link) so we can intercept
                    the click and open the confirmation modal. */}
                <button
                    type="button"
                    onClick={onLogoutClick}
                    className="flex w-full items-center gap-2 px-4 py-2 text-start text-sm text-slate-700 transition hover:bg-slate-100 focus:outline-none"
                >
                    <LogOut className="h-4 w-4" />
                    Log Out
                </button>
            </Dropdown.Content>
        </Dropdown>
    );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getInitials(name = '') {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();
}