"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  clearSession,
  fetchVendorQuotationById,
  getSession,
  isAuthError,
  submitVendorAvailability,
} from "@/lib/vendorApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useVendorPageHeader } from "@/components/vendorPageHeader";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function QuotationDetailPage() {
  const params = useParams();
  const quotationId = useMemo(() => params?.quotationId, [params]);
  const [data, setData] = useState(null);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");

  useVendorPageHeader({
    title: "Quotation",
    subtitle: data?.customer?.name ? `Customer: ${data.customer.name}` : "Quotation request details",
    meta: data?.customer?.phone ? `Phone: ${data.customer.phone}` : null,
  });

  useEffect(() => {
    const { token } = getSession();
    if (!token || !quotationId) return;
    (async () => {
      try {
        const res = await fetchVendorQuotationById(token, quotationId);
        setData(res);
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
  }, [quotationId]);

  async function mark(itemId, status) {
    const { token } = getSession();
    if (!token) return;
    setSaving(itemId);
    setError("");
    try {
      const result = await submitVendorAvailability(token, quotationId, [
        { item_id: itemId, status, note: notes[itemId] || null },
      ]);
      setData((prev) => ({ ...prev, items: result.items }));
    } catch (err) {
      if (isAuthError(err)) {
        clearSession();
        window.location.href = "/login";
        return;
      }
      setError(err.message || "Update failed");
    } finally {
      setSaving("");
    }
  }

  return (
    <div className="space-y-4">
      <Link href="/quotations" className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline">
        <ArrowLeft className="size-4" />
        Back to quotations
      </Link>

      {error ? <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <Card>
          <CardContent className="text-sm text-slate-500">Loading...</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(data?.items || []).map((item) => {
            const last = item.availability?.status ? String(item.availability.status) : "";
            const badge =
              last === "available" ? "success" : last === "not_available" ? "danger" : "neutral";
            return (
              <Card key={item.item_id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle>{item.name}</CardTitle>
                    <p className="text-xs text-slate-500">
                      {item.journey_title || item.category_label || "-"} · Qty {item.quantity || 1}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{money(item.final_price || item.price)}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={badge}>{last || "pending"}</Badge>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.availability ? `by ${item.availability.actor}` : "Awaiting decision"}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={notes[item.item_id] || ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [item.item_id]: e.target.value }))}
                    placeholder="Optional note"
                  />
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" disabled={saving === item.item_id} onClick={() => mark(item.item_id, "available")}>
                      <CheckCircle2 className="size-4" />
                      {saving === item.item_id ? "Saving..." : "Confirm available"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={saving === item.item_id}
                      onClick={() => mark(item.item_id, "not_available")}
                    >
                      <XCircle className="size-4" />
                      Not available
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
