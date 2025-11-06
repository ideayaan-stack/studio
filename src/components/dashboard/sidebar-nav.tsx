'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/lib/types';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Folder,
  MessageSquare,
} from 'lucide-react';

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tooltip: "Dashboard" },
  { href: '/dashboard/teams', label: 'Teams', icon: Users, tooltip: "Teams" },
  { href: '/dashboard/tasks', label: 'To-Do', icon: CheckSquare, tooltip: "To-Do" },
  { href: '/dashboard/files', label: 'Files', icon: Folder, tooltip: "Files" },
  { href: '/dashboard/chat', label: 'Chat', icon: MessageSquare, tooltip: "Chat" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} legacyBehavior passHref>
            <SidebarMenuButton
              isActive={pathname === item.href}
              tooltip={item.tooltip}
            >
              <item.icon />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
