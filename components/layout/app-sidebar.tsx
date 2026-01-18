"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BarChartBigIcon,
  ScanSearchIcon,
  WorkflowIcon,
  FolderOpenIcon,
  SettingsIcon,
  ClipboardCheckIcon,
  ScrollText as ScrollTextIcon,
  SquareFunction as SquareFunctionIcon,
  Package as PackageIcon,
  ArchiveIcon,
  HeartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldAlertIcon,
  DatabaseIcon,
  BrainIcon,
} from "lucide-react";
import { isDemoMode } from "@/lib/api/demo-mode";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import logo from "@/osmedeus-logo.png";

const navigationGroups = [
  {
    label: "Overview",
    items: [
      {
        name: "Statistics",
        href: "/",
        icon: BarChartBigIcon,
      },
    ],
  },
  {
    label: "Scans",
    items: [
      {
        name: "Scans",
        href: "/scans",
        icon: ScanSearchIcon,
      },
      {
        name: "Schedules",
        href: "/schedules",
        icon: ClipboardCheckIcon,
      },
    ],
  },
  {
    label: "Workflows",
    items: [
      {
        name: "Workflows",
        href: "/workflows",
        icon: WorkflowIcon,
      },
      {
        name: "Events",
        href: "/events",
        icon: ScrollTextIcon,
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      {
        name: "Workspaces",
        href: "/inventory/workspaces",
        icon: FolderOpenIcon,
      },
      {
        name: "Assets",
        href: "/inventory/assets",
        icon: DatabaseIcon,
      },
      {
        name: "Artifacts",
        href: "/inventory/artifacts",
        icon: ArchiveIcon,
      },
      {
        name: "Vulnerabilities",
        href: "/vulnerabilities",
        icon: ShieldAlertIcon,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        name: "Utilities Functions",
        href: "/utilities",
        icon: SquareFunctionIcon,
      },
      {
        name: "LLM Playground",
        href: "/llm",
        icon: BrainIcon,
      },
      {
        name: "Registry",
        href: "/registry",
        icon: PackageIcon,
      },
      {
        name: "Settings",
        href: "/settings",
        icon: SettingsIcon,
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { open, toggleSidebar } = useSidebar();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center">
                  <Image
                    src={logo}
                    alt="Osmedeus"
                    width={32}
                    height={32}
                    className="size-8 logo-shadow"
                    priority
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Osmedeus</span>
                    {isDemoMode() && (
                      <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                        Demo
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navigationGroups.map((group, groupIndex) => (
          <React.Fragment key={group.label}>
            <SidebarGroup>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild isActive={active} tooltip={item.name}>
                          <Link href={item.href}>
                            <item.icon className={active ? "text-sidebar-primary" : ""} />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {groupIndex < navigationGroups.length - 1 ? <SidebarSeparator /> : null}
          </React.Fragment>
        ))}
      </SidebarContent>

      <SidebarFooter className="items-center">
        <div className="flex items-center justify-center gap-1 px-2 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          <span>Crafted with</span>
          <HeartIcon className="size-3 text-red-500" aria-label="love" />
          <span>by</span>
          <Link
            href="http://twitter.com/j3ssie"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            <code className="text-xs font-mono text-sidebar-primary">@j3ssie</code>
          </Link>
        </div>
        <Button
          onClick={toggleSidebar}
          variant="outline"
          size="icon-sm"
          className="rounded-md"
          aria-label="Toggle Sidebar"
        >
          {open ? <ChevronLeftIcon className="size-3" /> : <ChevronRightIcon className="size-3" />}
        </Button>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
