'use client';
import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserNav } from "@/components/dashboard/user-nav"
import { usePathname } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from "next/link";
import React from "react";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function DashboardHeader() {
    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
        <div className="md:hidden">
            <SidebarTrigger />
        </div>
        
        <div className="flex-1">
          <Breadcrumb>
            <BreadcrumbList>
              {segments.map((segment, index) => {
                const href = `/${segments.slice(0, index + 1).join('/')}`;
                const isLast = index === segments.length - 1;
                return (
                  <React.Fragment key={href}>
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage className="font-medium text-foreground">{capitalize(segment)}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={href}>{capitalize(segment)}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                  </React.Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-4">
            <UserNav />
        </div>
    </header>
  )
}
