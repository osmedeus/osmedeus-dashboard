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
import { ScanStatusBadge } from "./scan-status-badge";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatDateTime, truncate } from "@/lib/utils";
import type { Scan } from "@/lib/types/scan";
import type { SortDirection } from "@/lib/types/asset";
import {
  EyeIcon,
  StopCircleIcon,
  TrashIcon,
  ScanSearchIcon,
  CalendarIcon,
  PlayIcon,
  CopyIcon,
  LoaderIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cancelScan, deleteScan, duplicateScanRun, startScanRun } from "@/lib/api/scans";

interface ScanTableProps {
  scans: Scan[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onSelectScan?: (scan: Scan) => void;
}

export function ScanTable({ scans, isLoading, onRefresh, onSelectScan }: ScanTableProps) {
  type ScanSortField =
    | "status"
    | "workflow"
    | "target"
    | "progress"
    | "trigger"
    | "updated"
    | "actions";

  const [sortState, setSortState] = React.useState<{
    field: ScanSortField;
    direction: SortDirection;
  }>({ field: "updated", direction: "desc" });
  const [duplicateRunId, setDuplicateRunId] = React.useState<string | null>(null);
  const [confirmState, setConfirmState] = React.useState<{
    action: "duplicate" | "cancel" | "delete";
    scan: Scan;
  } | null>(null);


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
      const runUuid = scan.runUuid || scan.runId || scan.id;
      const success = await cancelScan(runUuid);
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
      const runUuid = scan.runUuid || scan.runId || scan.id;
      const success = await deleteScan(runUuid);
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

  const handleConfirmAction = async () => {
    if (!confirmState) return;
    const { action, scan } = confirmState;
    setConfirmState(null);
    if (action === "duplicate") {
      await handleDuplicateAndStart(scan);
      return;
    }
    if (action === "cancel") {
      await handleCancel(scan);
      return;
    }
    await handleDelete(scan);
  };

  const handleDuplicateAndStart = async (scan: Scan) => {
    const runUuid = scan.runUuid || scan.runId || scan.id;
    if (!runUuid) {
      toast.error("Missing run identifier");
      return;
    }
    try {
      setDuplicateRunId(runUuid);
      const duplicated = await duplicateScanRun(runUuid);
      const newRunUuid = duplicated.runUuid || duplicated.runId || duplicated.id;
      if (!newRunUuid) {
        toast.error("Duplicate created without run identifier");
        return;
      }
      const started = await startScanRun(newRunUuid);
      if (started) {
        toast.success("Scan duplicated and started", {
          description: `Scan for ${duplicated.target || scan.target} is running.`,
        });
      } else {
        toast.success("Scan duplicated", {
          description: `Duplicate created for ${duplicated.target || scan.target}.`,
        });
      }
      onRefresh?.();
    } catch {
      toast.error("Failed to duplicate scan");
    } finally {
      setDuplicateRunId(null);
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
    return <TableSkeleton rows={5} columns={7} />;
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
      <TooltipProvider>
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
              className="w-[132px]"
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        className="rounded-md border-sky-300 text-sky-700 hover:bg-sky-500/10 hover:shadow-none dark:border-sky-700 dark:text-sky-300 dark:hover:bg-sky-400/10"
                        onClick={() => {
                          onSelectScan?.(scan);
                        }}
                        aria-label="View scan details"
                      >
                        <EyeIcon className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">View details</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        className="rounded-md border-violet-300 text-violet-700 hover:bg-violet-500/10 hover:shadow-none dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-400/10"
                        onClick={() => setConfirmState({ action: "duplicate", scan })}
                        aria-label="Duplicate and start scan"
                        disabled={duplicateRunId === (scan.runUuid || scan.runId || scan.id)}
                      >
                        {duplicateRunId === (scan.runUuid || scan.runId || scan.id) ? (
                          <LoaderIcon className="size-4 animate-spin" />
                        ) : (
                          <CopyIcon className="size-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Duplicate &amp; start</TooltipContent>
                  </Tooltip>

                  {scan.status === "running" || scan.status === "pending" ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="rounded-md border-yellow-300 text-yellow-700 hover:bg-yellow-500/10 hover:shadow-none dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-400/10"
                          onClick={() => setConfirmState({ action: "cancel", scan })}
                          aria-label="Stop scan"
                        >
                          <StopCircleIcon className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Stop scan</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="rounded-md border-red-300 text-red-700 hover:bg-red-500/10 hover:shadow-none dark:border-red-800 dark:text-red-300 dark:hover:bg-red-400/10"
                          onClick={() => setConfirmState({ action: "delete", scan })}
                          aria-label="Delete scan"
                        >
                          <TrashIcon className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Delete scan</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TooltipProvider>
      <Dialog open={!!confirmState} onOpenChange={(open) => (!open ? setConfirmState(null) : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmState?.action === "duplicate"
                ? "Duplicate and start scan"
                : confirmState?.action === "cancel"
                  ? "Stop running scan"
                  : "Delete scan"}
            </DialogTitle>
            <DialogDescription>
              {confirmState?.action === "duplicate"
                ? "Create a new run and start it immediately?"
                : confirmState?.action === "cancel"
                  ? "Stop the selected scan? This cannot be undone."
                  : "Delete the selected scan? This cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmState(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmState?.action === "delete" ? "destructive" : "default"}
              onClick={handleConfirmAction}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
