"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const menuItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/leads', label: 'Leads', icon: Users },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background shadow-top md:hidden"> {/* Hide on medium screens and up */}
            <div className="flex justify-around items-center h-20 px-2"> {/* Increased height */}
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Link href={item.href} key={item.href} passHref legacyBehavior>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "flex flex-col items-center justify-center h-full flex-1 rounded-none py-2", // Added padding
                                    "text-muted-foreground hover:text-primary hover:bg-transparent",
                                    isActive && "text-primary font-semibold" // Made font bold when active
                                )}
                            >
                                <item.icon className={cn("h-7 w-7 mb-1", isActive ? "text-primary" : "text-muted-foreground")} /> {/* Increased icon size */}
                                <span className="text-sm">{item.label}</span> {/* Increased label size */}
                            </Button>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
