"use client";

import { useVendorPageHeader } from "@/components/vendorPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BookingsPage() {
  useVendorPageHeader({
    title: "Bookings",
    subtitle: "Convert leads to bookings and track confirmations.",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coming soon</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-600">Booking flow UI will be implemented next.</CardContent>
    </Card>
  );
}

