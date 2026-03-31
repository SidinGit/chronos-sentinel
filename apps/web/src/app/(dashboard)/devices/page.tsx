import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeviceCard } from '@/components/device-card';

// Force dynamic rendering (no caching) for real-time status
export const dynamic = 'force-dynamic';

export default async function DevicesPage() {
    // In a production environment with full SSR, you can call your own API using the absolute URL
    // or call the internal functions directly. We'll simulate fetching devices for this UI build.
    const mockDevices = [
        { id: 'desktop-win11-alpha', name: 'Dev Workstation', isOnline: true, lastSeen: Date.now() },
        { id: 'macbook-pro-m2', name: 'Siddhartha Laptop', isOnline: false, lastSeen: Date.now() - 86400000 },
    ];

    return (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Fleet Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your connected devices and viewing real-time online status.
                    </p>
                </div>
                <Link href="/devices/pair">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Link New Device
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {mockDevices.map((device) => (
                    <DeviceCard key={device.id} device={device} />
                ))}
            </div>
            
            {mockDevices.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 mt-8 border rounded-xl border-dashed bg-card/50">
                    <p className="text-lg font-medium text-muted-foreground mb-4">No devices linked yet</p>
                    <Link href="/devices/pair">
                        <Button variant="outline">Link Your First Device</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
