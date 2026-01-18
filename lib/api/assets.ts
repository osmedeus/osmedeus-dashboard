import { http } from "./http";
import { API_PREFIX } from "@/lib/api/prefix";
import { isDemoMode } from "./demo-mode";
import type { Workspace, HttpAsset, HttpAssetFilters } from "@/lib/types/asset";
import type { PaginatedResponse } from "@/lib/types/api";
import { mockWorkspaces } from "@/lib/mock/data/workspaces";
import { mockHttpAssets } from "@/lib/mock/data/http-assets";

export interface FetchWorkspacesParams {
  offset?: number;
  limit?: number;
  search?: string;
  filesystem?: boolean;
  data_source?: string;
}

export interface WorkspacesListResult {
  items: Workspace[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
  };
  mode?: string;
}

/**
 * Fetch all workspaces with pagination
 */
export async function fetchWorkspaces(params: FetchWorkspacesParams = {}): Promise<Workspace[]> {
  const result = await fetchWorkspacesList(params);
  return result.items;
}

/**
 * Fetch workspaces with pagination info
 */
export async function fetchWorkspacesList(params: FetchWorkspacesParams = {}): Promise<WorkspacesListResult> {
  if (isDemoMode()) {
    const normalized = mockWorkspaces.map((w: any) => mapWorkspace(w));
    const search = params.search?.trim().toLowerCase();
    const ds = params.data_source?.trim().toLowerCase();
    const filteredBase = search
      ? normalized.filter((w) => {
          if (w.name.toLowerCase().includes(search)) return true;
          if (w.local_path.toLowerCase().includes(search)) return true;
          if (w.data_source?.toLowerCase().includes(search)) return true;
          return w.tags.some((t) => t.toLowerCase().includes(search));
        })
      : normalized;
    const filtered = ds && ds !== "all" ? filteredBase.filter((w) => (w.data_source ?? "").toLowerCase() === ds) : filteredBase;
    const offset = typeof params.offset === "number" ? params.offset : 0;
    const limit = typeof params.limit === "number" ? params.limit : filtered.length;
    const items = filtered.slice(offset, offset + limit);
    return {
      items,
      pagination: { total: filtered.length, offset, limit },
      mode: params.filesystem ? "filesystem" : "database",
    };
  }
  const query: Record<string, any> = {};
  if (typeof params.offset === "number") query.offset = params.offset;
  if (typeof params.limit === "number") query.limit = params.limit;
  if (params.search) query.search = params.search;
  if (params.filesystem) query.filesystem = true;
  if (params.data_source) query.data_source = params.data_source;
  const res = await http.get(`${API_PREFIX}/workspaces`, { params: query });
  const payload = (res.data || {}) as any;
  const list = (Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.items)
      ? payload.items
      : []) as Array<any>;
  const paginationRaw = payload.pagination || payload.meta?.pagination || {};
  const totalRaw = paginationRaw.total ?? paginationRaw.totalItems;
  const offsetRaw = paginationRaw.offset;
  const limitRaw = paginationRaw.limit;
  const pageRaw = paginationRaw.page;
  const pageSizeRaw = paginationRaw.pageSize;
  const computedOffset =
    typeof offsetRaw !== "undefined"
      ? offsetRaw
      : typeof pageRaw === "number" && typeof pageSizeRaw === "number"
        ? Math.max(0, (pageRaw - 1) * pageSizeRaw)
        : typeof params.offset === "number"
          ? params.offset
          : 0;
  const computedLimit =
    typeof limitRaw !== "undefined"
      ? limitRaw
      : typeof pageSizeRaw === "number"
        ? pageSizeRaw
        : typeof params.limit === "number"
          ? params.limit
          : list.length;
  const computedTotal = Number(totalRaw);
  return {
    items: list.map(mapWorkspace),
    pagination: {
      total: Number.isFinite(computedTotal) ? computedTotal : list.length,
      offset: Number(computedOffset) || 0,
      limit: Number(computedLimit) || list.length,
    },
    mode: payload.mode ?? payload.meta?.mode ?? (params.filesystem ? "filesystem" : "database"),
  };
}

