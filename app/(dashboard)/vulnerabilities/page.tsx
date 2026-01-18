"use client";

import * as React from "react";
import {
  fetchVulnerabilities,
  fetchVulnerabilitySummary,
} from "@/lib/api/vulnerabilities";
import type { Vulnerability, VulnerabilitySummary, VulnerabilitySeverity } from "@/lib/types/vulnerability";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InfoIcon,
  ShieldAlertIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  AlertOctagonIcon,
  InfoIcon as InfoCircleIcon,
  BarChart3Icon,
  GlobeIcon,
  BadgeCheckIcon,
  ListIcon,
  SearchIcon,
  RotateCcwIcon,
  EyeIcon,
  ChevronsUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
} from "lucide-react";
import { fetchWorkspaces } from "@/lib/api/assets";
import type { Workspace } from "@/lib/types/asset";
import type { SortDirection } from "@/lib/types/asset";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { PaginatedResponse } from "@/lib/types/api";
import type { VulnerabilityConfidence } from "@/lib/types/vulnerability";

// Helper function to determine tag color based on category
const getTagColor = (tag: string): string => {
  const t = tag.toLowerCase();
  // CVE identifiers
  if (t.startsWith("cve-")) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
  // Tool names
  if (["nuclei", "nmap", "ffuf", "httpx", "subfinder", "amass", "masscan", "dirsearch", "gobuster", "feroxbuster"].includes(t))
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
  // Vulnerability types
  if (["xss", "sqli", "rce", "lfi", "rfi", "ssrf", "idor", "xxe", "ssti", "csrf", "injection", "redirect"].includes(t))
    return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800";
  // Default gray
  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700";
};

const severityConfig: Record<
  VulnerabilitySeverity,
  {
    label: string;
    variant: "destructive" | "warning" | "secondary" | "outline" | "info";
    icon: React.ElementType;
    color: string;
  }
> = {
  critical: {
    label: "Critical",
    variant: "destructive",
    icon: AlertOctagonIcon,
    color: "text-red-600 dark:text-red-400",
  },
  high: {
    label: "High",
    variant: "warning",
    icon: AlertTriangleIcon,
    color: "text-yellow-600 dark:text-yellow-400",
  },
  medium: {
    label: "Medium",
    variant: "secondary",
    icon: AlertCircleIcon,
    color: "text-orange-600 dark:text-orange-400",
  },
  low: {
    label: "Low",
    variant: "outline",
    icon: InfoIcon,
    color: "text-gray-600 dark:text-gray-400",
  },
  info: {
    label: "Info",
    variant: "info",
    icon: InfoCircleIcon,
    color: "text-blue-600 dark:text-blue-400",
  },
};

const severityOptions: VulnerabilitySeverity[] = [
  "critical",
  "high",
  "medium",
  "low",
  "info",
];

const confidenceOptions: VulnerabilityConfidence[] = [
  "Certain",
  "Firm",
  "Tentative",
  "Manual Review Required",
];

