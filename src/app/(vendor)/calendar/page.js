"use client";

import { useVendorPageHeader } from "@/components/vendorPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CalendarPage() {
  useVendorPageHeader({
    title: "Calendar",
    subtitle: "Track event dates and bookings in one place.",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coming soon</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-600">Calendar view will be implemented next.</CardContent>
    </Card>
  );
}

