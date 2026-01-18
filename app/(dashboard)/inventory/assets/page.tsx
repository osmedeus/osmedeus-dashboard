"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { fetchWorkspaces, fetchHttpAssets } from "@/lib/api/assets";
import type { Workspace } from "@/lib/types/asset";
import type { PaginatedResponse } from "@/lib/types/api";
import type {
  HttpAsset,
  HttpAssetFilters,
  AssetSortState,
  AssetSortField,
} from "@/lib/types/asset";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCcwIcon } from "lucide-react";
import { toast } from "sonner";
import { AssetFilters } from "@/components/assets/asset-filters";
import { HttpAssetsTable } from "@/components/assets/http-assets-table";
import { AssetDetailDialog } from "@/components/assets/asset-detail-dialog";
import { sortAssets } from "@/lib/utils";

export default function InventoryAssetsPage() {
  const searchParams = useSearchParams();
  const workspaceParam = (searchParams.get("workspace") ?? "").trim();

  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = React.useState<string>(() =>
    workspaceParam ? workspaceParam : "all"
  );
  const [assetsResponse, setAssetsResponse] =
    React.useState<PaginatedResponse<HttpAsset> | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [filters, setFilters] = React.useState<HttpAssetFilters>({});
  const [page, setPage] = React.useState(1);
  const [selectedAsset, setSelectedAsset] = React.useState<HttpAsset | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [sortState, setSortState] = React.useState<AssetSortState>({
    field: null,
    direction: "asc",
  });
  const lastFetchRef = React.useRef<number>(0);
  const forceNextRef = React.useRef<boolean>(false);
  const COOLDOWN_MS = 20000;

  React.useEffect(() => {
    const loadWs = async () => {
      try {
        const ws = await fetchWorkspaces();
        setWorkspaces(ws);
      } catch (e) {
        toast.error("Failed to load workspaces", {
          description: e instanceof Error ? e.message : "",
        });
      }
    };
    loadWs();
  }, []);

  React.useEffect(() => {
    if (!workspaces.length) return;
    if (!selectedWorkspace || selectedWorkspace === "all") return;
    const matchById = workspaces.find(
      (w) => String(w.id) === selectedWorkspace
    );
    if (matchById) return;
    const matchByName =
      workspaces.find((w) => w.name === selectedWorkspace) ||
      workspaces.find(
        (w) => w.name.toLowerCase() === selectedWorkspace.toLowerCase()
      );
    if (!matchByName) return;
    setSelectedWorkspace(String(matchByName.id));
  }, [workspaces, selectedWorkspace]);

  const loadAssets = React.useCallback(
    async (force?: boolean) => {
      const now = Date.now();
      if (!force && now - lastFetchRef.current < COOLDOWN_MS) return;
      try {
        setIsLoading(true);
        const effectiveWorkspace =
          selectedWorkspace === "all"
            ? undefined
            : (workspaces.find((w) => String(w.id) === selectedWorkspace)?.name ??
              selectedWorkspace);
        const res = await fetchHttpAssets(effectiveWorkspace, {
          page,
          pageSize: 50,
          filters,
        });
        const tp = res.pagination?.totalPages ?? 0;
        if (tp > 0 && page > tp) {
          setPage(tp);
          forceNextRef.current = true;
          return;
        }
        setAssetsResponse(res);
        lastFetchRef.current = Date.now();
      } catch (e) {
        toast.error("Failed to load assets", {
          description: e instanceof Error ? e.message : "",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [selectedWorkspace, page, filters, workspaces]
  );

  React.useEffect(() => {
    const doLoad = async () => {
      await loadAssets(forceNextRef.current);
      forceNextRef.current = false;
    };
    doLoad();
  }, [loadAssets]);

  const handleFiltersChange = React.useCallback((next: HttpAssetFilters) => {
    setFilters(next);
    setPage(1);
  }, []);

  const handleSort = React.useCallback((field: AssetSortField) => {
    setSortState((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const clientFilteredAssets = React.useMemo(() => {
    const assets = assetsResponse?.data ?? [];
    const q = (filters.search ?? "").trim().toLowerCase();

    return assets.filter((a) => {
      if (q) {
        const hay = [a.url, a.title ?? "", a.assetValue, a.hostIp ?? ""]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.statusCodes?.length) {
        if (!filters.statusCodes.includes(a.statusCode)) return false;
      }
      if (filters.technologies?.length) {
        const techSet = new Set(
          a.technologies.map((t) => String(t).trim().toLowerCase())
        );
        const wanted = filters.technologies.map((t) => t.trim().toLowerCase());
        if (!wanted.some((t) => techSet.has(t))) return false;
      }
      return true;
    });
  }, [assetsResponse?.data, filters.search, filters.statusCodes, filters.technologies]);

  // Apply client-side sorting
  const sortedAssets = React.useMemo(() => {
    return sortAssets(clientFilteredAssets, sortState.field, sortState.direction);
  }, [clientFilteredAssets, sortState]);

  // Check if any filters are active
  const hasActiveFilters = React.useMemo(() => {
    return !!(
      filters.search ||
      filters.statusCodes?.length ||
      filters.technologies?.length ||
      filters.contentTypes?.length ||
      filters.tlsVersion ||
      filters.location
    );
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Main Content Card */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Assets Inventory</CardTitle>
              <CardDescription>
                {assetsResponse?.pagination?.totalItems !== undefined ? (
                  <>
                    <span className="font-medium text-foreground">
                      {assetsResponse.pagination.totalItems.toLocaleString()}
                    </span>{" "}
                    assets found
                    {selectedWorkspace !== "all" && (
                      <>
                        {" "}
                        in{" "}
                        <span className="font-medium text-foreground">
                          {workspaces.find((w) => String(w.id) === selectedWorkspace)
                            ?.name ?? selectedWorkspace}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  "Loading assets..."
                )}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <Select
                value={selectedWorkspace}
                onValueChange={(v) => {
                  setSelectedWorkspace(v);
                  setPage(1);
                  forceNextRef.current = true;
                }}
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workspaces</SelectItem>
                  {workspaces.map((ws) => (
                    <SelectItem key={ws.id} value={String(ws.id)}>
                      {ws.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadAssets(true)}
                disabled={isLoading}
              >
                <RefreshCcwIcon
                  className={`size-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              {sortedAssets.length > 0 && (
                <div className="hidden lg:flex items-center gap-2">
                  <Badge variant="success" className="gap-1">
                    2xx:{" "}
                    {
                      sortedAssets.filter(
                        (a) => a.statusCode >= 200 && a.statusCode < 300
                      ).length
                    }
                  </Badge>
                  <Badge variant="warning" className="gap-1">
                    3xx:{" "}
                    {
                      sortedAssets.filter(
                        (a) => a.statusCode >= 300 && a.statusCode < 400
                      ).length
                    }
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    4xx:{" "}
                    {
                      sortedAssets.filter(
                        (a) => a.statusCode >= 400 && a.statusCode < 500
                      ).length
                    }
                  </Badge>
                  <Badge variant="destructive" className="gap-1">
                    5xx:{" "}
                    {sortedAssets.filter((a) => a.statusCode >= 500).length}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Filters section */}
        <div className="border-b p-4 bg-muted/10">
          <AssetFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </div>

        {/* Table section */}
        <CardContent className="p-0">
          <HttpAssetsTable
            assets={sortedAssets}
            isLoading={isLoading}
            pagination={assetsResponse?.pagination}
            sortState={sortState}
            onSort={handleSort}
            onPageChange={(p) => {
              setPage(p);
            }}
            onSelect={(asset) => {
              setSelectedAsset(asset);
              setDialogOpen(true);
            }}
            hasActiveFilters={hasActiveFilters}
          />
        </CardContent>
      </Card>

      <AssetDetailDialog
        asset={selectedAsset}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
