import { http } from "./http";
import { API_PREFIX } from "@/lib/api/prefix";
import { isDemoMode } from "./demo-mode";
import type { Scan, NewScanInput } from "@/lib/types/scan";
import type { PaginatedResponse } from "@/lib/types/api";
import { mockScans } from "@/lib/mock/data/scans";

let demoScans: Scan[] = [...mockScans];

export interface ScanFilters {
  status?: string;
  workflowName?: string;
  target?: string;
}

function mapScanFromApi(r: any): Scan {
  return {
    id: String(r.id ?? r.run_id ?? ""),
    runId: r.run_id ?? "",
    workflowName: r.workflow_name ?? "",
    workflowKind: r.workflow_kind === "module" ? "module" : "flow",
    target: r.target ?? "",
    params: r.params,
    status: r.status ?? "pending",
    workspacePath: r.workspace_path,
    startedAt: r.started_at ? new Date(r.started_at) : undefined,
    completedAt: r.completed_at ? new Date(r.completed_at) : undefined,
    totalSteps: r.total_steps ?? 0,
    completedSteps: r.completed_steps ?? 0,
    triggerType: r.trigger_type ?? "manual",
    triggerName: r.trigger_name,
    errorMessage: r.error_message,
    createdAt: r.created_at ? new Date(r.created_at) : new Date(),
    updatedAt: r.updated_at ? new Date(r.updated_at) : new Date(),
  };
}

/**
 * Fetch paginated scans list
 */
