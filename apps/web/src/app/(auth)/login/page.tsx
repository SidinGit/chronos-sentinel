'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError('Invalid credentials');
            } else {
                router.push('/');
                router.refresh();
            }
        } catch (err) {
            setError('An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="space-y-1 flex flex-col items-center">
                    <div className="bg-primary/10 p-3 rounded-full mb-2">
                        <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Command Center</CardTitle>
                    <CardDescription>Enter your admin credentials</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2 relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {error && <p className="text-sm text-destructive text-center font-medium">{error}</p>}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Authenticating...' : 'Sign in'}
                        </Button>
                    </form>
                </CardContent>
                <div className="flex justify-center border-t py-4 px-6">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link href="/signup" className="text-primary hover:underline font-medium">
                            Sign up
                        </Link>
                    </p>
                </div>
            </Card>
        </main>
    );
}
