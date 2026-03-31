import { Sidebar } from '@/components/sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-muted/20 pb-8 pt-6 px-8">
                {children}
            </main>
        </div>
    );
}