function mapWorkspace(w: any): Workspace {
  return {
    id: Number(w?.id ?? w?.workspace_id ?? 0) || 0,
    name: String(w?.name ?? w?.workspace ?? w?.target ?? ""),
    data_source: typeof w?.data_source === "string" ? w.data_source : typeof w?.dataSource === "string" ? w.dataSource : undefined,
    local_path: String(w?.local_path ?? w?.workspace_path ?? w?.path ?? ""),
    total_assets: Number(w?.total_assets ?? w?.assets_total ?? w?.assets?.total ?? 0) || 0,
    total_subdomains: Number(w?.total_subdomains ?? w?.subdomains_total ?? w?.subdomains?.total ?? 0) || 0,
    total_urls: Number(w?.total_urls ?? w?.urls_total ?? w?.http_assets_total ?? w?.http_assets?.total ?? 0) || 0,
    total_vulns: Number(w?.total_vulns ?? w?.vulns_total ?? w?.vulnerabilities?.total ?? 0) || 0,
    vuln_critical: Number(w?.vuln_critical ?? w?.vulnerabilities?.critical ?? 0) || 0,
    vuln_high: Number(w?.vuln_high ?? w?.vulnerabilities?.high ?? 0) || 0,
    vuln_medium: Number(w?.vuln_medium ?? w?.vulnerabilities?.medium ?? 0) || 0,
    vuln_low: Number(w?.vuln_low ?? w?.vulnerabilities?.low ?? 0) || 0,
    vuln_potential: Number(w?.vuln_potential ?? w?.vulnerabilities?.potential ?? w?.vulnerabilities?.info ?? 0) || 0,
    risk_score: Number(w?.risk_score ?? w?.risk?.score ?? w?.score ?? 0) || 0,
    tags: Array.isArray(w?.tags) ? w.tags : Array.isArray(w?.labels) ? w.labels : [],
    last_run: String(w?.last_run ?? w?.last_scan ?? w?.latest_run_at ?? w?.last_run_at ?? ""),
    run_workflow: String(w?.run_workflow ?? w?.last_workflow ?? w?.workflow ?? ""),
    state_execution_log:
      typeof w?.state_execution_log === "string"
        ? w.state_execution_log
        : typeof w?.state?.execution_log === "string"
          ? w.state.execution_log
          : undefined,
    state_completed_file:
      typeof w?.state_completed_file === "string"
        ? w.state_completed_file
        : typeof w?.state?.completed_file === "string"
          ? w.state.completed_file
          : undefined,
    state_workflow_file:
      typeof w?.state_workflow_file === "string"
        ? w.state_workflow_file
        : typeof w?.state?.workflow_file === "string"
          ? w.state.workflow_file
          : undefined,
    state_workflow_folder:
      typeof w?.state_workflow_folder === "string"
        ? w.state_workflow_folder
        : typeof w?.state?.workflow_folder === "string"
          ? w.state.workflow_folder
          : undefined,
    created_at: String(w?.created_at ?? w?.createdAt ?? ""),
    updated_at: String(w?.updated_at ?? w?.updatedAt ?? ""),
  };
}

/**
 * Fetch a single workspace by ID
 */
export async function fetchWorkspace(id: string): Promise<Workspace | null> {
  if (isDemoMode()) {
    const w = mockWorkspaces.find((x: any) => String(x.id) === id || x.name === id);
    if (!w) return null;
    return mapWorkspace(w);
  }
  try {
    const res = await http.get(`${API_PREFIX}/workspaces`, { params: { offset: 0, limit: 1000 } });
    const list = (res.data?.data || []) as Array<any>;
    const w = list.find((x) => String(x.id) === id || x.name === id);
    if (!w) return null;
    return mapWorkspace(w);
  } catch {
    return null;
  }
}

/**
 * Fetch HTTP assets for a workspace with filtering and pagination
 */
