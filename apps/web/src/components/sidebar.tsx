'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useLayout } from '@/components/layout-provider';
import { cn } from '@/lib/utils';
import logo from '../app/icon.png';
import { 
    LayoutDashboard, 
    MonitorSmartphone, 
    Clock, 
    Settings, 
    LogOut,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Sessions', href: '/sessions', icon: Clock },
    { name: 'Devices', href: '/devices', icon: MonitorSmartphone },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { isSidebarCollapsed, toggleSidebar } = useLayout();

    return (
        <div className={cn(
            "flex h-screen flex-col border-r bg-card px-3 py-4 transition-all duration-300",
            isSidebarCollapsed ? "w-20 items-center" : "w-64"
        )}>
            <div className={cn("mb-8 flex items-center gap-3", isSidebarCollapsed ? "justify-center" : "px-3")}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden">
                    <Image 
                        src={logo} 
                        alt="Sentinel Logo" 
                        className="h-full w-full object-contain grayscale brightness-0 invert" 
                        priority
                    />
                </div>
                {!isSidebarCollapsed && <span className="text-2xl font-black tracking-tighter uppercase italic">Sentinel</span>}
            </div>

            <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                isSidebarCollapsed ? 'justify-center' : 'gap-3',
                                isActive
                                    ? 'bg-secondary text-secondary-foreground'
                                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                            )}
                            title={isSidebarCollapsed ? item.name : undefined}
                        >
                            <item.icon className="h-4 w-4 shrink-0" />
                            {!isSidebarCollapsed && <span>{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto border-t pt-4 w-full flex flex-col gap-2">
                <button
                    onClick={toggleSidebar}
                    className={cn(
                        "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/50",
                        isSidebarCollapsed ? "justify-center" : "gap-3"
                    )}
                    title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isSidebarCollapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronLeft className="h-4 w-4 shrink-0" />}
                    {!isSidebarCollapsed && <span>Collapse</span>}
                </button>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className={cn(
                        "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
                        isSidebarCollapsed ? "justify-center" : "gap-3"
                    )}
                    title={isSidebarCollapsed ? "Sign Out" : undefined}
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {!isSidebarCollapsed && <span>Sign Out</span>}
                </button>
            </div>
        </div>
    );
}
