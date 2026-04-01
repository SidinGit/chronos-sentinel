'use client';

import { useEffect, useState } from 'react';
import { PulseBadge } from '@/components/pulse-badge';
import { StatsCards } from '@/components/stats-cards';
import { Timeline } from '@/components/timeline';
import { SessionList } from '@/components/session-list';

export default function DashboardPage() {
    const [sessions, setSessions] = useState<any[]>([]); // For Timeline
    const [feed, setFeed] = useState<any[]>([]);         // For Recent Sessions (Table)
    
    // Derived dashboard metrics
    const [metrics, setMetrics] = useState({
        totalHours: 0,
        activeDevices: 0,
        sessionsToday: 0,
        mostUsedApp: 'None',
    });

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/sessions');
                if (!res.ok) return;
                const data = await res.json();
                
                if (data.sessions) {
                    const mapped = data.sessions.map((s: any) => ({
                        id: s._id || Math.random().toString(),
                        app: s.app_name,
                        title: s.window_title || s.app_name,
                        start: s.start_time || s.created_at || s.last_seen || 0,
                        duration: s.duration_ms,
                        isIdle: s.is_idle || false,
                        device_id: s.device_id
                    }));
                    
                    setSessions(mapped);
                    
                    // --- Metric Calculation ---
                    const totalMs = mapped.reduce((acc: number, s: any) => acc + s.duration, 0);
                    const totalHrs = (totalMs / (1000 * 60 * 60)).toFixed(1);
                    const uniqueDevices = new Set(mapped.map((s: any) => s.device_id)).size;
                    
                    const appTimes: Record<string, number> = {};
                    mapped.forEach((s: any) => {
                        appTimes[s.app] = (appTimes[s.app] || 0) + s.duration;
                    });
                    
                    let maxApp = 'None';
                    let maxTime = 0;
                    for (const [app, time] of Object.entries(appTimes)) {
                        if (time > maxTime) {
                            maxTime = time;
                            maxApp = app;
                        }
                    }
                    
                    setMetrics({
                        totalHours: parseFloat(totalHrs),
                        activeDevices: uniqueDevices,
                        sessionsToday: mapped.length,
                        mostUsedApp: maxApp,
                    });
                }
            } catch (err) {
                console.error("Failed to fetch history:", err);
            }
        };

        const fetchFeed = async () => {
             try {
                 const res = await fetch('/api/feed');
                 if (!res.ok) return;
                 const data = await res.json();

                 if (data.feed) {
                     // The feed contains raw heartbeats every 5s. 
                     // We squash consecutive matching tuples for the UI.
                     const mappedFeed = data.feed.map((f: any) => ({
                        id: Math.random().toString(),
                        app: f.app_name,
                        title: f.window_title || f.app_name,
                        start: f.timestamp,
                        duration: 5000, // 5s heartbeat
                        isIdle: f.is_idle || false,
                        device_id: f.device_id
                     }));

                     const squashed: any[] = [];
                     // Reverse because Redis LRANGE returns oldest last, we want chronological to merge
                     const chronological = mappedFeed.reverse();

                     for (const s of chronological) {
                         const last = squashed[squashed.length - 1];
                         if (last && last.app === s.app && last.title === s.title && last.isIdle === s.isIdle) {
                             last.duration += s.duration;
                             // keep the oldest start time for the block
                         } else {
                             squashed.push({ ...s });
                         }
                     }
                     // Reverse back for display (newest top)
                     setFeed(squashed.reverse());
                 }
             } catch (err) {
                 console.error("Failed to fetch feed:", err);
             }
        };

        fetchHistory();
        fetchFeed();
        
        // Fast polling for the raw feed UI (ephemeral)
        const feedInterval = setInterval(fetchFeed, 5000); 
        // Slower polling for aggregated history (MongoDB)
        const historyInterval = setInterval(fetchHistory, 30000); 

        return () => {
            clearInterval(feedInterval);
            clearInterval(historyInterval);
        };
    }, []);

    return (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor your active session and daily progress.
                    </p>
                </div>
                <div className="bg-card border px-4 py-2 rounded-lg shadow-sm">
                    <PulseBadge />
                </div>
            </div>

            <StatsCards 
                totalHours={metrics.totalHours} 
                activeDevices={metrics.activeDevices} 
                sessionsToday={metrics.sessionsToday} 
                mostUsedApp={metrics.mostUsedApp} 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
                <div className="lg:col-span-7">
                    <Timeline sessions={sessions} />
                </div>
            </div>

            {/* The brand new sleek Session Data Table, backed by ephemeral Redis feed */}
            <div className="w-full mt-4">
                <SessionList sessions={feed} />
            </div>
        </div>
    );
}
