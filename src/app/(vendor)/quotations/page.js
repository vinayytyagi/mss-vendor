"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearSession, fetchVendorQuotations, getSession, isAuthError } from "@/lib/vendorApi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useVendorPageHeader } from "@/components/vendorPageHeader";
import { ArrowUpRight } from "lucide-react";

function fmt(dt) {
  return dt ? new Date(dt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-";
}

export default function QuotationsPage() {
  useVendorPageHeader({
    title: "Quotations",
    subtitle: "Only your selected items are visible. Customer contact is masked.",
  });

  const [rows, setRows] = useState([]);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { token } = getSession();
    if (!token) return;
    (async () => {
      try {
        const data = await fetchVendorQuotations(token);
        setRows(Array.isArray(data.quotations) ? data.quotations : []);
        setRequiresApproval(Boolean(data.requiresApproval));
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

  return (
    <div className="space-y-4">
      {requiresApproval ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Your account is pending admin approval. Quotations will appear after activation.
        </div>
      ) : null}
      {error ? <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <Card className="overflow-hidden">
        <CardHeader className="bg-surface">
          <CardTitle className="text-base">Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead>Created</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Your items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell className="py-8 text-slate-500" colSpan={5}>
                    Loading...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell className="py-10 text-slate-500" colSpan={5}>
                    No quotation requests.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.quotation_request_id}>
                    <TableCell className="whitespace-nowrap text-slate-600">{fmt(r.created_at)}</TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">{r.customer?.name || "Customer"}</div>
                      <div className="text-xs text-slate-500">{r.customer?.phone || "-"}</div>
                    </TableCell>
                    <TableCell className="font-medium tabular-nums text-slate-900">{r.my_items_count || 0}</TableCell>
                    <TableCell>
                      <Badge variant="neutral">{r.email_status || "-"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/quotations/${r.quotation_request_id}`}
                        className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline"
                      >
                        Open
                        <ArrowUpRight className="size-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
