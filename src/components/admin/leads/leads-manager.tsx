"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Inbox, Mail, Phone, Search, Trash2, Users, X } from "lucide-react";
import { getLeadsAction, updateLeadStatusAction, deleteLeadAction } from "@/lib/leads/actions";
import { LEAD_STATUSES } from "@/types/lead";
import type { Lead, LeadStatus } from "@/types/lead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/admin/projects/confirm-dialog";

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  contacted: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  closed: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
};

const PAGE_SIZE = 20;

function LeadDetailDialog({
  lead,
  onClose,
  onStatusChange,
  onDelete,
}: {
  lead: Lead | null;
  onClose: () => void;
  onStatusChange: (lead: Lead, next: LeadStatus) => Promise<void>;
  onDelete: (lead: Lead) => void;
}) {
  const [updating, setUpdating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleStatusChange(next: LeadStatus) {
    if (!lead || lead.status === next) return;
    setUpdating(true);
    setError(null);
    try {
      await onStatusChange(lead, next);
    } catch {
      setError("Could not update the lead status.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <AnimatePresence>
      {lead && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="border-border/50 bg-background fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={`Lead from ${lead.name}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Users className="text-primary h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">{lead.name}</h3>
                  <p className="text-muted-foreground text-xs">
                    Received {new Date(lead.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-[10px] capitalize ${STATUS_STYLES[lead.status]}`}
              >
                {lead.status}
              </Badge>
              <span className="text-muted-foreground text-[11px]">via {lead.source}</span>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <a
                href={`mailto:${lead.email}`}
                className="text-primary inline-flex items-center gap-2 hover:underline"
              >
                <Mail className="h-4 w-4" /> {lead.email}
              </a>
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" /> {lead.phone}
                </a>
              )}
              {lead.message && (
                <div className="border-border/40 bg-muted/40 rounded-lg border p-3">
                  <p className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-wide uppercase">
                    Message
                  </p>
                  <p className="leading-relaxed whitespace-pre-wrap">{lead.message}</p>
                </div>
              )}
              <div className="text-muted-foreground text-xs">
                Last updated {new Date(lead.updated_at).toLocaleString()}
              </div>
            </div>

            {error && <p className="text-destructive mt-4 text-xs">{error}</p>}

            <div className="mt-6 flex items-center justify-between gap-3 border-t pt-4">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">Status</span>
                <select
                  value={lead.status}
                  disabled={updating}
                  onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                  className="border-border/40 bg-background hover:bg-accent/50 h-8 rounded-md border px-2 text-xs capitalize transition-colors outline-none"
                  aria-label={`Change status for ${lead.name}`}
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-muted-foreground"
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(lead)}
                  className="text-red-500 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function LeadsManager() {
  const [items, setItems] = React.useState<Lead[]>([]);
  const [count, setCount] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState<"all" | LeadStatus>("all");
  const [search, setSearch] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Lead | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Lead | null>(null);

  async function fetchLeads() {
    setLoading(true);
    setError(null);
    const result = await getLeadsAction({
      search,
      status: statusFilter,
      page,
      pageSize: PAGE_SIZE,
    });
    if (result.success) {
      setItems(result.data.items);
      setCount(result.data.count);
      setPageCount(result.data.pageCount);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  React.useEffect(() => {
    let cancelled = false;
    getLeadsAction({ search, status: statusFilter, page, pageSize: PAGE_SIZE }).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setItems(result.data.items);
        setCount(result.data.count);
        setPageCount(result.data.pageCount);
      } else {
        setError(result.error);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [search, statusFilter, page]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  async function handleStatusChange(lead: Lead, next: LeadStatus) {
    const result = await updateLeadStatusAction(lead.id, { status: next });
    if (result.success) {
      const updated = result.data;
      setItems((prev) => prev.map((l) => (l.id === lead.id ? updated : l)));
      setSelected((prev) => (prev?.id === lead.id ? updated : prev));
    } else {
      setError(result.error);
    }
  }

  function handleDeleteClick(lead: Lead) {
    setSelected(null);
    setDeleteTarget(lead);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const result = await deleteLeadAction(deleteTarget.id);
    setDeleteTarget(null);
    if (result.success) {
      fetchLeads();
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search name, email, message..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", ...LEAD_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "border-primary/50 bg-primary/15 text-foreground"
                  : "border-border/60 text-muted-foreground hover:bg-accent/50"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-muted h-16 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Inbox className="text-muted-foreground h-8 w-8" />
          <p className="text-muted-foreground mt-3 text-sm">
            {search || statusFilter !== "all"
              ? "No leads match your filters."
              : "No leads yet. Leads from the 'Book a Free Audit' form on the contact page appear here."}
          </p>
        </div>
      ) : (
        <div className="border-border/40 overflow-hidden rounded-lg border">
          {items.map((lead) => (
            <button
              key={lead.id}
              onClick={() => setSelected(lead)}
              className="border-border/40 hover:bg-accent/40 flex w-full flex-col gap-3 border-b p-4 text-left transition-colors last:border-b-0 sm:flex-row sm:items-center"
            >
              <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                <Users className="text-primary h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{lead.name}</p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] capitalize ${STATUS_STYLES[lead.status]}`}
                  >
                    {lead.status}
                  </Badge>
                  <span className="text-muted-foreground text-[11px]">
                    {new Date(lead.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {lead.email}
                  </span>
                  {lead.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {lead.phone}
                    </span>
                  )}
                  <span className="text-muted-foreground/60">via {lead.source}</span>
                </div>
                {lead.message && (
                  <p className="text-muted-foreground mt-1.5 line-clamp-2 text-xs">
                    {lead.message}
                  </p>
                )}
              </div>
              <span className="text-muted-foreground/50 text-[11px] font-medium uppercase sm:pr-1">
                View →
              </span>
            </button>
          ))}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs">
            {count} {count === 1 ? "lead" : "leads"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="text-muted-foreground text-xs">
              Page {page} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <LeadDetailDialog
        lead={selected}
        onClose={() => setSelected(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteClick}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete lead?"
        description={
          deleteTarget
            ? `This will permanently delete the lead from ${deleteTarget.name} (${deleteTarget.email}).`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
