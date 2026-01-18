"use client";

import * as React from "react";
import { Handle, Position } from "@xyflow/react";
import { BaseNode } from "./base-node";
import type { WorkflowNodeData } from "@/lib/types/workflow";
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
} from "lucide-react";

interface CustomNodeProps {
  data: WorkflowNodeData;
  selected?: boolean;
}

// Start Node
export function StartNode({ selected }: CustomNodeProps) {
  return (
    <div className="flex flex-col items-center">
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

// Export node types for React Flow
export const nodeTypes = {
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
};
