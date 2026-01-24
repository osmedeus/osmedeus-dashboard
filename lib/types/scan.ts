export type ScanStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface Scan {
  id: string;
  runId: string;
  runUuid: string;
  workflowName: string;
  workflowKind: "flow" | "module";
  target: string;
  params?: Record<string, unknown>;
  status: ScanStatus;
  workspace?: string;
  workspacePath?: string;
  startedAt?: Date;
  completedAt?: Date;
  totalSteps: number;
  completedSteps: number;
  triggerType: string;
  triggerName?: string;
  runGroupId?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewScanInput {
  workflowId: string;
  workflowKind?: "flow" | "module";
  workspaceId?: string;
  target?: string;
  empty_target?: boolean;
  targets?: string[];
  target_file?: string;
  concurrency?: number;
  threads_hold?: number;
  heuristics_check?: "basic" | "advanced" | string;
  repeat?: boolean;
  repeat_wait_time?: string;
  params?: Record<string, string>;
  priority?: "low" | "medium" | "high";
  timeout?: number;
  runner_type?: "local" | "docker" | "ssh";
  docker_image?: string;
  ssh_host?: string;
  schedule?: string;
}

export type StepResultStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped"
  | "success"
  | "error"
  | "unknown";

export interface StepResult {
  id: string;
  runId?: number | string;
  runUuid?: string;
  stepName: string;
  stepType: string;
  status: StepResultStatus | string;
  command?: string;
  output?: string;
  error?: string;
  durationMs?: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt?: Date;
}

export interface StepResultsResponse {
  data: StepResult[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}
