"use client";

import * as React from "react";
import { TableHead } from "@/components/ui/table";
import { ArrowUpIcon, ArrowDownIcon, ArrowUpDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortDirection } from "@/lib/types/asset";

interface SortableTableHeadProps {
  children: React.ReactNode;
  field: string;
  currentSort: { field: string | null; direction: SortDirection };
  onSort: (field: string) => void;
  className?: string;
}

export function SortableTableHead({
  children,
  field,
  currentSort,
  onSort,
  className,
}: SortableTableHeadProps) {
  const isActive = currentSort.field === field;
  const contentAlignClass = React.useMemo(() => {
    if (!className) return "justify-start";
    if (className.includes("text-center")) return "justify-center";
    if (className.includes("text-right")) return "justify-end";
    return "justify-start";
  }, [className]);

  return (
    <TableHead
      className={cn(
        "cursor-pointer select-none hover:bg-muted/50 transition-colors",
        className
      )}
      onClick={() => onSort(field)}
    >
      <div className={cn("flex items-center gap-1", contentAlignClass)}>
        {children}
        {isActive ? (
          currentSort.direction === "asc" ? (
            <ArrowUpIcon className="size-3.5 text-foreground" />
          ) : (
            <ArrowDownIcon className="size-3.5 text-foreground" />
          )
        ) : (
          <ArrowUpDownIcon className="size-3.5 text-muted-foreground/50" />
        )}
      </div>
    </TableHead>
  );
}
