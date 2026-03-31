'use client';

import { Card } from '@/components/ui/card';

// Quick hash to assign consistent colors to apps
const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
};

interface Session {
    id: string;
    app: string;
    title: string;
    start: number; // ms offset from 00:00 (for positioning)
    duration: number; // length in ms
    isIdle: boolean;
}

export function Timeline({ sessions }: { sessions: Session[] }) {
    // Arbitrary timeline logic for 24 hours: 86400000 ms total
    const DAY_MS = 86400000;

    return (
        <Card className="p-4">
            <h3 className="font-semibold mb-4 text-lg">Today's Timeline</h3>
            
            <div className="relative h-24 w-full rounded-md border bg-muted/30 p-2 overflow-hidden shadow-inner">
                {/* Scale Markers */}
                <div className="absolute top-0 bottom-0 left-0 w-full flex justify-between px-2 text-xs text-muted-foreground z-0 pointer-events-none opacity-50">
                    {[0, 6, 12, 18, 24].map((hour) => (
                        <div key={hour} className="h-full border-l flex flex-col items-start pl-1">
                            <span>{hour}:00</span>
                        </div>
                    ))}
                </div>

                {/* Session Blocks */}
                {sessions.map((s) => {
                    const leftPct = (s.start / DAY_MS) * 100;
                    const widthPct = (s.duration / DAY_MS) * 100;
                    
                    return (
                        <div
                            key={s.id}
                            className="absolute top-8 h-10 rounded-sm opacity-90 hover:opacity-100 hover:ring-2 ring-white/50 cursor-pointer transition-all z-10"
                            style={{
                                left: `${Math.max(0, leftPct)}%`,
                                width: `${Math.max(0.5, widthPct)}%`, // At least 0.5% visible
                                backgroundColor: s.isIdle ? 'hsl(var(--muted-foreground))' : stringToColor(s.app),
                            }}
                            title={`${s.app} - ${s.title}`}
                        />
                    );
                })}
            </div>
            
            {sessions.length === 0 && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                    No sessions recorded yet today.
                </p>
            )}
        </Card>
    );
}
