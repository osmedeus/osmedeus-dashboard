"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Variant = "default" | "outline" | "ghost";
type Size = "sm" | "icon";

export function ThemeToggle({
  variant = "ghost",
  size = "icon",
  className,
  ariaLabel = "Toggle theme",
  label,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
  ariaLabel?: string;
  label?: string;
}) {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant={variant} size={size} className={className} aria-label={ariaLabel}>
        <SunIcon className="size-4" />
        {label ? <span className="text-xs ml-2">{label}</span> : null}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      aria-label={ariaLabel}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <MoonIcon className="size-4" />
      ) : (
        <SunIcon className="size-4" />
      )}
      {label ? <span className="text-xs ml-2">{label}</span> : null}
    </Button>
  );
}
