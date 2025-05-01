"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Settings } from 'lucide-react'; // Using Users icon for Leads
import {
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Simple SVG logo
const LeadsNavigatorLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
    <path d="M16 2L2 8.5V23.5L16 30L30 23.5V8.5L16 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 8.5L16 15L30 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 30V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 12L16 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 12L16 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M30 23.5L16 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
     <path d="M2 23.5L16 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


export default function AppSidebar() {
    const pathname = usePathname();

    const menuItems = [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/leads', label: 'Leads', icon: Users },
        // Add more navigation items here if needed in the future
    ];

    return (
        <>
            <SidebarHeader className="flex items-center gap-2">
                 <LeadsNavigatorLogo />
                 <span className="text-lg font-semibold">Leads Navigator</span>
            </SidebarHeader>
             <Separator className="my-2" />
            <SidebarContent>
                <SidebarMenu>
                    {menuItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <Link href={item.href} passHref legacyBehavior>
                                <SidebarMenuButton
                                    isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                                    tooltip={item.label}
                                    className="justify-start"
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
             <Separator className="my-2" />
            <SidebarFooter>
                 <SidebarMenu>
                     <SidebarMenuItem>
                         <Link href="/settings" passHref legacyBehavior>
                             <SidebarMenuButton
                                isActive={pathname === '/settings'}
                                tooltip="Settings"
                                className="justify-start"
                             >
                                <Settings className="h-5 w-5" />
                                <span>Settings</span>
                              </SidebarMenuButton>
                         </Link>
                     </SidebarMenuItem>
                 </SidebarMenu>
            </SidebarFooter>
        </>
    );
}
