"use client";

import * as React from "react";
import { Handle, Position } from "@xyflow/react";
import { BaseNode } from "./base-node";
import type { WorkflowNodeData } from "@/lib/types/workflow";
import { cn } from "@/lib/utils";
import {
  TerminalIcon,
  LayersIcon,
  FunctionSquareIcon,
  RepeatIcon,
  PlayIcon,
  FlagIcon,
  GlobeIcon,
  BrainIcon,
  BoxIcon,
  ZapIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { useCanvasSettings } from "../canvas-settings";

interface CustomNodeProps {
  data: WorkflowNodeData;
  selected?: boolean;
}

type TriggerSummary = {
  title: string;
  lines: string[];
};

function normalizeInlineText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string") as string[];
  if (typeof value === "string") return [value];
  return [];
}

function buildTriggerSummary(trigger: Record<string, unknown>, maxLines: number): TriggerSummary {
  const name = typeof trigger.name === "string" && trigger.name.trim() ? trigger.name.trim() : "trigger";
  const on = typeof trigger.on === "string" ? trigger.on.trim() : "";
  const enabled = typeof trigger.enabled === "boolean" ? trigger.enabled : undefined;
  const titleParts = [name, on ? `(${on})` : "", enabled === false ? "disabled" : ""].filter(Boolean);
  const lines: string[] = [];

  if (on === "cron") {
    const schedule = typeof trigger.schedule === "string" ? trigger.schedule.trim() : "";
    if (schedule) lines.push(`schedule: ${schedule}`);
  }

  if (on === "watch") {
    const path = typeof trigger.path === "string" ? trigger.path.trim() : "";
    if (path) lines.push(`path: ${path}`);
  }

  if (on === "event") {
    const event = trigger.event && typeof trigger.event === "object" ? (trigger.event as Record<string, unknown>) : null;
    const topic = event && typeof event.topic === "string" ? event.topic.trim() : "";
    if (topic) lines.push(`topic: ${topic}`);
    const filters = normalizeStringList(event?.filters);
    filters.forEach((filter) => {
      const text = normalizeInlineText(filter);
      if (text) lines.push(`filter: ${text}`);
    });
    const filterFunctions = normalizeStringList((event as any)?.filterFunctions ?? (event as any)?.filter_functions);
    filterFunctions.forEach((fn) => {
      const text = normalizeInlineText(fn);
      if (text) lines.push(`fn: ${text}`);
    });
  }

  if (!on) {
    const schedule = typeof trigger.schedule === "string" ? trigger.schedule.trim() : "";
    if (schedule) lines.push(`schedule: ${schedule}`);
  }

  if (lines.length > maxLines) {
    const trimmed = lines.slice(0, maxLines);
    trimmed.push(`+${lines.length - maxLines} more`);
    return { title: titleParts.join(" "), lines: trimmed };
  }

  return { title: titleParts.join(" "), lines };
}

// Start Node
export function StartNode({ selected }: CustomNodeProps) {
  return (
    <div className="flex flex-col items-center">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-green-500 !border-2 !border-background !size-3"
      />
      <div
        className={`flex size-12 items-center justify-center rounded-full bg-green-500/20 border-2 border-green-500 ${
          selected ? "ring-2 ring-ring ring-offset-2" : ""
        }`}
      >
        <PlayIcon className="size-5 text-green-600 dark:text-green-400" />
      </div>
      <p className="mt-2 text-xs font-medium text-muted-foreground">Start</p>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-green-500 !border-2 !border-background !size-3"
      />
    </div>
  );
}

// End Node
export function EndNode({ selected }: CustomNodeProps) {
  return (
    <div className="flex flex-col items-center">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-red-500 !border-2 !border-background !size-3"
      />
      <div
        className={`flex size-12 items-center justify-center rounded-full bg-red-500/20 border-2 border-red-500 ${
          selected ? "ring-2 ring-ring ring-offset-2" : ""
        }`}
      >
        <FlagIcon className="size-5 text-red-600 dark:text-red-400" />
      </div>
      <p className="mt-2 text-xs font-medium text-muted-foreground">End</p>
    </div>
  );
}

