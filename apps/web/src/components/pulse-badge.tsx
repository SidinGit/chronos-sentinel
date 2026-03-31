'use client';
import { useEffect, useState } from 'react';

// This matches the JSON payload arriving from Redis!
interface Pulse {
    device_id: string;
    app_name: string;
    window_title: string;
    is_idle: boolean;
}

export function PulseBadge() {
    const [pulse, setPulse] = useState<Pulse | null>(null);

    useEffect(() => {
        const fetchPulse = async () => {
            try {
                const res = await fetch('/api/pulse');
                if (!res.ok) return;
                const data = await res.json();
                
                // Set the pulse if we received an active heartbeart
                if (data.pulses && data.pulses.length > 0) {
                    setPulse(data.pulses[0]);
                } else {
                    setPulse(null);
                }
            } catch (err) {
                console.error("Failed to fetch pulse:", err);
            }
        };

        // Fetch immediately on mount
        fetchPulse();

        // Then poll every 2 seconds
        const intervalId = setInterval(fetchPulse, 2000);

        // Cleanup the interval when the component unmounts! 
        return () => clearInterval(intervalId);
    }, []);

    // If we have an active pulse playing, show the green badge AND the structured title!
    if (pulse && !pulse.is_idle) {
        // Split the title if it follows a common breadcrumb pattern (e.g., "Project - Context - File")
        const titleParts = (pulse.window_title || "").split(/ - | \| | > /);

        return (
            <div className="relative flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-pulse-glow absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    </span>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground truncate max-w-[400px]">
                        {titleParts.map((part, i) => (
                            <span key={i} className="flex items-center gap-1.5">
                                <span className={i === titleParts.length - 1 ? "text-foreground" : "text-muted-foreground font-medium"}>
                                    {part.trim()}
                                </span>
                                {i < titleParts.length - 1 && (
                                    <span className="text-[10px] text-muted-foreground/40 font-black">/</span>
                                )}
                            </span>
                        ))}
                        {(!pulse.window_title || titleParts.length === 0) && (
                            <span className="text-muted-foreground italic text-xs">Tracking Activity...</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-tighter text-emerald-600">
                        Live Tracking
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1 py-0.5 bg-muted rounded leading-none">
                        {pulse.app_name}
                    </span>
                </div>
            </div>
        );
    }

    // Default "Offline" or "Idle" State
    return (
        <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-muted-foreground"></span>
            <span className="text-sm text-muted-foreground">Offline</span>
        </div>
    );
}
