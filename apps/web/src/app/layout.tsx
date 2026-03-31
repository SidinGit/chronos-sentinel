import { Providers } from './providers';
import './globals.css';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        // Forcing dark mode on root element for SaaS aesthetic
        <html lang="en" className="dark">
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
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
