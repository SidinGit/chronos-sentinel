'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function PairDevicePage() {
    const [code, setCode] = useState("");
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [deviceName, setDeviceName] = useState("");

    const handlePairing = async () => {
        setStatus('loading');
        try {
            const res = await fetch('/api/auth/pair', {
                method: 'POST',
                body: JSON.stringify({ code }),
            });
            const data = await res.json();
            
            if (data.success) {
                setDeviceName(data.deviceName);
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch (e) {
            setStatus('error');
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Link New Device</CardTitle>
                    <p className="text-muted-foreground">Enter the 6-digit code shown on the Chronos Sentinel desktop agent.</p>
                </CardHeader>
                <CardContent className="space-y-6 flex flex-col items-center">
                    
                    {/* The OTP Input (Shadcn UI) */}
                    <InputOTP maxLength={6} value={code} onChange={setCode} disabled={status === 'loading' || status === 'success'}>
                        <InputOTPGroup>
                            <InputOTPSlot index={0} /> <InputOTPSlot index={1} /> <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} /> <InputOTPSlot index={4} /> <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>

                    {/* Status Feedback */}
                    {status === 'success' && (
                        <div className="flex items-center gap-2 p-3 bg-green-100 text-green-700 rounded-lg">
                            <CheckCircle2 size={20} /> Linked with {deviceName}
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="flex items-center gap-2 p-3 bg-red-100 text-red-700 rounded-lg">
                            <AlertCircle size={20} /> That code didn't work. Please try again.
                        </div>
                    )}

                    <Button onClick={handlePairing} className="w-full" size="lg" disabled={code.length < 6 || status === 'loading' || status === 'success'}>
                        {status === 'loading' ? 'Linking...' : 'Confirm and Link'}
                    </Button>
                </CardContent>
            </Card>
        </main>
    );
}