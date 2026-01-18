"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { HttpAssetFilters } from "@/lib/types/asset";
import {
  BlocksIcon,
  SearchIcon,
  HashIcon,
  XIcon,
  FilterIcon,
  ChevronDownIcon,
  ChevronsUpDownIcon,
} from "lucide-react";
import {
  ALL_TECHNOLOGIES,
  CONTENT_TYPE_OPTIONS,
  TLS_VERSION_OPTIONS,
} from "@/lib/constants/tech-categories";
import { cn } from "@/lib/utils";

interface AssetFiltersProps {
  filters: HttpAssetFilters;
  onFiltersChange: (filters: HttpAssetFilters) => void;
}

const statusCodeOptions = [
  { value: 200, label: "200 OK" },
  { value: 301, label: "301 Redirect" },
  { value: 302, label: "302 Found" },
  { value: 403, label: "403 Forbidden" },
  { value: 404, label: "404 Not Found" },
  { value: 500, label: "500 Server Error" },
];

export function AssetFilters({ filters, onFiltersChange }: AssetFiltersProps) {
  const [searchValue, setSearchValue] = React.useState(filters.search ?? "");
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);
  const [techSearch, setTechSearch] = React.useState("");

  const primaryTriggerClassName = "h-9 justify-between min-w-[140px]";

  // Count active filters
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.statusCodes?.length) count++;
    if (filters.technologies?.length) count++;
    if (filters.contentTypes?.length) count++;
    if (filters.tlsVersion) count++;
    if (filters.location) count++;
    return count;
  }, [filters]);

  const applySearch = () => {
    if (searchValue !== filters.search) {
      onFiltersChange({ ...filters, search: searchValue || undefined });
    }
  };

  const handleStatusCodeToggle = (statusCode: number) => {
    const current = filters.statusCodes ?? [];
    const updated = current.includes(statusCode)
      ? current.filter((c) => c !== statusCode)
      : [...current, statusCode];
    const normalized = updated
      .filter((c, i) => updated.indexOf(c) === i)
      .sort((a, b) => a - b);
    onFiltersChange({
      ...filters,
      statusCodes: normalized.length > 0 ? normalized : undefined,
    });
  };

  const handleTechToggle = (tech: string) => {
    const current = filters.technologies ?? [];
    const updated = current.includes(tech)
      ? current.filter((t) => t !== tech)
      : [...current, tech];
    onFiltersChange({
      ...filters,
      technologies: updated.length > 0 ? updated : undefined,
    });
  };

  const handleContentTypeToggle = (contentType: string) => {
    const current = filters.contentTypes ?? [];
    const updated = current.includes(contentType)
      ? current.filter((t) => t !== contentType)
      : [...current, contentType];
    onFiltersChange({
      ...filters,
      contentTypes: updated.length > 0 ? updated : undefined,
    });
  };

  const handleTlsChange = (value: string) => {
    onFiltersChange({
      ...filters,
      tlsVersion: value === "all" ? undefined : value,
    });
  };

  const handleClearFilters = () => {
    setSearchValue("");
    onFiltersChange({});
  };

  const filteredTechnologies = React.useMemo(() => {
    if (!techSearch) return ALL_TECHNOLOGIES;
    const search = techSearch.toLowerCase();
    return ALL_TECHNOLOGIES.filter((tech) =>
      tech.toLowerCase().includes(search)
    );
  }, [techSearch]);

  const hasAdvancedFilters =
    (filters.technologies?.length ?? 0) > 0 ||
    (filters.contentTypes?.length ?? 0) > 0 ||
    filters.tlsVersion ||
    filters.location;

  // Auto-open advanced section if there are advanced filters active
  React.useEffect(() => {
    if (hasAdvancedFilters && !isAdvancedOpen) {
      setIsAdvancedOpen(true);
    }
  }, [hasAdvancedFilters, isAdvancedOpen]);

  return (
    <div className="space-y-3">
      {/* Primary Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search URL, title, or host..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch();
            }}
            onBlur={applySearch}
            className="pl-9 h-9"
          />
        </div>

        {/* Status Code Multi-Select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                primaryTriggerClassName,
                (filters.statusCodes?.length ?? 0) > 0 && "border-primary"
              )}
            >
              <span className="flex items-center gap-2">
                <HashIcon className="size-4" />
                <span>Status Codes</span>
                {(filters.statusCodes?.length ?? 0) > 0 && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                    {filters.statusCodes?.length}
                  </Badge>
                )}
              </span>
              <ChevronsUpDownIcon className="size-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-2" align="start">
            <div className="space-y-1">
              {statusCodeOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-muted cursor-pointer text-sm"
                >
                  <Checkbox
                    checked={filters.statusCodes?.includes(option.value) ?? false}
                    onCheckedChange={() => handleStatusCodeToggle(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {(filters.statusCodes?.length ?? 0) > 0 && (
              <div className="pt-2 mt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8"
                  onClick={() => onFiltersChange({ ...filters, statusCodes: undefined })}
                >
                  Clear selection
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Technology Multi-Select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                primaryTriggerClassName,
                (filters.technologies?.length ?? 0) > 0 && "border-primary"
              )}
            >
              <span className="flex items-center gap-2">
                <BlocksIcon className="size-4" />
                <span>Technologies</span>
                {(filters.technologies?.length ?? 0) > 0 && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                    {filters.technologies?.length}
                  </Badge>
                )}
              </span>
              <ChevronsUpDownIcon className="size-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-0" align="start">
            <div className="p-2 border-b">
              <Input
                placeholder="Search technologies..."
                value={techSearch}
                onChange={(e) => setTechSearch(e.target.value)}
                className="h-8"
              />
            </div>
            <ScrollArea className="h-[240px]">
              <div className="p-2 space-y-1">
                {filteredTechnologies.map((tech) => (
                  <label
                    key={tech}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-muted cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={filters.technologies?.includes(tech) ?? false}
                      onCheckedChange={() => handleTechToggle(tech)}
                    />
                    <span className="capitalize">{tech}</span>
                  </label>
                ))}
                {filteredTechnologies.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No technologies found
                  </p>
                )}
              </div>
            </ScrollArea>
            {(filters.technologies?.length ?? 0) > 0 && (
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8"
                  onClick={() =>
                    onFiltersChange({ ...filters, technologies: undefined })
                  }
                >
                  Clear selection
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Advanced Filters Toggle */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                primaryTriggerClassName,
                hasAdvancedFilters && "border-primary"
              )}
            >
              <span className="flex items-center gap-2">
                <FilterIcon className="size-4" />
                <span>More</span>
              </span>
              <ChevronDownIcon
                className={cn(
                  "size-4 transition-transform",
                  isAdvancedOpen && "rotate-180"
                )}
              />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>

        {/* Filter Count & Clear */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-9 gap-1 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-4" />
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Advanced Filters Row (Collapsible) */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleContent>
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
            {/* Content Type Multi-Select */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-9 justify-between min-w-[140px]",
                    (filters.contentTypes?.length ?? 0) > 0 && "border-primary"
                  )}
                >
                  <span className="flex items-center gap-2">
                    Content Type
                    {(filters.contentTypes?.length ?? 0) > 0 && (
                      <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                        {filters.contentTypes?.length}
                      </Badge>
                    )}
                  </span>
                  <ChevronsUpDownIcon className="size-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-2" align="start">
                <div className="space-y-1">
                  {CONTENT_TYPE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-muted cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={
                          filters.contentTypes?.includes(option.value) ?? false
                        }
                        onCheckedChange={() =>
                          handleContentTypeToggle(option.value)
                        }
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                {(filters.contentTypes?.length ?? 0) > 0 && (
                  <div className="pt-2 mt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8"
                      onClick={() =>
                        onFiltersChange({ ...filters, contentTypes: undefined })
                      }
                    >
                      Clear selection
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* TLS Version Filter */}
            <Select
              value={filters.tlsVersion ?? "all"}
              onValueChange={handleTlsChange}
            >
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="TLS Version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All TLS Versions</SelectItem>
                {TLS_VERSION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Location Filter */}
            <div className="relative min-w-[200px]">
              <Input
                placeholder="Filter by redirect location..."
                value={filters.location ?? ""}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    location: e.target.value || undefined,
                  })
                }
                className="h-9"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Active Technology Badges */}
      {(filters.technologies?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.technologies?.map((tech) => (
            <Badge
              key={tech}
              variant="secondary"
              className="gap-1 pr-1 capitalize"
            >
              {tech}
              <button
                onClick={() => handleTechToggle(tech)}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
