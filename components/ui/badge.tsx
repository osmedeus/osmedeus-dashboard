import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow",
        outline: "text-foreground",
        success:
          "border-transparent bg-green-500/15 text-green-700 dark:text-green-400",
        warning:
          "border-transparent bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
        info:
          "border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-400",
        purple:
          "border-transparent bg-purple-500/15 text-purple-700 dark:text-purple-400",
        pink:
          "border-transparent bg-pink-500/15 text-pink-700 dark:text-pink-400",
        cyan:
          "border-transparent bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
        orange:
          "border-transparent bg-orange-500/15 text-orange-700 dark:text-orange-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
