import { Sidebar } from '@/components/sidebar';
import { LayoutProvider } from '@/components/layout-provider';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <LayoutProvider>
            <div className="flex h-screen overflow-hidden bg-background">
                <Sidebar />
                <main className="flex-1 overflow-y-auto bg-muted/20 pb-8 pt-6 px-8">
                    {children}
                </main>
            </div>
        </LayoutProvider>
    );
}
