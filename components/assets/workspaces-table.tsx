"use client";

import * as React from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmptyState } from "@/components/shared/empty-state";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { formatNumber } from "@/lib/utils";
import type { Workspace, WorkspaceSortState, WorkspaceSortField } from "@/lib/types/asset";
import {
  ArchiveIcon,
  FolderOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  SearchXIcon,
} from "lucide-react";

interface WorkspacesTableProps {
  workspaces: Workspace[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  sortState: WorkspaceSortState;
  onSort: (field: WorkspaceSortField) => void;
  onPageChange?: (page: number) => void;
  hasActiveFilters?: boolean;
}

function getRiskBadgeClass(score: number): string {
  if (score >= 8) return "bg-red-500/10 text-red-600 border-red-200 dark:border-red-800";
  if (score >= 6) return "bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-800";
  if (score >= 4) return "bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-800";
  return "bg-green-500/10 text-green-600 border-green-200 dark:border-green-800";
}

function VulnBadge({ count, severity }: { count: number; severity: "critical" | "high" | "medium" | "low" }) {
  if (count === 0) return null;

  const colors = {
    critical: "bg-red-500 text-white",
    high: "bg-orange-500 text-white",
    medium: "bg-yellow-500 text-yellow-900",
    low: "bg-blue-500 text-white",
  };

  const labels = { critical: "C", high: "H", medium: "M", low: "L" };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded text-xs font-medium ${colors[severity]}`}
        >
          {count}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        {count} {severity}
      </TooltipContent>
    </Tooltip>
  );
}

type TagBadgeVariant = "success" | "warning" | "info" | "purple" | "pink" | "cyan" | "orange" | "secondary";

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function getTagVariant(tag: string): TagBadgeVariant {
  const variants: TagBadgeVariant[] = [
    "success",
    "warning",
    "info",
    "purple",
    "pink",
    "cyan",
    "orange",
    "secondary",
  ];
  return variants[hashString(tag) % variants.length];
}

function TagsCell({ tags }: { tags: string[] }) {
  if (!tags?.length) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  const visible = tags.slice(0, 2);
  const remaining = tags.length - visible.length;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visible.map((t, i) => (
        <Badge key={`${t}-${i}`} variant={getTagVariant(t)} className="text-xs">
          {t}
        </Badge>
      ))}
      {remaining > 0 ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-xs cursor-default">
              +{remaining}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top">
            <div className="text-xs max-w-[260px] break-words">{tags.join(", ")}</div>
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}

function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]"><Skeleton className="h-4 w-12" /></TableHead>
          <TableHead className="w-[220px]"><Skeleton className="h-4 w-10" /></TableHead>
          <TableHead className="w-[80px]"><Skeleton className="h-4 w-10" /></TableHead>
          <TableHead className="w-[100px]"><Skeleton className="h-4 w-14" /></TableHead>
          <TableHead className="w-[80px]"><Skeleton className="h-4 w-10" /></TableHead>
          <TableHead className="w-[180px]"><Skeleton className="h-4 w-20" /></TableHead>
          <TableHead className="w-[100px]"><Skeleton className="h-4 w-10" /></TableHead>
          <TableHead className="w-[120px]"><Skeleton className="h-4 w-10" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-36" /></TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Skeleton className="h-5 w-14 rounded" />
                <Skeleton className="h-5 w-14 rounded" />
              </div>
            </TableCell>
            <TableCell><Skeleton className="h-4 w-10" /></TableCell>
            <TableCell><Skeleton className="h-4 w-14" /></TableCell>
            <TableCell><Skeleton className="h-4 w-10" /></TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Skeleton className="h-5 w-6 rounded" />
                <Skeleton className="h-5 w-6 rounded" />
                <Skeleton className="h-5 w-6 rounded" />
              </div>
            </TableCell>
            <TableCell><Skeleton className="h-6 w-12 rounded-md" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell>
              <div className="flex justify-center gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function WorkspacesTable({
  workspaces,
  isLoading,
  pagination,
  sortState,
  onSort,
  onPageChange,
  hasActiveFilters,
}: WorkspacesTableProps) {
  // Show skeleton when initially loading
  if (isLoading && workspaces.length === 0) {
    return (
      <div className="relative min-h-[400px]">
        <TableSkeleton rows={10} />
      </div>
    );
  }

  // Show empty state
  if (workspaces.length === 0) {
    return (
      <div className="relative min-h-[360px] flex items-center justify-center">
        <EmptyState
          icon={hasActiveFilters ? SearchXIcon : FolderOpenIcon}
          title={hasActiveFilters ? "No matching workspaces" : "No workspaces found"}
          description={
            hasActiveFilters
              ? "No workspaces match your current search. Try adjusting your search criteria."
              : "Workspaces are created when you run scans. Start a new scan to create a workspace."
          }
        />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4 relative">
        {/* Refreshing overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 z-20 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background px-3 py-2 rounded-md shadow-sm border">
              <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Refreshing...
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table className="table-fixed">
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <SortableTableHead
                  field="name"
                  currentSort={sortState}
                  onSort={(f) => onSort(f as WorkspaceSortField)}
                  className="w-[200px]"
                >
                  Name
                </SortableTableHead>
                <TableHead className="w-[220px]">Tags</TableHead>
                <SortableTableHead
                  field="total_assets"
                  currentSort={sortState}
                  onSort={(f) => onSort(f as WorkspaceSortField)}
                  className="w-[80px]"
                >
                  Assets
                </SortableTableHead>
                <SortableTableHead
                  field="total_subdomains"
                  currentSort={sortState}
                  onSort={(f) => onSort(f as WorkspaceSortField)}
                  className="w-[100px]"
                >
                  Subdomains
                </SortableTableHead>
                <SortableTableHead
                  field="total_urls"
                  currentSort={sortState}
                  onSort={(f) => onSort(f as WorkspaceSortField)}
                  className="w-[80px]"
                >
                  URLs
                </SortableTableHead>
                <SortableTableHead
                  field="total_vulns"
                  currentSort={sortState}
                  onSort={(f) => onSort(f as WorkspaceSortField)}
                  className="w-[180px]"
                >
                  Vulnerabilities
                </SortableTableHead>
                <SortableTableHead
                  field="risk_score"
                  currentSort={sortState}
                  onSort={(f) => onSort(f as WorkspaceSortField)}
                  className="w-[100px]"
                >
                  Risk
                </SortableTableHead>
                <SortableTableHead
                  field="actions"
                  currentSort={sortState}
                  onSort={(f) => onSort(f as WorkspaceSortField)}
                  className="w-[120px] text-center"
                >
                  Actions
                </SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspaces.map((ws) => {
                const hasVulns =
                  ws.vuln_critical > 0 ||
                  ws.vuln_high > 0 ||
                  ws.vuln_medium > 0 ||
                  ws.vuln_low > 0;

                return (
                  <TableRow
                    key={`${ws.id || ws.name}`}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>
                      <Link
                        href={`/inventory/workspaces/${ws.name}`}
                        className="font-medium hover:underline text-primary"
                      >
                        {ws.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <TagsCell tags={ws.tags} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatNumber(ws.total_assets)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatNumber(ws.total_subdomains)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatNumber(ws.total_urls)}
                    </TableCell>
                    <TableCell>
                      {hasVulns ? (
                        <div className="flex items-center gap-1">
                          <VulnBadge count={ws.vuln_critical} severity="critical" />
                          <VulnBadge count={ws.vuln_high} severity="high" />
                          <VulnBadge count={ws.vuln_medium} severity="medium" />
                          <VulnBadge count={ws.vuln_low} severity="low" />
                          <span className="text-xs text-muted-foreground ml-1">
                            ({ws.total_vulns})
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`font-mono text-xs ${getRiskBadgeClass(ws.risk_score)}`}
                      >
                        {ws.risk_score.toFixed(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-8 rounded-md"
                              asChild
                            >
                              <Link
                                href={{
                                  pathname: "/inventory/assets",
                                  query: { workspace: ws.name },
                                }}
                              >
                                <EyeIcon className="size-4" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">View assets</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-8 rounded-md"
                              asChild
                            >
                              <Link
                                href={{
                                  pathname: "/inventory/artifacts",
                                  query: { workspace: ws.name },
                                }}
                              >
                                <ArchiveIcon className="size-4" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">View artifacts</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-2 pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {(pagination.page - 1) * pagination.pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {Math.min(
                  pagination.page * pagination.pageSize,
                  pagination.totalItems
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {pagination.totalItems.toLocaleString()}
              </span>{" "}
              workspaces
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeftIcon className="size-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          pagination.page === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        className="w-9"
                        onClick={() => onPageChange?.(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
                <ChevronRightIcon className="size-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
