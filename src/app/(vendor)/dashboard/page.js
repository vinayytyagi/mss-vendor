"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  clearSession,
  fetchVendorMe,
  fetchVendorOrders,
  fetchVendorQuotations,
  getSession,
  isAuthError,
} from "@/lib/vendorApi";
import { useVendorPageHeader } from "@/components/vendorPageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function dayKey(d) {
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function DashboardPage() {
  useVendorPageHeader({
    title: "Dashboard",
    subtitle: "Vendor overview and quotation queue.",
  });

  const [status, setStatus] = useState("");
  const [quotationCount, setQuotationCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [vendorRevenue, setVendorRevenue] = useState(0);
  const [series, setSeries] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const { token } = getSession();
    if (!token) return;
    (async () => {
      try {
        const [me, list, ordersRes] = await Promise.all([
          fetchVendorMe(token),
          fetchVendorQuotations(token),
          fetchVendorOrders(token, { limit: "200" }),
        ]);
        setStatus(me?.vendor?.status || "");
        setQuotationCount(Array.isArray(list?.quotations) ? list.quotations.length : 0);

        const orders = Array.isArray(ordersRes?.orders) ? ordersRes.orders : [];
        setOrderCount(orders.length);
        const rev = orders.reduce((sum, o) => sum + (Number(o.vendor_total) || 0), 0);
        setVendorRevenue(rev);

        const days = 14;
        const end = new Date();
        end.setHours(0, 0, 0, 0);
        const start = new Date(end);
        start.setDate(start.getDate() - (days - 1));

        const quotationMap = new Map();
        (Array.isArray(list?.quotations) ? list.quotations : []).forEach((q) => {
          const k = q?.created_at ? dayKey(q.created_at) : null;
          if (!k) return;
          quotationMap.set(k, (quotationMap.get(k) || 0) + 1);
        });

        const revenueMap = new Map();
        orders.forEach((o) => {
          const k = o?.created_at ? dayKey(o.created_at) : null;
          if (!k) return;
          revenueMap.set(k, (revenueMap.get(k) || 0) + (Number(o.vendor_total) || 0));
        });

        const points = [];
        for (let i = 0; i < days; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const k = dayKey(d);
          points.push({
            day: d.toLocaleDateString("en-IN", { month: "short", day: "2-digit" }),
            quotations: quotationMap.get(k) || 0,
            revenue: revenueMap.get(k) || 0,
          });
        }
        setSeries(points);
      } catch (err) {
        if (isAuthError(err)) {
          clearSession();
          window.location.href = "/login";
          return;
        }
        setError(err.message || "Failed to load dashboard");
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      {error ? <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Account status</CardTitle>
            <Badge variant={status === "Active" ? "success" : "warning"}>{status || "Unknown"}</Badge>
          </CardHeader>
          <CardContent>
            {status && status !== "Active" ? (
              <p className="text-sm text-amber-700">Your account is not active yet. Quotations unlock after admin approval.</p>
            ) : (
              <p className="text-sm text-slate-600">You are active and can respond to quotation requests.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Quotation requests</CardTitle>
            <Badge variant="purple">{quotationCount}</Badge>
          </CardHeader>
          <CardContent>
            <Link href="/quotations" className="text-sm font-medium text-brand-700 hover:underline">
              Open quotations →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Orders & revenue</CardTitle>
            <Badge variant="neutral">{orderCount}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Revenue (your items): <span className="font-semibold text-slate-900">{money(vendorRevenue)}</span>
            </p>
            <Link href="/orders" className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline">
              View orders →
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quotations trend (14 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tickMargin={8} fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="quotations" stroke="#6d28d9" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue trend (14 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tickMargin={8} fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v) => money(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
