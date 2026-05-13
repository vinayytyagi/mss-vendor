"use client";

import { useEffect, useState } from "react";
import { clearSession, fetchVendorOrders, getSession, isAuthError } from "@/lib/vendorApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useVendorPageHeader } from "@/components/vendorPageHeader";
import { ArrowUpRight } from "lucide-react";

function fmt(dt) {
  return dt ? new Date(dt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-";
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function OrdersPage() {
  useVendorPageHeader({
    title: "Orders",
    subtitle: "Only orders that include your listings.",
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const { token } = getSession();
    if (!token) return;
    (async () => {
      try {
        const data = await fetchVendorOrders(token, { limit: "100" });
        setRows(Array.isArray(data.orders) ? data.orders : []);
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
      {error ? <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <Card className="overflow-hidden">
        <CardHeader className="bg-surface">
          <CardTitle className="text-base">Recent orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Your total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell className="py-10 text-slate-500" colSpan={6}>
                    Loading...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell className="py-10 text-slate-500" colSpan={6}>
                    No orders yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((o) => (
                  <TableRow key={o.order_id}>
                    <TableCell className="font-semibold text-slate-900">{o.order_number || `#${o.order_id}`}</TableCell>
                    <TableCell className="whitespace-nowrap text-slate-600">{fmt(o.created_at)}</TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">{o.customer?.name || "Customer"}</div>
                      <div className="text-xs text-slate-500">{o.customer?.phone || "-"}</div>
                    </TableCell>
                    <TableCell className="tabular-nums text-slate-700">{Array.isArray(o.items) ? o.items.length : 0}</TableCell>
                    <TableCell className="text-slate-700">{o.status || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="purple">{money(o.vendor_total)}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <a href="#" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
          Export
          <ArrowUpRight className="size-4" />
        </a>
      </div>
    </div>
  );
}

