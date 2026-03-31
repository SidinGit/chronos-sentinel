import { Monitor, Activity } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Session {
    id: string;
    device_id: string;
    app: string;
    title: string;
    start: number;
    duration: number;
    isIdle: boolean;
}

interface SessionListProps {
    sessions: Session[];
}

export function SessionList({ sessions }: SessionListProps) {
    const formatDuration = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m`;
        return `< 1m`;
    };

    const formatTime = (timestamp: number) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(new Date(timestamp));
    };

    return (
        <div className="rounded-xl border bg-card/50 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 text-card-foreground shadow-sm overflow-hidden">
            <div className="flex flex-col space-y-1.5 p-6 border-b pb-4">
                <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-500" />
                    <h3 className="text-xl font-semibold leading-none tracking-tight">Recent Sessions</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                    Your most recent tasks and activity context.
                </p>
            </div>
            
            <div className="w-full">
                {sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
                        <Monitor className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                        <p className="text-lg font-medium text-foreground">Awaiting Ingestion...</p>
                    </div>
                ) : (
                    <div className="relative w-full overflow-auto max-h-[400px]">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="sticky top-0 z-10 bg-muted/50 backdrop-blur-md">
                                <tr className="border-b transition-colors hover:bg-muted/50">
                                    <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground">Task</th>
                                    <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground">Start Time</th>
                                    <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground">Duration</th>
                                    <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground">Device</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {sessions.map((session) => (
                                    <tr 
                                        key={session.id} 
                                        className="border-b transition-colors hover:bg-muted/50 group"
                                    >
                                        <td className="p-6 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-md shadow-sm border transition-colors",
                                                    session.isIdle ? "bg-amber-500/10 border-amber-500/20" : "bg-primary/10 border-primary/20",
                                                )}>
                                                    <Monitor className={cn(
                                                        "h-4 w-4", 
                                                        session.isIdle ? "text-amber-500" : "text-primary"
                                                    )} />
                                                </div>
                                                <div className="max-w-[500px]">
                                                    <p className="font-semibold text-foreground truncate" title={session.title}>
                                                        {session.title}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 align-middle text-muted-foreground">
                                            <span>{formatTime(session.start)}</span>
                                        </td>
                                        <td className="p-6 align-middle">
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                                                {formatDuration(session.duration)}
                                            </span>
                                        </td>
                                        <td className="p-6 align-middle text-muted-foreground">
                                            <span className="font-mono text-xs">{session.device_id.split('-').pop()}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
