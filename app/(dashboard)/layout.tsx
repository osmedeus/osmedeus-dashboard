"use client";

import * as React from "react";
import { useAuth } from "@/providers/auth-provider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const DISABLE_AUTH =
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_DISABLE_LOGIN === "true";

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("osmedeus_sidebar_collapsed_by_default");
    const collapsedByDefault = raw === "true";
    setSidebarOpen(!collapsedByDefault);
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: Event) => {
      const ev = e as CustomEvent<boolean>;
      if (ev.detail === true) setSidebarOpen(false);
    };
    window.addEventListener("osmedeus-sidebar-collapsed-by-default-changed", handler);
    return () => {
      window.removeEventListener("osmedeus-sidebar-collapsed-by-default-changed", handler);
    };
  }, []);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="size-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  // Auth provider handles redirect, but we don't render if not authenticated
  if (!isAuthenticated && !DISABLE_AUTH) {
    return null;
  }

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <AppSidebar />
      <SidebarInset>
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="w-full max-w-none p-4 lg:p-6">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
