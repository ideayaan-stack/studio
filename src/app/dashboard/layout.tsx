import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Lightbulb, Settings } from 'lucide-react';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { DashboardHeader } from '@/components/dashboard/header';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import Link from 'next/link';
import Image from 'next/image';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className='p-4 h-16 flex justify-center'>
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            {/* Logo for Light Mode */}
            <div className="relative h-16 w-full max-w-[150px] dark:hidden group-data-[collapsible=icon]:hidden">
              <Image
                src="/logo-light.png"
                alt="Ideayaan Logo"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
            {/* Logo for Dark Mode */}
            <div className="relative h-16 w-full max-w-[150px] hidden dark:block group-data-[collapsible=icon]:hidden">
              <Image
                src="/logo-dark.png"
                alt="Ideayaan Logo"
                fill
                className="object-contain object-left"
                priority
              />
            </div>

            {/* Icon only for collapsed state - Using Lightbulb as fallback since no icon logo provided */}
            <Lightbulb className="size-6 text-primary hidden group-data-[collapsible=icon]:block" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/dashboard/settings">
                <SidebarMenuButton tooltip="Settings">
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="h-screen max-h-screen overflow-hidden flex flex-col">
        <DashboardHeader />
        <main className="flex-1 min-h-0 overflow-hidden flex flex-col">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
