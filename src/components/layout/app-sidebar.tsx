'use client';

import React from 'react';
import { LayoutDashboard, Database, Settings, ShieldAlert, Cpu, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export function AppSidebar({ collapsed, setCollapsed, activeTab, setActiveTab }: AppSidebarProps) {
    const navItems = [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'knowledge', label: 'Knowledge Base', icon: Database },
    ];

    return (
        <aside
            className={cn(
                "relative z-20 flex flex-col border-r bg-card text-card-foreground transition-all duration-300 ease-in-out shrink-0",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Sidebar Header */}
            <div className="flex h-16 items-center justify-between px-4 border-b">
                <div className={cn("flex items-center gap-2 overflow-hidden", collapsed && "justify-center w-full")}>
                    <Cpu className="h-6 w-6 text-primary shrink-0" />
                    {!collapsed && (
                        <span className="font-semibold text-lg tracking-tight whitespace-nowrap">
                            OBD-Cortex
                        </span>
                    )}
                </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 space-y-1 p-3">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                                "flex items-center w-full rounded-md text-sm font-medium transition-colors p-2.5 gap-3",
                                isActive 
                                    ? "bg-secondary text-secondary-foreground" 
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                collapsed && "justify-center p-2"
                            )}
                            title={collapsed ? item.label : undefined}
                        >
                            <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-foreground" : "text-muted-foreground")} />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t flex flex-col gap-2">
                {!collapsed && (
                    <div className="flex flex-col gap-1 rounded-lg bg-muted/40 p-3 text-xs border border-dashed">
                        <div className="font-semibold text-muted-foreground uppercase tracking-wider">Environment</div>
                        <div className="font-medium text-foreground truncate">Manufacturer Node</div>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex h-8 w-full items-center justify-center rounded-md border border-dashed border-muted-foreground/35 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>
            </div>
        </aside>
    );
}
