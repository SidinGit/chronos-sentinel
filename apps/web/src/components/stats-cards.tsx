'use client';

import { Clock, MonitorSmartphone, Activity, Box } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsProps {
    totalHours: number;
    activeDevices: number;
    sessionsToday: number;
    mostUsedApp: string;
}

export function StatsCards({ totalHours, activeDevices, sessionsToday, mostUsedApp }: StatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
                    <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activeDevices}</div>
                    <p className="text-xs text-muted-foreground">Currently online</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Time Tracked</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
                    <p className="text-xs text-muted-foreground">Logged today</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Most Used App</CardTitle>
                    <Box className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{mostUsedApp || 'None'}</div>
                    <p className="text-xs text-muted-foreground">Top activity today</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sessions</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{sessionsToday}</div>
                    <p className="text-xs text-muted-foreground">Completed today</p>
                </CardContent>
            </Card>
        </div>
    );
}
