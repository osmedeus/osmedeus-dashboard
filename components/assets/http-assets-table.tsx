"use client";

import * as React from "react";
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
import { truncate, getTechBadgeVariant } from "@/lib/utils";
import type { HttpAsset, AssetSortState, AssetSortField } from "@/lib/types/asset";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  LinkIcon,
  ExternalLinkIcon,
  CopyIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  SearchXIcon,
} from "lucide-react";

interface HttpAssetsTableProps {
  assets: HttpAsset[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  sortState: AssetSortState;
  onSort: (field: AssetSortField) => void;
  onPageChange?: (page: number) => void;
  onSelect?: (asset: HttpAsset) => void;
  hasActiveFilters?: boolean;
}

function getStatusBadgeVariant(
  statusCode: number
): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" {
  if (statusCode >= 200 && statusCode < 300) return "success";
  if (statusCode >= 300 && statusCode < 400) return "warning";
  if (statusCode >= 400 && statusCode < 500) return "outline";
  if (statusCode >= 500) return "destructive";
  return "secondary";
}

function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[280px]"><Skeleton className="h-4 w-12" /></TableHead>
          <TableHead className="w-[80px]"><Skeleton className="h-4 w-12" /></TableHead>
          <TableHead className="w-[80px]"><Skeleton className="h-4 w-10" /></TableHead>
          <TableHead className="w-[160px]"><Skeleton className="h-4 w-10" /></TableHead>
          <TableHead className="w-[110px]"><Skeleton className="h-4 w-14" /></TableHead>
          <TableHead className="w-[150px]"><Skeleton className="h-4 w-10" /></TableHead>
          <TableHead className="w-[90px]"><Skeleton className="h-4 w-10" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-52" /></TableCell>
            <TableCell><Skeleton className="h-6 w-12 rounded-md" /></TableCell>
            <TableCell><Skeleton className="h-4 w-14" /></TableCell>
            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Skeleton className="h-5 w-14 rounded-md" />
                <Skeleton className="h-5 w-14 rounded-md" />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function HttpAssetsTable({
  assets,
  isLoading,
  pagination,
  sortState,
  onSort,
  onPageChange,
  onSelect,
  hasActiveFilters,
}: HttpAssetsTableProps) {
  // Show skeleton when initially loading
  if (isLoading && assets.length === 0) {
    return (
      <div className="relative min-h-[400px]">
        <TableSkeleton rows={10} />
      </div>
    );
  }

  // Show empty state
  if (assets.length === 0) {
    return (
      <div className="relative min-h-[360px] flex items-center justify-center">
        <EmptyState
          icon={hasActiveFilters ? SearchXIcon : LinkIcon}
          title={hasActiveFilters ? "No matching assets" : "No assets found"}
          description={
            hasActiveFilters
              ? "No HTTP assets match your current filters. Try adjusting your search criteria or clearing some filters."
              : "No HTTP assets have been discovered yet. Run a scan to start discovering assets."
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
                  field="url"
                  currentSort={sortState}
                  onSort={(f) => onSort(f as AssetSortField)}
                  className="w-[280px]"
                >
                  Asset Value
                </SortableTableHead>
                <SortableTableHead
                  field="statusCode"
                  currentSort={sortState}
                  onSort={(f) => onSort(f as AssetSortField)}
                  className="w-[80px]"
                >
                  Status
                </SortableTableHead>
                <SortableTableHead
                  field="contentLength"
                  currentSort={sortState}
                  onSort={(f) => onSort(f as AssetSortField)}
                  className="w-[80px]"
                >
                  Content Length
                </SortableTableHead>
                <SortableTableHead
                  field="title"
                  currentSort={sortState}
                  onSort={(f) => onSort(f as AssetSortField)}
                  className="w-[160px]"
                >
                  Title
                </SortableTableHead>
                <SortableTableHead
                  field="hostIp"
                  currentSort={sortState}
                  onSort={(f) => onSort(f as AssetSortField)}
                  className="w-[110px]"
                >
                  Host IP
                </SortableTableHead>
                <SortableTableHead
                  field="technologies"
                  currentSort={sortState}
                  onSort={(f) => onSort(f as AssetSortField)}
                  className="w-[150px]"
                >
                  Tech
                </SortableTableHead>
                <SortableTableHead
                  field="actions"
                  currentSort={sortState}
                  onSort={(f) => onSort(f as AssetSortField)}
                  className="w-[90px] text-center"
                >
                  Actions
                </SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence initial={false} mode="popLayout">
                {assets.map((asset) => (
                  <motion.tr
                    key={asset.id}
                    data-slot="table-row"
                    layout="position"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer"
                    onClick={() => onSelect?.(asset)}
                  >
                  <TableCell>
                    {(() => {
                      const assetValue = asset.assetValue || asset.url;
                      const isUrlValue = /^https?:\/\//i.test(assetValue);
                      const urlToOpen = asset.url || (isUrlValue ? assetValue : "");
                      if (!assetValue) {
                        return urlToOpen ? (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">-</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7"
                                  asChild
                                >
                                  <a
                                    href={urlToOpen}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ExternalLinkIcon className="size-4" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">Open URL</TooltipContent>
                            </Tooltip>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        );
                      }
                      if (!isUrlValue) {
                        return (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-foreground truncate max-w-[260px] block">
                              {truncate(assetValue, 38)}
                            </span>
                            {urlToOpen && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    asChild
                                  >
                                    <a
                                      href={urlToOpen}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ExternalLinkIcon className="size-4" />
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Open URL</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await navigator.clipboard.writeText(assetValue);
                                    toast.success("Copied URL");
                                  } catch {
                                    toast.error("Failed to copy URL");
                                  }
                                }}
                              >
                                <CopyIcon className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Copy URL</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                asChild
                              >
                                <a
                                  href={urlToOpen || assetValue}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLinkIcon className="size-4" />
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Open URL</TooltipContent>
                          </Tooltip>
                          <a
                            href={urlToOpen || assetValue}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-sm hover:underline text-primary flex items-center gap-1 truncate max-w-[260px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {truncate(assetValue, 38)}
                          </a>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(asset.statusCode)}>
                      {asset.statusCode}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {asset.contentLength.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {asset.title ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="truncate block max-w-[140px] cursor-default">
                            {asset.title}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[300px]">
                          {asset.title}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {asset.hostIp ? (
                      <span className="font-mono text-xs">{asset.hostIp}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {asset.technologies.length > 0 ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-wrap gap-1">
                            {asset.technologies.slice(0, 2).map((tech, i) => (
                              <Badge
                                key={i}
                                variant={getTechBadgeVariant(tech) as any}
                                className="text-xs"
                              >
                                {tech.split("/")[0]}
                              </Badge>
                            ))}
                            {asset.technologies.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{asset.technologies.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[300px]">
                          <div className="flex flex-wrap gap-1">
                            {asset.technologies.map((tech, i) => (
                              <Badge
                                key={i}
                                variant={getTechBadgeVariant(tech) as any}
                                className="text-xs"
                              >
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect?.(asset);
                            }}
                          >
                            <EyeIcon className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">View details</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
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
              results
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
