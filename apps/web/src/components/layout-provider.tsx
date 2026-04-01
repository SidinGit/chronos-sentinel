'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface LayoutContextType {
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;
    setSidebarCollapsed: (value: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Persist sidebar state in localStorage
    useEffect(() => {
        const stored = localStorage.getItem('sentinel_sidebar_collapsed');
        if (stored === 'true') {
            setIsSidebarCollapsed(true);
        }
    }, []);

    const setSidebarCollapsed = (value: boolean) => {
        setIsSidebarCollapsed(value);
        localStorage.setItem('sentinel_sidebar_collapsed', String(value));
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(!isSidebarCollapsed);
    };

    return (
        <LayoutContext.Provider value={{ isSidebarCollapsed, toggleSidebar, setSidebarCollapsed }}>
            {children}
        </LayoutContext.Provider>
    );
}

export function useLayout() {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
}
