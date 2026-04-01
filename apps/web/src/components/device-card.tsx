'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MonitorSmartphone, Settings2, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface DeviceCardProps {
    device: {
        id: string;
        name: string;
        isOnline: boolean;
        isRevoked: boolean;
        lastSeen: number | null;
    };
}

export function DeviceCard({ device }: DeviceCardProps) {
    const [isRevoking, setIsRevoking] = useState(false);
    const router = useRouter();

    const isOnline = device.isOnline;
    const isRevoked = device.isRevoked;
    
    // Quick time formatter
    const formatLastSeen = (ms: number | null) => {
        if (!ms) return 'Never';
        const date = new Date(ms);
        return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleRevoke = async () => {
        setIsRevoking(true);
        try {
            const res = await fetch(`/api/devices/${device.id}`, { method: 'DELETE' });
            if (res.ok) {
                router.refresh(); // Refresh page to see updated Revoked state
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsRevoking(false);
        }
    };

    return (
        <Card className="overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="bg-muted/40 pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-md bg-background p-2 shadow-sm border">
                            <MonitorSmartphone className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-base">{device.name}</CardTitle>
                            <CardDescription className="font-mono text-xs mt-0.5">
                                HWID: {device.id.substring(0, 12)}...
                            </CardDescription>
                        </div>
                    </div>
                    
                    {isRevoked ? (
                        <Badge variant="destructive" className="rounded-full">Revoked</Badge>
                    ) : (
                        <Badge variant={isOnline ? 'success' : 'secondary'} className="rounded-full">
                            {isOnline ? 'Online' : 'Offline'}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-4 pt-4 flex flex-col gap-4">
                <div className="text-sm">
                    <span className="text-muted-foreground block mb-1">Last Seen</span>
                    <span className="font-medium">{formatLastSeen(device.lastSeen)}</span>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                        <Settings2 className="w-3 h-3 mr-2" />
                        Config
                    </Button>
                    {!isRevoked && (
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            className="w-full text-xs bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            disabled={isRevoking}
                            onClick={handleRevoke}
                        >
                            {isRevoking ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Trash2 className="w-3 h-3 mr-2" />}
                            Revoke
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