export default function VulnerabilitiesPage() {
  type VulnerabilitySortField =
    | "severity"
    | "confidence"
    | "title"
    | "asset"
    | "tags"
    | "actions";

  const [vulnerabilities, setVulnerabilities] = React.useState<Vulnerability[]>([]);
  const [summary, setSummary] = React.useState<VulnerabilitySummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [summaryLoading, setSummaryLoading] = React.useState(true);
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [workspacesLoading, setWorkspacesLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<Vulnerability | null>(null);
  const [open, setOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [pagination, setPagination] = React.useState<
    PaginatedResponse<Vulnerability>["pagination"] | null
  >(null);
  const [filters, setFilters] = React.useState<{
    workspace?: string;
    severity?: VulnerabilitySeverity[];
    confidence?: VulnerabilityConfidence[];
  }>({});
  const [searchValue, setSearchValue] = React.useState("");

  const [sortState, setSortState] = React.useState<{
    field: VulnerabilitySortField | null;
    direction: SortDirection;
  }>({ field: null, direction: "asc" });

  const toggleSort = React.useCallback((field: VulnerabilitySortField) => {
    setSortState((prev) => {
      if (prev.field === field) {
        return { field, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { field, direction: "asc" };
    });
  }, []);

  const visibleVulnerabilities = React.useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    return vulnerabilities.filter((v) => {
      if (filters.severity?.length) {
        if (!filters.severity.includes(v.severity)) return false;
      }
      if (filters.confidence?.length) {
        if (!v.confidence || !filters.confidence.includes(v.confidence)) return false;
      }
      if (!q) return true;

      const haystack = [
        v.workspace,
        v.vulnTitle,
        v.vulnInfo,
        v.vulnDesc,
        v.vulnPoc,
        v.severity,
        v.confidence,
        v.assetType,
        v.assetValue,
        ...(v.tags ?? []),
      ]
        .filter((x): x is string => typeof x === "string")
        .join("\n")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [filters.confidence, filters.severity, vulnerabilities, searchValue]);

  const sortedVulnerabilities = React.useMemo(() => {
    if (!sortState.field) return visibleVulnerabilities;

    const severityOrder: Record<VulnerabilitySeverity, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
      info: 4,
    };

    const getValue = (
      field: VulnerabilitySortField,
      v: Vulnerability
    ): { missing: boolean; value: string | number } => {
      switch (field) {
        case "severity":
          return { missing: false, value: severityOrder[v.severity] ?? 99 };
        case "confidence":
          return { missing: !v.confidence, value: v.confidence ?? "" };
        case "title":
          return { missing: !v.vulnTitle, value: v.vulnTitle ?? "" };
        case "asset":
          return { missing: !v.assetValue, value: v.assetValue ?? "" };
        case "tags":
          return {
            missing: (v.tags ?? []).length === 0,
            value: (v.tags ?? []).join(","),
          };
        case "actions": {
          const n = Number.parseInt(v.id, 10);
          return {
            missing: Number.isNaN(n) && !v.id,
            value: Number.isNaN(n) ? v.id : n,
          };
        }
      }
    };

    const out = [...visibleVulnerabilities];
    out.sort((a, b) => {
      const av = getValue(sortState.field as VulnerabilitySortField, a);
      const bv = getValue(sortState.field as VulnerabilitySortField, b);

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
  }, [sortState.direction, sortState.field, visibleVulnerabilities]);

  const renderSortIcon = React.useCallback(
    (field: VulnerabilitySortField) => {
      const isActive = sortState.field === field;
      if (!isActive) {
        return <ArrowUpDownIcon className="size-3.5 text-muted-foreground/50" />;
      }
      return sortState.direction === "asc" ? (
        <ArrowUpIcon className="size-3.5 text-foreground" />
      ) : (
        <ArrowDownIcon className="size-3.5 text-foreground" />
      );
    },
    [sortState.direction, sortState.field]
  );

  const loadSummary = React.useCallback(async () => {
    try {
      setSummaryLoading(true);
      const res = await fetchVulnerabilitySummary(filters.workspace?.trim() || undefined);
      setSummary(res);
    } catch (e) {
      toast.error("Failed to load summary", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setSummaryLoading(false);
    }
  }, [filters.workspace]);

  React.useEffect(() => {
    let cancelled = false;
    const loadWorkspaces = async () => {
      try {
        setWorkspacesLoading(true);
        const ws = await fetchWorkspaces({ offset: 0, limit: 1000 });
        if (!cancelled) setWorkspaces(ws);
      } catch (e) {
        toast.error("Failed to load workspaces", {
          description: e instanceof Error ? e.message : "",
        });
      } finally {
        if (!cancelled) setWorkspacesLoading(false);
      }
    };
    loadWorkspaces();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadVulnerabilities = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchVulnerabilities({
        page,
        pageSize,
        filters: {
          workspace: filters.workspace?.trim() || undefined,
          severity: filters.severity?.length ? filters.severity : undefined,
          confidence: filters.confidence?.length ? filters.confidence : undefined,
        },
      });
      setVulnerabilities(res.data);
      setPagination(res.pagination);
    } catch (e) {
      toast.error("Failed to load vulnerabilities", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  const handleSeverityToggle = React.useCallback((severity: VulnerabilitySeverity) => {
    setFilters((f) => {
      const current = f.severity ?? [];
      const updated = current.includes(severity)
        ? current.filter((s) => s !== severity)
        : [...current, severity];
      const order: Record<VulnerabilitySeverity, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
        info: 4,
      };
      const normalized = updated
        .filter((s, i) => updated.indexOf(s) === i)
        .sort((a, b) => order[a] - order[b]);
      return { ...f, severity: normalized.length ? normalized : undefined };
    });
    setPage(1);
  }, []);

  const handleConfidenceToggle = React.useCallback((confidence: VulnerabilityConfidence) => {
    setFilters((f) => {
      const current = f.confidence ?? [];
      const updated = current.includes(confidence)
        ? current.filter((c) => c !== confidence)
        : [...current, confidence];
      const normalized = updated
        .filter((c, i) => updated.indexOf(c) === i)
        .sort((a, b) => a.localeCompare(b));
      return { ...f, confidence: normalized.length ? normalized : undefined };
    });
    setPage(1);
  }, []);

  React.useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  React.useEffect(() => {
    loadVulnerabilities();
  }, [loadVulnerabilities]);

  const openDetail = (v: Vulnerability) => {
    setSelected(v);
    setOpen(true);
  };

  const SeverityBadge = ({ severity }: { severity: VulnerabilitySeverity }) => {
    const config = severityConfig[severity] || severityConfig.info;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="size-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Compact Severity Summary */}
      <div className="rounded-lg border bg-card p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <BarChart3Icon className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Statistics on Vulnerabilities</span>
          </div>
          <div className="h-4 w-px bg-border" />
          {(["critical", "high", "medium", "low", "info"] as VulnerabilitySeverity[]).map(
            (sev) => {
              const config = severityConfig[sev];
              const Icon = config.icon;
              const count = summary?.bySeverity[sev] ?? 0;
              return (
                <div
                  key={sev}
                  className="inline-flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5"
                >
                  <Icon className={`size-4 ${config.color}`} />
                  <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
                  <span className="text-sm font-bold">
                    {summaryLoading ? "-" : count.toLocaleString()}
                  </span>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <ShieldAlertIcon className="size-5" />
              Vulnerabilities
            </CardTitle>
            <CardDescription>
              Filter by workspace, severity, or confidence
            </CardDescription>
          </div>
          <Button
            variant="outline"
            className="shrink-0"
            onClick={() => {
              setFilters({});
              setSearchValue("");
              setPage(1);
              setPageSize(20);
            }}
          >
            <RotateCcwIcon className="mr-2 size-4" />
            Reset
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 py-2">
            <div className="relative flex-1 min-w-[240px]">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search title, info, asset, or tags..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select
              value={filters.workspace || "all"}
              onValueChange={(val) => {
                setFilters((f) => ({
                  ...f,
                  workspace: val === "all" ? undefined : val,
                }));
                setPage(1);
              }}
              disabled={workspacesLoading}
            >
              <SelectTrigger className="max-w-[220px]">
                <span className="flex items-center gap-2">
                  <GlobeIcon className="size-4 text-muted-foreground" />
                  <SelectValue placeholder="Workspace" />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workspaces</SelectItem>
                {workspaces
                  .filter((w) => !!w.name)
                  .map((w) => (
                    <SelectItem key={`${w.id}-${w.name}`} value={w.name}>
                      {w.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={(filters.severity?.length ?? 0) > 0 ? "border-primary" : undefined}
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangleIcon className="size-4 text-muted-foreground" />
                    <span>Severity</span>
                    {(filters.severity?.length ?? 0) > 0 && (
                      <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                        {filters.severity?.length}
                      </Badge>
                    )}
                  </span>
                  <ChevronsUpDownIcon className="ml-2 size-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-2" align="start">
                <div className="space-y-1">
                  {severityOptions.map((sev) => (
                    <label
                      key={sev}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-muted cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={filters.severity?.includes(sev) ?? false}
                        onCheckedChange={() => handleSeverityToggle(sev)}
                      />
                      <span>{severityConfig[sev].label}</span>
                    </label>
                  ))}
                </div>
                {(filters.severity?.length ?? 0) > 0 && (
                  <div className="pt-2 mt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8"
                      onClick={() => {
                        setFilters((f) => ({ ...f, severity: undefined }));
                        setPage(1);
                      }}
                    >
                      Clear selection
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={(filters.confidence?.length ?? 0) > 0 ? "border-primary" : undefined}
                >
                  <span className="flex items-center gap-2">
                    <BadgeCheckIcon className="size-4 text-muted-foreground" />
                    <span>Confidence</span>
                    {(filters.confidence?.length ?? 0) > 0 && (
                      <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                        {filters.confidence?.length}
                      </Badge>
                    )}
                  </span>
                  <ChevronsUpDownIcon className="ml-2 size-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-2" align="start">
                <div className="space-y-1">
                  {confidenceOptions.map((c) => (
                    <label
                      key={c}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-muted cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={filters.confidence?.includes(c) ?? false}
                        onCheckedChange={() => handleConfidenceToggle(c)}
                      />
                      <span>{c}</span>
                    </label>
                  ))}
                </div>
                {(filters.confidence?.length ?? 0) > 0 && (
                  <div className="pt-2 mt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8"
                      onClick={() => {
                        setFilters((f) => ({ ...f, confidence: undefined }));
                        setPage(1);
                      }}
                    >
                      Clear selection
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                const n = parseInt(val, 10);
                setPageSize(Number.isNaN(n) ? 20 : n);
                setPage(1);
              }}
            >
              <SelectTrigger className="max-w-[140px]">
                <span className="flex items-center gap-2">
                  <ListIcon className="size-4 text-muted-foreground" />
                  <SelectValue placeholder="Page Size" />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : visibleVulnerabilities.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No vulnerabilities found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">
                      <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("severity")}>
                        <span>Severity</span>
                        {renderSortIcon("severity")}
                      </button>
                    </th>
                    <th className="p-2 text-left">
                      <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("confidence")}>
                        <span>Confidence</span>
                        {renderSortIcon("confidence")}
                      </button>
                    </th>
                    <th className="p-2 text-left">
                      <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("title")}>
                        <span>Title</span>
                        {renderSortIcon("title")}
                      </button>
                    </th>
                    <th className="p-2 text-left">
                      <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("asset")}>
                        <span>Asset</span>
                        {renderSortIcon("asset")}
                      </button>
                    </th>
                    <th className="p-2 text-left">
                      <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("tags")}>
                        <span>Tags</span>
                        {renderSortIcon("tags")}
                      </button>
                    </th>
                    <th className="p-2 text-left">
                      <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("actions")}>
                        <span>Actions</span>
                        {renderSortIcon("actions")}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedVulnerabilities.map((v) => (
                    <tr key={v.id} className="border-b">
                      <td className="p-2">
                        <SeverityBadge severity={v.severity} />
                      </td>
                      <td className="p-2">
                        {v.confidence ? (
                          <Badge variant="outline" className="text-xs">
                            {v.confidence}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-2">
                        <div className="max-w-[300px]">
                          <p className="font-medium truncate">{v.vulnTitle || "-"}</p>
                          {v.vulnInfo && (
                            <p className="text-xs text-muted-foreground truncate">
                              {v.vulnInfo}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <span className="font-mono text-xs text-muted-foreground max-w-[200px] truncate block">
                          {v.assetValue || "-"}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {v.tags.slice(0, 3).map((tag, i) => (
                            <Badge key={i} variant="outline" className={`text-xs ${getTagColor(tag)}`}>
                              {tag}
                            </Badge>
                          ))}
                          {v.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                              +{v.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="rounded-md"
                          onClick={() => openDetail(v)}
                          aria-label="View"
                        >
                          <EyeIcon className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected && <SeverityBadge severity={selected.severity} />}
              Vulnerability Details
            </DialogTitle>
            <DialogDescription>
              {selected?.vulnInfo || "Vulnerability information"}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-muted-foreground">Title</p>
                  <p>{selected.vulnTitle || "-"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Workspace</p>
                  <p>{selected.workspace || "-"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Confidence</p>
                  <p>{selected.confidence || "-"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Asset Type</p>
                  <p>{selected.assetType || "-"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Asset Value</p>
                  <p className="font-mono text-xs break-all">
                    {selected.assetValue || "-"}
                  </p>
                </div>
              </div>

              {selected.vulnDesc && (
                <div>
                  <p className="font-medium text-muted-foreground">Description</p>
                  <p className="whitespace-pre-wrap">{selected.vulnDesc}</p>
                </div>
              )}

              {selected.tags.length > 0 && (
                <div>
                  <p className="font-medium text-muted-foreground mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className={getTagColor(tag)}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selected.vulnPoc && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Proof of Concept
                  </p>
                  <pre className="mt-1 rounded bg-muted p-2 text-xs overflow-x-auto whitespace-pre-wrap break-all">
                    {selected.vulnPoc}
                  </pre>
                </div>
              )}

              {selected.detailHttpRequest && (
                <div>
                  <p className="font-medium text-muted-foreground">HTTP Request</p>
                  <pre className="mt-1 rounded bg-muted p-2 text-xs overflow-x-auto whitespace-pre-wrap">
                    {selected.detailHttpRequest}
                  </pre>
                </div>
              )}

              {selected.detailHttpResponse && (
                <div>
                  <p className="font-medium text-muted-foreground">HTTP Response</p>
                  <pre className="mt-1 rounded bg-muted p-2 text-xs overflow-x-auto whitespace-pre-wrap">
                    {selected.detailHttpResponse}
                  </pre>
                </div>
              )}

              {selected.rawVulnJson && (
                <div>
                  <p className="font-medium text-muted-foreground">Raw JSON</p>
                  <pre className="mt-1 rounded bg-muted p-2 text-xs overflow-x-auto whitespace-pre-wrap">
                    {(() => {
                      try {
                        return JSON.stringify(
                          JSON.parse(selected.rawVulnJson),
                          null,
                          2
                        );
                      } catch {
                        return selected.rawVulnJson;
                      }
                    })()}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  Created: {selected.createdAt?.toLocaleString() || "-"}
                </div>
                <div>
                  Updated: {selected.updatedAt?.toLocaleString() || "-"}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
