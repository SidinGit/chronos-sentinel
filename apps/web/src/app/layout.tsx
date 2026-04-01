import { Providers } from './providers';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        // suppressHydrationWarning is required by next-themes
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Chronos Sentinel</title>
                <meta
                    name="description"
                    content="Chronos Sentinel dashboard for work tracking and device management."
                />
            </head>
            <body className="antialiased min-h-screen">
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
