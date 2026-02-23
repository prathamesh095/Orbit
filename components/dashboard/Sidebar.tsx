'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { LucideProps } from 'lucide-react';
import {
    LayoutDashboard,
    Briefcase,
    Users,
    Settings,
    LogOut,
    BookOpen,
    Bell,
    PanelLeftClose,
    PanelLeftOpen,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/lib/toastContext';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const SIDEBAR_WIDTH_EXPANDED = 272;
const SIDEBAR_WIDTH_COLLAPSED = 72;
const SIDEBAR_WIDTH_MOBILE = 288;
const ANIMATION_EASING: [number, number, number, number] = [0.4, 0, 0.2, 1];
const ANIMATION_DURATION = 0.22;
const TOOLTIP_DELAY_MS = 200;

// ─── Types ────────────────────────────────────────────────────────────────────

type LucideIcon = React.ComponentType<LucideProps>;

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    exactMatch?: boolean;
}

// ─── Nav Items ────────────────────────────────────────────────────────────────

const PRIMARY_NAV: NavItem[] = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exactMatch: true },
    { href: '/applications', label: 'Pipeline', icon: Briefcase },
    { href: '/contacts', label: 'Network', icon: Users },
    { href: '/library', label: 'Library', icon: BookOpen },
];

const UTILITY_NAV: NavItem[] = [
    { href: '/notifications', label: 'Notifications', icon: Bell, exactMatch: true },
    { href: '/settings', label: 'Settings', icon: Settings, exactMatch: false },
];

// ─── Active Route Detection ───────────────────────────────────────────────────

