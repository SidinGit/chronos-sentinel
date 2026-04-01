'use client';

import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Monitor, Moon, Sun, Shield, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch for next-themes
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto h-full pb-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your preferences and workspace layout.
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {theme === 'dark' ? <Moon className="h-5 w-5" /> : theme === 'light' ? <Sun className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                            Appearance
                        </CardTitle>
                        <CardDescription>
                            Customize the color theme of your dashboard.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Theme Preference</span>
                            <Select value={theme} onValueChange={setTheme}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Data Retention Policy
                        </CardTitle>
                        <CardDescription>
                            Configure how long telemetry history is stored in MongoDB before being pruned.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">Retain logs for</span>
                            <Select defaultValue="90">
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30">30 Days</SelectItem>
                                    <SelectItem value="90">90 Days</SelectItem>
                                    <SelectItem value="365">1 Year</SelectItem>
                                    <SelectItem value="forever">Indefinitely</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Alerts & Notifications
                        </CardTitle>
                        <CardDescription>
                            Manage which events trigger an email to your organization's administrators.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <label className="text-base font-medium text-foreground cursor-pointer" htmlFor="idle-alert">
                                    Extended Idle Warning
                                </label>
                                <p className="text-sm text-muted-foreground">
                                    Send an alert if an active device registers an idle state exceeding 60 minutes.
                                </p>
                            </div>
                            <Switch id="idle-alert" defaultChecked />
                        </div>
                        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <label className="text-base font-medium text-foreground cursor-pointer" htmlFor="offline-alert">
                                    Device Disconnect Alert
                                </label>
                                <p className="text-sm text-muted-foreground">
                                    Notify when a paired device drops from the live feed.
                                </p>
                            </div>
                            <Switch id="offline-alert" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
