"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/lib/utils";
import type { HttpAsset } from "@/lib/types/asset";
import {
  GlobeIcon,
  ServerIcon,
  ShieldIcon,
  CodeIcon,
  ClockIcon,
  ExternalLinkIcon,
} from "lucide-react";

interface AssetDetailDialogProps {
  asset: HttpAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getStatusBadgeVariant(
  statusCode: number
): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" {
  if (statusCode >= 200 && statusCode < 300) return "success";
  if (statusCode >= 300 && statusCode < 400) return "warning";
  if (statusCode >= 400 && statusCode < 500) return "outline";
  if (statusCode >= 500) return "destructive";
  return "secondary";
}

export function AssetDetailDialog({
  asset,
  open,
  onOpenChange,
}: AssetDetailDialogProps) {
  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GlobeIcon className="size-5" />
            Asset Details
          </DialogTitle>
          <DialogDescription className="font-mono text-xs break-all">
            {asset.url}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <GlobeIcon className="size-4" />
              Overview
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Asset Value</p>
                <p className="font-mono">{asset.assetValue || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Workspace</p>
                <p>{asset.workspace || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">URL</p>
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-primary hover:underline flex items-center gap-1 break-all"
                >
                  {asset.url}
                  <ExternalLinkIcon className="size-3 shrink-0" />
                </a>
              </div>
            </div>
          </section>

          {/* HTTP Request */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <CodeIcon className="size-4" />
              HTTP Request
            </h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Method</p>
                <Badge variant="outline">{asset.method}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Scheme</p>
                <p>{asset.scheme || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Path</p>
                <p className="font-mono text-xs">{asset.path || "/"}</p>
              </div>
            </div>
          </section>

          {/* HTTP Response */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">HTTP Response</h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Status Code</p>
                <Badge variant={getStatusBadgeVariant(asset.statusCode)}>
                  {asset.statusCode}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Content Type</p>
                <p className="text-xs">{asset.contentType || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Content Length</p>
                <p>{formatBytes(asset.contentLength)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Title</p>
                <p className="truncate">{asset.title || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Words</p>
                <p>{asset.words.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Lines</p>
                <p>{asset.lines.toLocaleString()}</p>
              </div>
            </div>
          </section>

          {/* Network */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ServerIcon className="size-4" />
              Network
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Host IP</p>
                <p className="font-mono">{asset.hostIp || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">TLS</p>
                <p>{asset.tls || "-"}</p>
              </div>
              {asset.aRecords.length > 0 && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">DNS A Records</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {asset.aRecords.map((ip, i) => (
                      <Badge key={i} variant="outline" className="font-mono text-xs">
                        {ip}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Detection */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ShieldIcon className="size-4" />
              Detection
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Asset Type</p>
                <Badge variant="secondary">{asset.assetType}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Source</p>
                <p>{asset.source || "-"}</p>
              </div>
              {asset.technologies.length > 0 && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Technologies</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {asset.technologies.map((tech, i) => (
                      <Badge key={i} variant="outline">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Meta */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ClockIcon className="size-4" />
              Meta
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Response Time</p>
                <p>{asset.responseTime || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Remarks</p>
                <p>{asset.remarks || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="text-xs">{asset.createdAt.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Updated</p>
                <p className="text-xs">{asset.updatedAt.toLocaleString()}</p>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
