"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScanTable } from "@/components/scans/scan-table";
import { ErrorState } from "@/components/shared/error-state";
import { fetchScans, type ScanFilters } from "@/lib/api/scans";
import type { Scan } from "@/lib/types/scan";
import type { PaginatedResponse } from "@/lib/types/api";
import { PlusIcon, RefreshCcwIcon, ScanSearchIcon } from "lucide-react";
import { toast } from "sonner";

export default function ScansPage() {
  const [scans, setScans] = React.useState<Scan[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [pagination, setPagination] = React.useState<PaginatedResponse<Scan>["pagination"] | null>(null);
  const [filters, setFilters] = React.useState<{
    status?: string;
  }>({});
  const [tableSearch, setTableSearch] = React.useState<string>("");

  const loadScans = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetchScans({
        page,
        pageSize,
        filters: {
          status: filters.status || undefined,
        },
      });
      setScans(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scans");
      toast.error("Failed to load scans", {
        description: err instanceof Error ? err.message : "",
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filters]);

  React.useEffect(() => {
    loadScans();
  }, [loadScans]);

  const filteredScans = React.useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return scans;

    return scans.filter((s) => {
      const parts = [
        s.id,
        s.runId,
        s.workflowName,
        s.workflowKind,
        s.target,
        s.status,
        s.triggerType,
        s.triggerName,
        s.workspacePath,
        s.errorMessage,
        s.startedAt?.toISOString(),
        s.completedAt?.toISOString(),
        s.createdAt?.toISOString(),
        s.updatedAt?.toISOString(),
      ].filter(Boolean);

      let paramsText = "";
      if (s.params && typeof s.params === "object") {
        try {
          paramsText = JSON.stringify(s.params);
        } catch {
          paramsText = "";
        }
      }

      const haystack = `${parts.join(" ")} ${paramsText}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [scans, tableSearch]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ScanSearchIcon className="size-5" />
                Scans
              </CardTitle>
              <CardDescription>
                Filter by status, workflow, or target
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/scans/new">
                <PlusIcon className="mr-2 size-4" />
                New Scan
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 py-2">
            <Input
              placeholder="Search"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full md:w-1/3 max-w-none"
            />
            <Select
              value={filters.status || "all"}
              onValueChange={(val) => {
                setFilters((f) => ({
                  ...f,
                  status: val === "all" ? undefined : val,
                }));
                setPage(1);
              }}
            >
              <SelectTrigger className="max-w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                const n = parseInt(val, 10);
                setPageSize(Number.isNaN(n) ? 20 : n);
                setPage(1);
              }}
            >
              <SelectTrigger className="max-w-[140px]">
                <SelectValue placeholder="Page Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadScans} disabled={isLoading}>
              <RefreshCcwIcon className={`mr-2 size-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {error ? (
            <ErrorState message={error} onRetry={loadScans} />
          ) : (
            <>
              <ScanTable
                scans={filteredScans}
                isLoading={isLoading}
                onRefresh={loadScans}
              />

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-3">
                  <p className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.pageSize,
                      pagination.totalItems
                    )}{" "}
                    of {pagination.totalItems.toLocaleString()} results
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page <= 1}
                    >
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
                              onClick={() => setPage(pageNum)}
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
                      onClick={() =>
                        setPage((p) => Math.min(p + 1, pagination.totalPages))
                      }
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