function isNavItemActive(pathname: string, item: NavItem): boolean {
    if (item.exactMatch) return pathname === item.href;
    if (item.href === '/applications') {
        return pathname.startsWith('/applications') && !pathname.startsWith('/applications/kanban');
    }
    return pathname.startsWith(item.href);
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipProps {
    label: string;
    children: React.ReactNode;
    disabled?: boolean;
}

function Tooltip({ label, children, disabled }: TooltipProps) {
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const show = useCallback(() => {
        timerRef.current = setTimeout(() => setVisible(true), TOOLTIP_DELAY_MS);
    }, []);
    const hide = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setVisible(false);
    }, []);

    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

    if (disabled) return <>{children}</>;

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
        >
            {children}
            <AnimatePresence>
                {visible && (
                    <motion.div
                        role="tooltip"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute left-full ml-3 z-[999] pointer-events-none whitespace-nowrap rounded-[6px] bg-neutral-900 px-2 py-1.5 text-[12px] leading-none text-white shadow-lg"
                    >
                        {label}
                        <span
                            className="absolute right-full top-1/2 -translate-y-1/2"
                            style={{
                                borderWidth: 4,
                                borderStyle: 'solid',
                                borderColor: 'transparent',
                                borderRightColor: '#171717',
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────

interface NavItemComponentProps {
    item: NavItem;
    active: boolean;
    collapsed: boolean;
    onClick?: () => void;
}

function NavItemComponent({ item, active, collapsed, onClick }: NavItemComponentProps) {
    const Icon = item.icon;

    return (
        <Tooltip label={item.label} disabled={!collapsed}>
            <Link
                href={item.href}
                onClick={onClick}
                aria-current={active ? 'page' : undefined}
                className={cn(
                    'relative flex items-center h-10 rounded-[10px] transition-colors duration-150',
                    'outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
                    collapsed
                        ? 'w-10 mx-auto justify-center px-0'
                        : 'gap-3 px-3',
                    active
                        ? 'text-blue-600'
                        : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'
                )}
            >
                {/* Animated active background pill */}
                {active && (
                    <motion.span
                        layoutId="active-nav-pill"
                        className="absolute inset-0 rounded-[10px] bg-blue-600/[0.09]"
                        transition={{ duration: ANIMATION_DURATION, ease: ANIMATION_EASING }}
                    />
                )}

                <Icon
                    size={18}
                    strokeWidth={1.75}
                    className={cn(
                        'relative shrink-0 transition-colors duration-150',
                        active ? 'text-blue-600' : 'text-neutral-400'
                    )}
                />

                {!collapsed && (
                    <span
                        className={cn(
                            'relative truncate',
                            active
                                ? 'text-blue-600 font-semibold'
                                : 'text-neutral-600 font-medium'
                        )}
                        style={{ fontSize: '13.5px', lineHeight: '1.2' }}
                    >
                        {item.label}
                    </span>
                )}
            </Link>
        </Tooltip>
    );
}

// ─── User Avatar ──────────────────────────────────────────────────────────────

function UserAvatar({ name }: { name: string }) {
    const initials = name
        .split(' ')
        .map((w) => w[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('');
    return (
        <div
            aria-hidden="true"
            className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-semibold shrink-0 select-none"
        >
            {initials || '?'}
        </div>
    );
}

// ─── Sidebar Content (shared between Desktop & Mobile) ───────────────────────

interface SidebarContentProps {
    collapsed: boolean;
    onToggle: () => void;
    onClose?: () => void;
    isMobileDrawer?: boolean;
}

function SidebarContent({ collapsed, onToggle, onClose, isMobileDrawer }: SidebarContentProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const { success } = useToast();

    const handleLogout = async () => {
        onClose?.();
        await logout();
        success('Signed out successfully');
        router.push('/login');
    };

    return (
        <div className="flex flex-col h-full select-none">

            {/* ─── Zone 1: Header ─────────────────────────────────── */}
            <div
                className="flex items-center h-16 px-4 border-b border-neutral-100 shrink-0"
            >
                {/* Logo */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-sm shrink-0">
                    <Briefcase size={15} strokeWidth={2} className="text-white" />
                </div>

                {/* Brand name (hidden when collapsed) */}
                {!collapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                        className="ml-3 min-w-0 flex-1"
                    >
                        <p
                            className="font-semibold text-neutral-900 truncate leading-tight"
                            style={{ fontSize: 14, letterSpacing: '0.01em' }}
                        >
                            JobTrack
                        </p>
                        <p className="text-[10px] text-neutral-400 font-medium tracking-wider truncate leading-tight">
                            CRM
                        </p>
                    </motion.div>
                )}

                {/* Collapse / Close toggle */}
                <button
                    onClick={isMobileDrawer ? onClose : onToggle}
                    aria-label={
                        isMobileDrawer
                            ? 'Close navigation'
                            : collapsed
                                ? 'Expand sidebar'
                                : 'Collapse sidebar'
                    }
                    className={cn(
                        'flex items-center justify-center w-7 h-7 rounded-lg text-neutral-400',
                        'hover:bg-neutral-100 hover:text-neutral-700 transition-colors duration-150',
                        'focus-visible:ring-2 focus-visible:ring-blue-500 outline-none',
                        collapsed ? 'ml-2' : 'ml-auto'
                    )}
                >
                    {isMobileDrawer
                        ? <X size={16} />
                        : collapsed
                            ? <PanelLeftOpen size={16} />
                            : <PanelLeftClose size={16} />
                    }
                </button>
            </div>

            {/* ─── Zone 2: Primary Navigation ─────────────────────── */}
            <nav
                aria-label="Primary navigation"
                className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 min-h-0"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
            >
                {/* Section label */}
                {!collapsed && (
                    <p
                        className="px-3 mt-1 mb-2 font-medium text-neutral-400 tracking-[0.08em] uppercase"
                        style={{ fontSize: 11 }}
                    >
                        Workspace
                    </p>
                )}

                <div className="space-y-0.5">
                    {PRIMARY_NAV.map((item) => (
                        <NavItemComponent
                            key={item.href}
                            item={item}
                            active={isNavItemActive(pathname, item)}
                            collapsed={collapsed}
                            onClick={onClose}
                        />
                    ))}
                </div>

                {/* ─── Zone 3: Utilities (below divider) ──────────── */}
                <div className="mt-4 pt-4 border-t border-neutral-100 space-y-0.5">
                    {UTILITY_NAV.map((item) => (
                        <NavItemComponent
                            key={item.href}
                            item={item}
                            active={isNavItemActive(pathname, item)}
                            collapsed={collapsed}
                            onClick={onClose}
                        />
                    ))}
                </div>
            </nav>

            {/* ─── Zone 4: User Footer ────────────────────────────── */}
            <div className="shrink-0 border-t border-neutral-100 p-3" style={{ minHeight: 72 }}>
                {collapsed ? (
                    /* Collapsed: avatar only with tooltip */
                    <Tooltip label={user?.name ?? 'Account'} disabled={false}>
                        <button
                            onClick={handleLogout}
                            aria-label={`Account options for ${user?.name ?? 'user'}`}
                            className="w-10 h-10 mx-auto flex items-center justify-center rounded-[10px] hover:bg-neutral-100 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            {user
                                ? <UserAvatar name={user.name} />
                                : <LogOut size={18} className="text-neutral-400" />
                            }
                        </button>
                    </Tooltip>
                ) : (
                    /* Expanded: full user row */
                    <div className="flex items-center gap-2.5">
                        {user && <UserAvatar name={user.name} />}
                        <div className="flex-1 min-w-0">
                            <p
                                className="font-medium text-neutral-800 truncate leading-tight"
                                style={{ fontSize: 13 }}
                            >
                                {user?.name ?? 'Account'}
                            </p>
                            <p
                                className="text-neutral-400 truncate leading-tight mt-0.5"
                                style={{ fontSize: 11 }}
                            >
                                {user?.email ?? ''}
                            </p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                            <button
                                onClick={handleLogout}
                                aria-label="Sign out"
                                className={cn(
                                    'flex items-center justify-center w-7 h-7 rounded-lg text-neutral-400',
                                    'hover:bg-red-50 hover:text-red-500 transition-colors duration-150',
                                    'focus-visible:ring-2 focus-visible:ring-blue-500 outline-none'
                                )}
                            >
                                <LogOut size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Public Sidebar Component ─────────────────────────────────────────────────

export interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    mobileOpen: boolean;
    onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
    const shouldReduceMotion = useReducedMotion();
    const transition = shouldReduceMotion
        ? { duration: 0 }
        : { duration: ANIMATION_DURATION, ease: ANIMATION_EASING };

    return (
        <>
            {/* ── Desktop: fixed sidebar ───────────────────────────── */}
            <motion.aside
                animate={{ width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED }}
                transition={transition}
                className={cn(
                    'fixed left-0 top-0 bottom-0 z-30',
                    'hidden lg:flex flex-col',
                    'bg-white border-r border-neutral-100 overflow-hidden shrink-0'
                )}
                style={{ boxShadow: '1px 0 0 0 rgba(0,0,0,0.03)' }}
                aria-label="Main navigation"
            >
                <SidebarContent collapsed={collapsed} onToggle={onToggle} />
            </motion.aside>

            {/* ── Mobile: slide-in drawer ──────────────────────────── */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-40 lg:hidden"
                            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
                            onClick={onMobileClose}
                            aria-hidden="true"
                        />

                        {/* Drawer panel */}
                        <motion.aside
                            key="drawer"
                            initial={{ x: -SIDEBAR_WIDTH_MOBILE }}
                            animate={{ x: 0 }}
                            exit={{ x: -SIDEBAR_WIDTH_MOBILE }}
                            transition={
                                shouldReduceMotion
                                    ? { duration: 0 }
                                    : { duration: 0.25, ease: ANIMATION_EASING }
                            }
                            style={{ width: SIDEBAR_WIDTH_MOBILE }}
                            className={cn(
                                'fixed left-0 top-0 bottom-0 z-50 flex flex-col',
                                'lg:hidden bg-white border-r border-neutral-100 overflow-hidden'
                            )}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Mobile navigation"
                        >
                            <SidebarContent
                                collapsed={false}
                                onToggle={onToggle}
                                onClose={onMobileClose}
                                isMobileDrawer
                            />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
