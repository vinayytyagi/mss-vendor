"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { clearSession, deleteVendorItem, fetchVendorItems, getSession, isAuthError } from "@/lib/vendorApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useVendorPageHeader } from "@/components/vendorPageHeader";
import { PlusCircle } from "lucide-react";
import { RowActions } from "@/components/ui/row-actions";
import { Pencil, Trash2 } from "lucide-react";
import { Select } from "@/components/ui/select";

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function catalogueReviewBadge(it) {
  const a = it?.listing_admin_approval;
  const p = it?.pending_listing;
  if (a === "rejected") return { label: "Rejected", variant: "danger" };
  if (a === "pending" && !p) return { label: "Awaiting approval", variant: "warning" };
  if ((a === "approved" || a === undefined) && p && typeof p === "object") {
    return { label: "Edit pending review", variant: "warning" };
  }
  if (a === "approved" || a === undefined) return { label: "Live", variant: "success" };
  return { label: String(a || "—"), variant: "neutral" };
}

export default function VendorItemsPage() {
  useVendorPageHeader({
    title: "Listings",
    subtitle: "Create, search and manage your listings.",
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [city, setCity] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const selectAllRef = useRef(null);

  useEffect(() => {
    const { token } = getSession();
    if (!token) return;
    (async () => {
      try {
        const data = await fetchVendorItems(token, { limit: "100" });
        setRows(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        if (isAuthError(err)) {
          clearSession();
          window.location.href = "/login";
          return;
        }
        setError(err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = rows.filter((it) => {
    const text = `${it?.name ?? ""} ${it?.item_id ?? ""} ${it?.item_type ?? ""} ${it?.location_city ?? ""}`.toLowerCase();
    if (q.trim() && !text.includes(q.trim().toLowerCase())) return false;
    if (type !== "all" && String(it?.item_type ?? "").toLowerCase() !== type) return false;
    if (city !== "all" && String(it?.location_city ?? "").toLowerCase() !== city) return false;
    if (status !== "all" && String(it?.status ?? "").toLowerCase() !== status) return false;
    return true;
  });

  const unique = (arr) => Array.from(new Set(arr.filter(Boolean)));
  const typeOptions = unique(rows.map((r) => String(r?.item_type ?? "").trim()).filter((v) => v && v !== "—")).sort();
  const cityOptions = unique(rows.map((r) => String(r?.location_city ?? "").trim()).filter((v) => v && v !== "—")).sort();
  const statusOptions = unique(rows.map((r) => String(r?.status ?? "").trim()).filter((v) => v && v !== "—")).sort();

  const typeSelectOptions = useMemo(
    () => [{ value: "all", label: "All Types" }, ...typeOptions.map((v) => ({ value: v.toLowerCase(), label: v }))],
    [typeOptions]
  );
  const citySelectOptions = useMemo(
    () => [{ value: "all", label: "All Cities" }, ...cityOptions.map((v) => ({ value: v.toLowerCase(), label: v }))],
    [cityOptions]
  );
  const statusSelectOptions = useMemo(
    () => [{ value: "all", label: "All Status" }, ...statusOptions.map((v) => ({ value: v.toLowerCase(), label: v }))],
    [statusOptions]
  );

  const filteredIds = useMemo(() => filtered.map((it) => String(it?.item_id ?? "")).filter(Boolean), [filtered]);
  const selectedCount = useMemo(() => filteredIds.reduce((acc, id) => acc + (selectedIds.has(id) ? 1 : 0), 0), [filteredIds, selectedIds]);
  const allSelected = filteredIds.length > 0 && selectedCount === filteredIds.length;
  const someSelected = selectedCount > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);

  async function handleDeleteIds(ids) {
    const { token } = getSession();
    if (!token) return;
    if (!ids.length) return;
    const ok = window.confirm(`Delete ${ids.length} listing(s)? This cannot be undone.`);
    if (!ok) return;

    try {
      await Promise.all(ids.map((id) => deleteVendorItem(token, id)));
      setRows((prev) => prev.filter((r) => !ids.includes(String(r?.item_id ?? ""))));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    } catch (err) {
      if (isAuthError(err)) {
        clearSession();
        window.location.href = "/login";
        return;
      }
      setError(err.message || "Delete failed");
    }
  }

  function toggleOne(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(checked) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) filteredIds.forEach((id) => next.add(id));
      else filteredIds.forEach((id) => next.delete(id));
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {error ? <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <Card className="overflow-hidden">
        <CardHeader className="bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base">Your listings</CardTitle>
              <Badge variant="neutral">{loading ? "…" : `${filtered.length} shown`}</Badge>
              {selectedCount ? <Badge variant="purple">{selectedCount} selected</Badge> : null}
            </div>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              {selectedCount ? (
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  type="button"
                  onClick={() => handleDeleteIds(filteredIds.filter((id) => selectedIds.has(id)))}
                >
                  <Trash2 className="size-4" />
                  Delete selected
                </Button>
              ) : null}
              <div className="min-w-[220px] flex-1 sm:max-w-[320px]">
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
              </div>

              <Select value={type} onValueChange={setType} options={typeSelectOptions} align="end" />

              <Select value={city} onValueChange={setCity} options={citySelectOptions} align="end" />

              <Select value={status} onValueChange={setStatus} options={statusSelectOptions} align="end" />

              <Button asChild size="sm" className="gap-2">
                <Link href="/items/new" className="inline-flex items-center gap-2 cursor-pointer">
                  <PlusCircle className="size-4" />
                  Add Listing
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead className="w-10">
                  <input
                    ref={selectAllRef}
                    aria-label="Select all"
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer rounded border-slate-300"
                    checked={allSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Catalogue</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="w-12 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell className="py-10 text-slate-500" colSpan={8}>
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell className="py-10 text-slate-500" colSpan={8}>
                    No listings yet.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((it) => (
                  (() => {
                    const id = String(it?.item_id ?? "");
                    const checked = id ? selectedIds.has(id) : false;
                    return (
                  <TableRow key={it.item_id}>
                    <TableCell>
                      <input
                        aria-label={`Select ${it.name || "listing"}`}
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer rounded border-slate-300"
                        checked={checked}
                        onChange={() => (id ? toggleOne(id) : null)}
                        disabled={!id}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">{it.name || "Untitled"}</div>
                      <div className="text-xs text-slate-500">ID: {it.item_id}</div>
                    </TableCell>
                    <TableCell className="text-slate-700">{it.item_type || "Item"}</TableCell>
                    <TableCell className="text-slate-700">{it.location_city || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={String(it.status || "") === "Active" ? "success" : "neutral"}>{it.status || "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const b = catalogueReviewBadge(it);
                        return <Badge variant={b.variant}>{b.label}</Badge>;
                      })()}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-900">{money(it.price || 0)}</TableCell>
                    <TableCell className="text-right">
                      <RowActions
                        items={[
                          {
                            key: "edit",
                            label: "Edit",
                            icon: Pencil,
                            disabled: true,
                            onSelect: () => {},
                          },
                          {
                            key: "delete",
                            label: "Delete",
                            icon: Trash2,
                            danger: true,
                            onSelect: () => handleDeleteIds([id]),
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                    );
                  })()
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

