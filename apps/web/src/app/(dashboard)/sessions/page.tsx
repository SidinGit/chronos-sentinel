'use client';

import { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Monitor } from 'lucide-react';

interface WebSession {
    _id?: string;
    device_id: string;
    app_name: string;
    window_title?: string;
    start_time: number;
    end_time: number;
    duration_ms: number;
    is_idle: boolean;
}

interface GroupedApp {
    appName: string;
    lastWindowTitle: string;
    totalDurationMs: number;
    sessionsCount: number;
    devices: Set<string>;
    isCurrentlyActive: boolean;
}

export default function SessionsPage() {
    const [groupedApps, setGroupedApps] = useState<GroupedApp[]>([]);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await fetch('/api/sessions');
                if (!res.ok) return;
                const data = await res.json();
                
                if (data.sessions) {
                    const groups: Record<string, GroupedApp> = {};

                    data.sessions.forEach((s: WebSession) => {
                        // THE TUPLE KEY: Grouping by both App and the Window Title (The Task)
                        const app = s.app_name;
                        const title = s.window_title || s.app_name;
                        const groupKey = `${app}-${title}`;
                        
                        if (!groups[groupKey]) {
                            groups[groupKey] = {
                                appName: app,
                                lastWindowTitle: title,
                                totalDurationMs: 0,
                                sessionsCount: 0,
                                devices: new Set(),
                                isCurrentlyActive: false,
                            };
                        }

                        // We only aggregate active working time, skip idle time for the summary
                        if (!s.is_idle) {
                            groups[groupKey].totalDurationMs += s.duration_ms;
                        }

                        groups[groupKey].sessionsCount += 1;
                        if (s.device_id) {
                            groups[groupKey].devices.add(s.device_id);
                        }
                    });

                    // Convert map to array and sort by Highest Duration
                    const sortedArray = Object.values(groups)
                        .filter(g => g.totalDurationMs > 0)
                        .sort((a, b) => b.totalDurationMs - a.totalDurationMs);

                    setGroupedApps(sortedArray);
                }
            } catch (err) {
                console.error("Failed to fetch sessions:", err);
            }
        };

        fetchSessions();
        const intervalId = setInterval(fetchSessions, 30000); 
        return () => clearInterval(intervalId);
    }, []);

    const formatDuration = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m`;
        return `< 1m`;
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Work History</h1>
                <p className="text-muted-foreground mt-1">
                    Aggregate duration tracking grouped by Application context.
                </p>
            </div>

            <div className="rounded-xl border bg-card/50 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 text-card-foreground shadow-sm overflow-hidden">
                <div className="w-full max-h-[600px] overflow-auto">
                <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                        <TableRow>
                            <TableHead className="h-12 px-6">Task</TableHead>
                            <TableHead className="h-12 px-6">Total Active Time</TableHead>
                            <TableHead className="h-12 px-6">Devices</TableHead>
                            <TableHead className="h-12 px-6">Blocks</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {groupedApps.length === 0 ? (
                             <TableRow>
                                 <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                     Awaiting Ingestion...
                                 </TableCell>
                             </TableRow>
                        ) : (
                            groupedApps.map((group) => (
                                <TableRow key={group.appName + group.lastWindowTitle} className="group">
                                    <TableCell className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-md border bg-primary/10 border-primary/20">
                                                <Monitor className="h-4 w-4 text-primary" />
                                            </div>
                                            <p className="text-sm font-semibold text-foreground truncate max-w-[600px]" title={group.lastWindowTitle}>
                                                {group.lastWindowTitle}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="p-6">
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                                            {formatDuration(group.totalDurationMs)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="p-6 text-xs font-mono text-muted-foreground">
                                        {Array.from(group.devices).map(d => d.split('-').pop()).join(', ')}
                                    </TableCell>
                                    <TableCell className="p-6 text-muted-foreground">
                                        <Badge variant="outline">{group.sessionsCount}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                </div>
            </div>
        </div>
    );
}
