"use client";

import dynamic from "next/dynamic";

const VendorShell = dynamic(() => import("@/components/VendorShell"), { ssr: false });

export default function VendorLayout({ children }) {
  return <VendorShell>{children}</VendorShell>;
}
