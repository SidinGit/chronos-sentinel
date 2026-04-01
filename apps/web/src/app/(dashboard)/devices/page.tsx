import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeviceCard } from '@/components/device-card';

// Force dynamic rendering (no caching) for real-time status
export const dynamic = 'force-dynamic';

export default async function DevicesPage() {
    // Fetch real devices from the DB using the absolute API URL (since it's a Server Component)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let devices: any[] = [];
    
    try {
        const res = await fetch(`${baseUrl}/api/devices`, { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            devices = data.devices || [];
        }
    } catch (err) {
        console.error("Failed to fetch fleet devices on server:", err);
    }

    return (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-4">
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
                    {devices.map((device: any) => (
                        <DeviceCard key={device.id} device={device} />
                    ))}
                </div>
                
                {devices.length === 0 && (
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
