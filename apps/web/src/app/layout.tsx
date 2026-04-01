import { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    title: {
        template: '%s | Chronos Sentinel',
        default: 'Chronos Sentinel | Activity Guard',
    },
    description: 'Enterprise-grade work tracking and device security dashboard.',
    manifest: '/manifest.json',
    icons: {
        icon: '/icon.png',
        shortcut: '/icon.png',
        apple: '/icon.png',
    },
};

export const viewport: Viewport = {
    themeColor: '#000000',
    width: 'device-width',
    initialScale: 1,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="antialiased min-h-screen font-sans selection:bg-primary/20">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <Providers>{children}</Providers>
                </ThemeProvider>
            </body>
        </html>
    );
}