export function TriggerNode({ data, selected }: CustomNodeProps) {
  const { wrapLongText, showDetails } = useCanvasSettings();
  const triggerSummaries = React.useMemo(() => {
    const triggers = Array.isArray((data as any).triggers)
      ? ((data as any).triggers as Record<string, unknown>[])
      : [];
    return triggers.map((trigger) => buildTriggerSummary(trigger, 5));
  }, [data]);

  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-full bg-amber-500/20 border-2 border-amber-500",
          selected ? "ring-2 ring-ring ring-offset-2" : ""
        )}
      >
        <ZapIcon className="size-5 text-amber-600 dark:text-amber-400" />
      </div>
      <p className="mt-2 text-xs font-medium text-muted-foreground">Triggers</p>
      {showDetails && triggerSummaries.length > 0 && (
        <div className="mt-2 w-[280px] rounded-md border bg-muted/30 px-2 py-2 text-[11px] text-muted-foreground">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Trigger Rules</div>
          <div className="mt-1 space-y-2">
            {triggerSummaries.map((summary, idx) => (
              <div key={`${summary.title}-${idx}`} className="space-y-0.5">
                <div className="text-[11px] font-medium text-foreground/90">{summary.title}</div>
                {summary.lines.length > 0 && (
                  <div
                    className={cn(
                      "space-y-0.5 font-mono",
                      wrapLongText ? "whitespace-pre-wrap break-words" : ""
                    )}
                  >
                    {summary.lines.map((line, lineIdx) => (
                      <div key={`${summary.title}-line-${lineIdx}`} className={wrapLongText ? "" : "truncate"}>
                        {line}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-amber-500 !border-2 !border-background !size-3"
      />
    </div>
  );
}

// Bash Node
export function BashNode({ data, selected }: CustomNodeProps) {
  return (
    <BaseNode
      data={data}
      selected={selected}
      icon={<TerminalIcon className="size-4 text-blue-600 dark:text-blue-400" />}
      color="bg-blue-500/20"
    />
  );
}

// Parallel Node
export function ParallelNode({ data, selected }: CustomNodeProps) {
  return (
    <BaseNode
      data={data}
      selected={selected}
      icon={<LayersIcon className="size-4 text-purple-600 dark:text-purple-400" />}
      color="bg-purple-500/20"
    />
  );
}

// Function Node
export function FunctionNode({ data, selected }: CustomNodeProps) {
  return (
    <BaseNode
      data={data}
      selected={selected}
      icon={<FunctionSquareIcon className="size-4 text-green-600 dark:text-green-400" />}
      color="bg-green-500/20"
    />
  );
}

// Foreach Node
export function ForeachNode({ data, selected }: CustomNodeProps) {
  return (
    <BaseNode
      data={data}
      selected={selected}
      icon={<RepeatIcon className="size-4 text-orange-600 dark:text-orange-400" />}
      color="bg-orange-500/20"
    />
  );
}

export function HttpNode({ data, selected }: CustomNodeProps) {
  return (
    <BaseNode
      data={data}
      selected={selected}
      icon={<GlobeIcon className="size-4 text-cyan-600 dark:text-cyan-400" />}
      color="bg-cyan-500/20"
    />
  );
}

export function LlmNode({ data, selected }: CustomNodeProps) {
  return (
    <BaseNode
      data={data}
      selected={selected}
      icon={<BrainIcon className="size-4 text-pink-600 dark:text-pink-400" />}
      color="bg-pink-500/20"
    />
  );
}

export function ContainerNode({ data, selected }: CustomNodeProps) {
  return (
    <BaseNode
      data={data}
      selected={selected}
      icon={<BoxIcon className="size-4 text-slate-600 dark:text-slate-400" />}
      color="bg-slate-500/20"
    />
  );
}

export function OverrideNode({ data, selected }: CustomNodeProps) {
  return (
    <BaseNode
      data={data}
      selected={selected}
      icon={<SlidersHorizontalIcon className="size-4 text-emerald-600 dark:text-emerald-400" />}
      color="bg-emerald-500/20"
    />
  );
}

// Export node types for React Flow
export const nodeTypes = {
  trigger: TriggerNode,
  start: StartNode,
  end: EndNode,
  bash: BashNode,
  parallel: ParallelNode,
  "parallel-steps": ParallelNode,
  function: FunctionNode,
  foreach: ForeachNode,
  http: HttpNode,
  llm: LlmNode,
  container: ContainerNode,
  "remote-bash": ContainerNode,
  module: ContainerNode,
  override: OverrideNode,
};
