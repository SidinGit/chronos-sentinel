'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { 
    LayoutDashboard, 
    MonitorSmartphone, 
    Clock, 
    Settings, 
    LogOut,
    Activity
} from 'lucide-react';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Sessions', href: '/sessions', icon: Clock },
    { name: 'Devices', href: '/devices', icon: MonitorSmartphone },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-card px-3 py-4">
            <div className="mb-8 flex items-center gap-2 px-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <Activity className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold tracking-tight">Sentinel</span>
            </div>

            <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-secondary text-secondary-foreground'
                                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto border-t pt-4">
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
