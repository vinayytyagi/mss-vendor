"use client";

import { useVendorPageHeader } from "@/components/vendorPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EarningsPage() {
  useVendorPageHeader({
    title: "Earnings",
    subtitle: "View revenue, commission and invoices.",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coming soon</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-600">Earnings dashboard will be implemented next.</CardContent>
    </Card>
  );
}