export async function fetchScans(params: {
  page?: number;
  pageSize?: number;
  filters?: ScanFilters;
}): Promise<PaginatedResponse<Scan>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const offset = (page - 1) * pageSize;
  const filters = params.filters ?? {};

  if (isDemoMode()) {
    const normalizedStatus = (filters.status ?? "").trim().toLowerCase();
    const workflowQuery = (filters.workflowName ?? "").trim().toLowerCase();
    const targetQuery = (filters.target ?? "").trim().toLowerCase();

    const filtered = demoScans.filter((s) => {
      if (normalizedStatus && normalizedStatus !== "all") {
        if (String(s.status).toLowerCase() !== normalizedStatus) return false;
      }
      if (workflowQuery && !s.workflowName.toLowerCase().includes(workflowQuery)) return false;
      if (targetQuery && !s.target.toLowerCase().includes(targetQuery)) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const at = a.startedAt?.getTime() ?? a.createdAt?.getTime() ?? 0;
      const bt = b.startedAt?.getTime() ?? b.createdAt?.getTime() ?? 0;
      return bt - at;
    });

    const sliced = sorted.slice(offset, offset + pageSize);
    const total = sorted.length;
    return {
      data: sliced,
      pagination: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  const query: Record<string, any> = { offset, limit: pageSize };
  if (filters.status && filters.status !== "all") query.status = filters.status;
  if (filters.workflowName) query.workflow_name = filters.workflowName;
  if (filters.target) query.target = filters.target;

  const res = await http.get(`${API_PREFIX}/runs`, { params: query });
  const list = (res.data?.data || []) as Array<any>;

  const mapped: Scan[] = list.map(mapScanFromApi);

  const total = res.data?.pagination?.total ?? mapped.length;
  const respLimit = res.data?.pagination?.limit ?? pageSize;
  const respOffset = res.data?.pagination?.offset ?? offset;
  const currentPage = Math.floor(respOffset / respLimit) + 1;

  return {
    data: mapped,
    pagination: {
      page: currentPage,
      pageSize: respLimit,
      totalItems: total,
      totalPages: Math.ceil(total / respLimit),
    },
  };
}

/**
 * Fetch recent scans (for dashboard)
 */
export async function fetchRecentScans(limit: number = 5): Promise<Scan[]> {
  if (isDemoMode()) {
    return [...demoScans]
      .sort((a, b) => {
        const at = a.startedAt?.getTime() ?? a.createdAt?.getTime() ?? 0;
        const bt = b.startedAt?.getTime() ?? b.createdAt?.getTime() ?? 0;
        return bt - at;
      })
      .slice(0, limit);
  }
  const res = await http.get(`${API_PREFIX}/runs`, { params: { limit, offset: 0 } });
  const list = (res.data?.data || []) as Array<any>;
  return list.map(mapScanFromApi);
}

/**
 * Fetch a single scan by ID
 */
export async function fetchScan(id: string): Promise<Scan | null> {
  if (isDemoMode()) {
    return demoScans.find((s) => s.id === id || s.runId === id) ?? null;
  }
  try {
    const res = await http.get(`${API_PREFIX}/runs/${encodeURIComponent(id)}`);
    const data = res.data?.data ?? res.data;
    if (!data) return null;
    return mapScanFromApi(data);
  } catch {
    return null;
  }
}

/**
 * Create a new scan
 */
export async function createScan(input: NewScanInput): Promise<Scan> {
  if (isDemoMode()) {
    const now = new Date();
    const id = `scan-${Math.random().toString(16).slice(2, 10)}`;
    const scan: Scan = {
      id,
      runId: `run-demo-${Date.now()}`,
      workflowName: input.workflowId,
      workflowKind: input.workflowKind || "flow",
      target:
        input.target ||
        (Array.isArray(input.targets) && input.targets.length > 0 ? input.targets[0] : "") ||
        (input.target_file ?? ""),
      status: input.schedule ? "pending" : "running",
      totalSteps: 0,
      completedSteps: 0,
      triggerType: input.schedule ? "scheduled" : "manual",
      createdAt: now,
      updatedAt: now,
      startedAt: input.schedule ? undefined : now,
    };
    demoScans = [scan, ...demoScans];
    return scan;
  }
  if (input.schedule) {
    const body = {
      name: `scheduled-${input.workflowId}-${Date.now()}`,
      workflow_name: input.workflowId,
      workflow_kind: input.workflowKind === "module" ? "module" : "flow",
      target: input.target || "",
      schedule: input.schedule,
      enabled: true,
    };
    await http.post(`${API_PREFIX}/schedules`, body);
    return {
      id: `scan-${Date.now()}`,
      runId: "",
      workflowName: input.workflowId,
      workflowKind: input.workflowKind || "flow",
      target: input.target || "",
      status: "pending",
      totalSteps: 0,
      completedSteps: 0,
      triggerType: "scheduled",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const body: any = {};
  if (input.workflowId) {
    if (input.workflowKind === "module") body.module = input.workflowId;
    else body.flow = input.workflowId;
  }

  if (typeof input.threads_hold === "number") body.threads_hold = input.threads_hold;
  if (typeof input.heuristics_check === "string" && input.heuristics_check.trim()) {
    body.heuristics_check = input.heuristics_check.trim();
  }
  if (typeof input.repeat === "boolean") body.repeat = input.repeat;
  if (typeof input.repeat_wait_time === "string" && input.repeat_wait_time.trim()) {
    body.repeat_wait_time = input.repeat_wait_time.trim();
  }

  if (input.empty_target) {
    body.empty_target = true;
  }

  if (Array.isArray(input.targets) && input.targets.length > 0) {
    body.targets = input.targets;
    if (typeof input.concurrency === "number") body.concurrency = input.concurrency;
  } else if (input.target_file) {
    body.target_file = input.target_file;
    if (typeof input.concurrency === "number") body.concurrency = input.concurrency;
  } else if (!input.empty_target && input.target) {
    body.target = input.target;
  }
  if (input.params && Object.keys(input.params).length > 0) {
    body.params = input.params;
  }
  if (input.priority) body.priority = input.priority;
  if (typeof input.timeout === "number") body.timeout = input.timeout;
  if (input.runner_type && input.runner_type !== "local") {
    body.runner_type = input.runner_type;
    if (input.runner_type === "docker" && input.docker_image) {
      body.docker_image = input.docker_image;
    }
    if (input.runner_type === "ssh" && input.ssh_host) {
      body.ssh_host = input.ssh_host;
    }
  }

  await http.post(`${API_PREFIX}/runs`, body);

  return {
    id: `scan-${Date.now()}`,
    runId: "",
    workflowName: input.workflowId,
    workflowKind: input.workflowKind || "flow",
    target:
      input.target ||
      (Array.isArray(input.targets) && input.targets.length > 0 ? input.targets[0] : "") ||
      (input.target_file ?? ""),
    status: "running",
    totalSteps: 0,
    completedSteps: 0,
    triggerType: "manual",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Cancel a running scan
 */
export async function cancelScan(id: string): Promise<boolean> {
  if (isDemoMode()) {
    const idx = demoScans.findIndex((s) => s.id === id || s.runId === id);
    if (idx === -1) return false;
    const now = new Date();
    const next = [...demoScans];
    next[idx] = {
      ...next[idx],
      status: "cancelled",
      completedAt: next[idx].completedAt ?? now,
      updatedAt: now,
    };
    demoScans = next;
    return true;
  }
  try {
    await http.delete(`${API_PREFIX}/runs/${encodeURIComponent(id)}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete a scan (same as cancel for now)
 */
export async function deleteScan(id: string): Promise<boolean> {
  return cancelScan(id);
}
