"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import type { DbService } from "@/types/service";
import {
  deleteServiceAction,
  featureServiceAction,
  draftServiceAction,
  publishServiceAction,
} from "@/lib/services/actions";
import { SERVICE_ICONS } from "@/constants/services";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/admin/projects/confirm-dialog";
import { formatDateBD } from "@/lib/format/dates";

interface ServiceListProps {
  services: DbService[];
  error: string | null;
}

export function ServiceList({ services, error }: ServiceListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<DbService | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const filtered = React.useMemo(
    () =>
      services.filter((s) =>
        searchQuery
          ? s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.short_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.slug.toLowerCase().includes(searchQuery.toLowerCase())
          : true,
      ),
    [services, searchQuery],
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    const result = await deleteServiceAction(deleteTarget.id);
    if (!result.success) {
      setDeleteError(result.error);
      return;
    }
    setDeleteTarget(null);
    router.refresh();
  }

  async function handleToggleFeatured(service: DbService) {
    const result = await featureServiceAction(service.id, !service.featured);
    if (!result.success) setDeleteError(result.error);
    router.refresh();
  }

  async function handleToggleStatus(service: DbService) {
    const result =
      service.status === "published"
        ? await draftServiceAction(service.id)
        : await publishServiceAction(service.id);
    if (!result.success) setDeleteError(result.error);
    router.refresh();
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-6 text-lg font-semibold">Failed to load services</h3>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">{error}</p>
        <Button variant="outline" className="mt-6 gap-2" onClick={() => router.refresh()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-2xl">
          <Plus className="h-8 w-8" />
        </div>
        <h3 className="mt-6 text-lg font-semibold">No services yet</h3>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">
          Create your first service to showcase what you offer.
        </p>
        <Link href="/admin/services/new" className="mt-6">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Create Service
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Link href="/admin/services/new">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </Link>
      </div>

      {deleteError && (
        <div className="bg-destructive/10 text-destructive rounded-lg border border-red-500/30 px-4 py-3 text-sm">
          {deleteError}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-muted-foreground text-sm">No services match your search.</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {filtered.map((service) => {
            const Icon = SERVICE_ICONS[service.icon] ?? SERVICE_ICONS.bot;
            return (
              <motion.div key={service.id} variants={staggerItem}>
                <Card className="hover:border-primary/30 transition-all duration-200 hover:shadow-sm">
                  <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                    <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold">{service.title}</h3>
                        {service.featured && (
                          <Badge
                            variant="outline"
                            className="border-primary/30 text-primary text-[10px]"
                          >
                            Featured
                          </Badge>
                        )}
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${
                            service.status === "published"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {service.status}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                        {service.short_description}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-[10px]">
                        /{service.slug} · order {service.display_order}
                      </p>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="text-muted-foreground text-[10px]">Updated</p>
                      <p className="text-muted-foreground text-[10px]">
                        {formatDateBD(service.updated_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={service.featured ? "Unfeature" : "Feature"}
                        className={
                          service.featured
                            ? "text-primary"
                            : "text-muted-foreground hover:text-primary"
                        }
                        onClick={() => handleToggleFeatured(service)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={service.status === "published" ? "Move to draft" : "Publish"}
                        onClick={() => handleToggleStatus(service)}
                      >
                        {service.status === "published" ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Link href={`/admin/services/${service.id}/edit`}>
                        <Button variant="ghost" size="icon" aria-label={`Edit ${service.title}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${service.title}`}
                        className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                        onClick={() => setDeleteTarget(service)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <p className="text-muted-foreground text-center text-xs">
        {filtered.length} of {services.length} services
      </p>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete service"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
