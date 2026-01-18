"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScanStatusBadge } from "./scan-status-badge";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { cn, formatDateTime, truncate } from "@/lib/utils";
import type { Scan } from "@/lib/types/scan";
import type { SortDirection } from "@/lib/types/asset";
import {
  ClipboardIcon,
  EyeIcon,
  StopCircleIcon,
  TrashIcon,
  ScanSearchIcon,
  CalendarIcon,
  PlayIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cancelScan, deleteScan } from "@/lib/api/scans";

interface ScanTableProps {
  scans: Scan[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function ScanTable({ scans, isLoading, onRefresh }: ScanTableProps) {
  type ScanSortField =
    | "status"
    | "workflow"
    | "runId"
    | "target"
    | "progress"
    | "trigger"
    | "updated"
    | "actions";

  const [sortState, setSortState] = React.useState<{
    field: ScanSortField;
    direction: SortDirection;
  }>({ field: "updated", direction: "desc" });

  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [selectedScan, setSelectedScan] = React.useState<Scan | null>(null);

  const toggleSort = React.useCallback((field: ScanSortField) => {
    setSortState((prev) => {
      if (prev.field === field) {
        return { field, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { field, direction: "asc" };
    });
  }, []);

  const handleCancel = async (scan: Scan) => {
    try {
      const success = await cancelScan(scan.id);
      if (success) {
        toast.success("Scan cancelled", {
          description: `Scan for ${scan.target} has been cancelled.`,
        });
        onRefresh?.();
      } else {
        toast.error("Failed to cancel scan");
      }
    } catch {
      toast.error("Failed to cancel scan");
    }
  };

  const handleDelete = async (scan: Scan) => {
    try {
      const success = await deleteScan(scan.id);
      if (success) {
        toast.success("Scan deleted", {
          description: `Scan for ${scan.target} has been deleted.`,
        });
        onRefresh?.();
      } else {
        toast.error("Failed to delete scan");
      }
    } catch {
      toast.error("Failed to delete scan");
    }
  };

  const triggerConfig = React.useMemo(() => {
    const conf: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "purple" | "pink" | "cyan" | "orange";
        icon: React.ReactNode;
        className?: string;
      }
    > = {
      cli: { label: "CLI", variant: "purple", icon: <PlayIcon className="size-3" /> },
      api: { label: "API", variant: "info", icon: <PlayIcon className="size-3" /> },
      cron: { label: "Cron", variant: "warning", icon: <CalendarIcon className="size-3" /> },
      scheduled: { label: "Scheduled", variant: "warning", icon: <CalendarIcon className="size-3" /> },
      manual: { label: "Manual", variant: "secondary", icon: <PlayIcon className="size-3" /> },
    };
    return conf;
  }, []);

  const formatDuration = (scan: Scan): string => {
    if (!scan.startedAt) return "-";
    const end = scan.completedAt ?? new Date();
    const diffMs = end.getTime() - scan.startedAt.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ${diffSec % 60}s`;
    const diffHour = Math.floor(diffMin / 60);
    return `${diffHour}h ${diffMin % 60}m`;
  };

  const formatDetailValue = React.useCallback((key: string, value: unknown) => {
    if (value === null || value === undefined || value === "") return "-";

    if (key.endsWith("At")) {
      if (value instanceof Date) return value.toISOString();
      if (typeof value === "string") return value;
    }

    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (typeof value === "string") return value;

    if (typeof value === "object") {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return "[object]";
      }
    }

    return String(value);
  }, []);

  const detailItems = React.useMemo(() => {
    if (!selectedScan) return [] as Array<{ label: string; value: string; mono?: boolean }>;
    const items: Array<{ key: keyof Scan | string; label: string; mono?: boolean }> = [
      { key: "id", label: "ID", mono: true },
      { key: "runId", label: "Run ID", mono: true },
      { key: "workflowName", label: "Workflow Name" },
      { key: "workflowKind", label: "Workflow Kind" },
      { key: "target", label: "Target", mono: true },
      { key: "status", label: "Status" },
      { key: "triggerType", label: "Trigger Type" },
      { key: "triggerName", label: "Trigger Name" },
      { key: "workspacePath", label: "Workspace Path", mono: true },
      { key: "startedAt", label: "Started At", mono: true },
      { key: "completedAt", label: "Completed At", mono: true },
      { key: "totalSteps", label: "Total Steps" },
      { key: "completedSteps", label: "Completed Steps" },
      { key: "createdAt", label: "Created At", mono: true },
      { key: "updatedAt", label: "Updated At", mono: true },
      { key: "errorMessage", label: "Error" },
    ];

    return items
      .map((it) => {
        const value = formatDetailValue(String(it.key), (selectedScan as any)[it.key]);
        return { label: it.label, value, mono: it.mono };
      })
      .filter((it) => it.value !== "-");
  }, [formatDetailValue, selectedScan]);

  const paramsEntries = selectedScan?.params
    ? Object.entries(selectedScan.params).map(([k, v]) => [k, String(v)] as const)
    : [];

  const sortedScans = React.useMemo(() => {
    const getValue = (
      field: ScanSortField,
      scan: Scan
    ): { missing: boolean; value: string | number } => {
      switch (field) {
        case "status":
          return { missing: !scan.status, value: scan.status ?? "" };
        case "workflow":
          return {
            missing: !scan.workflowName,
            value: scan.workflowName ?? "",
          };
        case "target":
          return { missing: !scan.target, value: scan.target ?? "" };
        case "runId":
          return { missing: !scan.runId, value: scan.runId ?? "" };
        case "progress": {
          const total = scan.totalSteps ?? 0;
          const completed = scan.completedSteps ?? 0;
          const ratio = total > 0 ? completed / total : 0;
          return { missing: total <= 0, value: ratio };
        }
        case "trigger":
          return {
            missing: !scan.triggerType,
            value: scan.triggerType ?? "",
          };
        case "updated":
          return {
            missing: !scan.updatedAt,
            value: scan.updatedAt ? scan.updatedAt.getTime() : 0,
          };
        case "actions":
          return { missing: !scan.target, value: scan.target ?? "" };
      }
    };

    const out = [...scans];
    out.sort((a, b) => {
      const av = getValue(sortState.field, a);
      const bv = getValue(sortState.field, b);

      if (av.missing && bv.missing) return 0;
      if (av.missing) return 1;
      if (bv.missing) return -1;

      let cmp = 0;
      if (typeof av.value === "number" && typeof bv.value === "number") {
        cmp = av.value - bv.value;
      } else {
        cmp = String(av.value).localeCompare(String(bv.value), undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }
      return sortState.direction === "asc" ? cmp : -cmp;
    });
    return out;
  }, [scans, sortState.direction, sortState.field]);

  if (isLoading) {
    return <TableSkeleton rows={5} columns={8} />;
  }

  if (scans.length === 0) {
    return (
      <EmptyState
        icon={ScanSearchIcon}
        title="No scans found"
        description="Start your first security scan to see results here."
        action={{
          label: "New Scan",
          onClick: () => (window.location.href = "/scans/new"),
        }}
      />
    );
  }

  return (
    <>
      <Dialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setSelectedScan(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3">
              <span>Scan Details</span>
              <Button
                className="rounded-md"
                variant="outline"
                size="icon"
                disabled={!selectedScan?.id}
                onClick={async () => {
                  if (!selectedScan?.id) return;
                  try {
                    await navigator.clipboard.writeText(selectedScan.id);
                    toast.success("Copied to clipboard");
                  } catch {
                    toast.error("Failed to copy");
                  }
                }}
              >
                <ClipboardIcon className="size-4" />
                <span className="sr-only">Copy ID</span>
              </Button>
            </DialogTitle>
            <DialogDescription>
              {selectedScan?.id ? `ID: ${selectedScan.id}` : "Scan JSON details"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] rounded-md border bg-muted/20">
            <div className="p-4 space-y-5 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {detailItems.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                    <div className={item.mono ? "font-mono break-all" : "break-all"}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {paramsEntries.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Params</div>
                  <div className="rounded-md border bg-background/60">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3">
                      {paramsEntries.map(([k, v]) => (
                        <div key={k} className="space-y-1">
                          <div className="text-xs text-muted-foreground font-mono">{k}</div>
                          <div className="font-mono break-all">{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
          <SortableTableHead
            field="status"
            currentSort={sortState}
            onSort={(f) => toggleSort(f as ScanSortField)}
          >
            Status
          </SortableTableHead>
          <SortableTableHead
            field="workflow"
            currentSort={sortState}
            onSort={(f) => toggleSort(f as ScanSortField)}
          >
            Workflow
          </SortableTableHead>
          <SortableTableHead
            field="runId"
            currentSort={sortState}
            onSort={(f) => toggleSort(f as ScanSortField)}
          >
            Run ID
          </SortableTableHead>
          <SortableTableHead
            field="target"
            currentSort={sortState}
            onSort={(f) => toggleSort(f as ScanSortField)}
          >
            Target
          </SortableTableHead>
          <SortableTableHead
            field="progress"
            currentSort={sortState}
            onSort={(f) => toggleSort(f as ScanSortField)}
          >
            Steps
          </SortableTableHead>
          <SortableTableHead
            field="trigger"
            currentSort={sortState}
            onSort={(f) => toggleSort(f as ScanSortField)}
          >
            Trigger
          </SortableTableHead>
          <SortableTableHead
            field="updated"
            currentSort={sortState}
            onSort={(f) => toggleSort(f as ScanSortField)}
          >
            Updated
          </SortableTableHead>
          <SortableTableHead
            field="actions"
            currentSort={sortState}
            onSort={(f) => toggleSort(f as ScanSortField)}
            className="w-[96px]"
          >
            Actions
          </SortableTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedScans.map((scan) => (
            <TableRow key={scan.id}>
            <TableCell>
              <ScanStatusBadge status={scan.status} />
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{scan.workflowName}</span>
                <span className="text-xs text-muted-foreground">
                  {scan.workflowKind}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <span className="font-mono text-xs text-muted-foreground">
                {scan.runId ? truncate(scan.runId, 18) : "-"}
              </span>
            </TableCell>
            <TableCell>
              <span className="font-mono text-sm">{truncate(scan.target, 30)}</span>
            </TableCell>
            <TableCell>
              {scan.totalSteps > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {scan.completedSteps}/{scan.totalSteps} steps
                  </span>
                  <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${Math.round((scan.completedSteps / scan.totalSteps) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ) : scan.status === "running" ? (
                <span className="text-sm text-muted-foreground">In progress...</span>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                {(() => {
                  const type = (scan.triggerType || "manual").toLowerCase();
                  const cfg = triggerConfig[type] ?? {
                    label: scan.triggerType || "manual",
                    variant: "outline" as const,
                    icon: <PlayIcon className="size-3" />,
                  };
                  return (
                    <Badge variant={cfg.variant} className={cn("gap-1 w-fit", cfg.className)}>
                      {cfg.icon}
                      <span>{cfg.label}</span>
                    </Badge>
                  );
                })()}
                {scan.triggerName ? (
                  <span className="text-xs text-muted-foreground">{truncate(scan.triggerName, 22)}</span>
                ) : null}
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              <div className="flex flex-col">
                <span>{scan.updatedAt ? formatDateTime(scan.updatedAt) : "-"}</span>
                <span className="text-xs text-muted-foreground">{formatDuration(scan)}</span>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="rounded-md border-sky-300 text-sky-700 hover:bg-sky-500/10 hover:shadow-none dark:border-sky-700 dark:text-sky-300 dark:hover:bg-sky-400/10"
                  onClick={() => {
                    setSelectedScan(scan);
                    setDetailsOpen(true);
                  }}
                  aria-label="View scan details"
                >
                  <EyeIcon className="size-4" />
                </Button>

                {scan.status === "running" || scan.status === "pending" ? (
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="rounded-md border-yellow-300 text-yellow-700 hover:bg-yellow-500/10 hover:shadow-none dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-400/10"
                    onClick={() => handleCancel(scan)}
                    aria-label="Stop scan"
                  >
                    <StopCircleIcon className="size-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="rounded-md border-red-300 text-red-700 hover:bg-red-500/10 hover:shadow-none dark:border-red-800 dark:text-red-300 dark:hover:bg-red-400/10"
                    onClick={() => handleDelete(scan)}
                    aria-label="Delete scan"
                  >
                    <TrashIcon className="size-4" />
                  </Button>
                )}
              </div>
            </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
