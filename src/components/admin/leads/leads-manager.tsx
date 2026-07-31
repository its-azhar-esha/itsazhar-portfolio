"use client";

import * as React from "react";
import { Inbox, Mail, Phone, Search, Trash2, Users } from "lucide-react";
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
    if (lead.status === next) return;
    const result = await updateLeadStatusAction(lead.id, { status: next });
    if (result.success) {
      setItems((prev) => prev.map((l) => (l.id === lead.id ? result.data : l)));
    } else {
      setError(result.error);
    }
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
            <div
              key={lead.id}
              className="border-border/40 hover:bg-accent/40 flex flex-col gap-3 border-b p-4 transition-colors last:border-b-0 sm:flex-row sm:items-center"
            >
              <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                <Users className="text-primary h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{lead.name}</p>
                  <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[lead.status]}`}>
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
              <div className="flex items-center gap-2">
                <select
                  value={lead.status}
                  onChange={(e) => handleStatusChange(lead, e.target.value as LeadStatus)}
                  className="border-border/40 bg-background hover:bg-accent/50 h-8 rounded-md border px-2 text-xs capitalize transition-colors outline-none"
                  aria-label={`Change status for ${lead.name}`}
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setDeleteTarget(lead)}
                  aria-label={`Delete lead from ${lead.name}`}
                >
                  <Trash2 className="text-destructive h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
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