export async function fetchHttpAssets(
  workspace: string | undefined,
  params: {
    page?: number;
    pageSize?: number;
    filters?: HttpAssetFilters;
  }
): Promise<PaginatedResponse<HttpAsset>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const offset = (page - 1) * pageSize;
  const filters = params.filters ?? {};
  if (isDemoMode()) {
    const normalizedWorkspace = (workspace ?? "").trim();
    const match = normalizedWorkspace
      ? mockWorkspaces.find((w) => w.name === normalizedWorkspace) ||
        mockWorkspaces.find((w) => w.name.toLowerCase() === normalizedWorkspace.toLowerCase())
      : undefined;
    const workspaceKey = match
      ? `ws-${String(match.id).padStart(3, "0")}`
      : normalizedWorkspace.startsWith("ws-")
        ? normalizedWorkspace
        : "ws-001";

    const all = mockHttpAssets[workspaceKey] ?? [];
    const q = (filters.search ?? "").trim().toLowerCase();
    const statusSet = new Set(filters.statusCodes ?? []);
    const wantedTech = (filters.technologies ?? [])
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const wantedContentTypes = (filters.contentTypes ?? [])
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const wantedTls = (filters.tlsVersion ?? "").trim().toLowerCase();
    const wantedLocation = (filters.location ?? "").trim().toLowerCase();

    const filtered = all.filter((a) => {
      if (q) {
        const hay = [a.url, a.assetValue, a.title ?? "", a.hostIp ?? ""]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusSet.size > 0 && !statusSet.has(a.statusCode)) return false;
      if (wantedTech.length > 0) {
        const techSet = new Set(a.technologies.map((t) => String(t).trim().toLowerCase()));
        if (!wantedTech.some((t) => techSet.has(t))) return false;
      }
      if (wantedContentTypes.length > 0) {
        const ct = (a.contentType ?? "").toLowerCase();
        if (!wantedContentTypes.some((t) => ct.includes(t))) return false;
      }
      if (wantedTls && String(a.tls ?? "").toLowerCase() !== wantedTls) return false;
      if (wantedLocation) {
        const locHay = [a.url, a.assetValue, a.hostIp ?? ""]
          .join(" ")
          .toLowerCase();
        if (!locHay.includes(wantedLocation)) return false;
      }
      if (typeof filters.minContentLength === "number" && a.contentLength < filters.minContentLength) return false;
      if (typeof filters.maxContentLength === "number" && a.contentLength > filters.maxContentLength) return false;
      return true;
    });

    const sliced = filtered.slice(offset, offset + pageSize);
    const totalItems = filtered.length;
    return {
      data: sliced,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }
  const query: Record<string, any> = { offset, limit: pageSize };
  if (workspace) query.workspace = workspace;
  if (filters.search) query.search = filters.search;
  if (filters.statusCodes?.length) query.status_code = filters.statusCodes.join(",");
  if (typeof filters.minContentLength === "number") query.min_content_length = filters.minContentLength;
  if (typeof filters.maxContentLength === "number") query.max_content_length = filters.maxContentLength;
  if (filters.location) query.location = filters.location;
  // New filter parameters
  if (filters.technologies?.length) query.tech = filters.technologies.join(",");
  if (filters.contentTypes?.length) query.content_type = filters.contentTypes.join(",");
  if (filters.tlsVersion) query.tls = filters.tlsVersion;
  const res = await http.get(`${API_PREFIX}/assets`, { params: query });
  const list = (res.data?.data || []) as Array<any>;
  const mapped: HttpAsset[] = list.map((a) => ({
    id: String(a.id ?? a.url),
    workspace: a.workspace ?? "",
    assetValue: a.asset_value ?? "",
    url: a.url ?? "",
    input: a.input ?? "",
    scheme: a.scheme ?? "",
    method: a.method ?? "GET",
    path: a.path ?? "/",
    statusCode: a.status_code ?? 0,
    contentType: a.content_type ?? "",
    contentLength: a.content_length ?? 0,
    title: a.title,
    words: a.words ?? 0,
    lines: a.lines ?? 0,
    hostIp: a.host_ip,
    aRecords: a.a ?? [],
    tls: a.tls,
    assetType: a.asset_type ?? "web",
    technologies: a.tech ?? [],
    responseTime: a.time,
    remarks: a.remarks,
    source: a.source ?? "",
    createdAt: a.created_at ? new Date(a.created_at) : new Date(),
    updatedAt: a.updated_at ? new Date(a.updated_at) : new Date(),
  }));
  const total = res.data?.pagination?.total ?? mapped.length;
  return {
    data: mapped,
    pagination: {
      page,
      pageSize,
      totalItems: total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
