"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const VendorPageHeaderContext = createContext(null);

export function VendorPageHeaderProvider({ children, fallbackTitle, fallbackSubtitle }) {
  const [header, setHeader] = useState(null);

  const value = useMemo(
    () => ({
      header,
      setHeader,
      fallbackTitle: fallbackTitle || "Vendor",
      fallbackSubtitle: fallbackSubtitle || "Vendor Panel",
    }),
    [header, fallbackTitle, fallbackSubtitle]
  );

  return <VendorPageHeaderContext.Provider value={value}>{children}</VendorPageHeaderContext.Provider>;
}

export function useVendorPageHeaderState() {
  const ctx = useContext(VendorPageHeaderContext);
  if (!ctx) throw new Error("useVendorPageHeaderState must be used within VendorPageHeaderProvider");
  const title = ctx.header?.title || ctx.fallbackTitle;
  const subtitle = ctx.header?.subtitle || ctx.fallbackSubtitle;
  const meta = ctx.header?.meta || null;
  return { title, subtitle, meta };
}

export function useVendorPageHeader(nextHeader) {
  const ctx = useContext(VendorPageHeaderContext);
  if (!ctx) throw new Error("useVendorPageHeader must be used within VendorPageHeaderProvider");

  const stable = useMemo(() => {
    if (!nextHeader) return null;
    return {
      title: nextHeader.title || "",
      subtitle: nextHeader.subtitle || "",
      meta: nextHeader.meta || null,
    };
  }, [nextHeader?.title, nextHeader?.subtitle, nextHeader?.meta]);

  useEffect(() => {
    ctx.setHeader(stable);
    return () => ctx.setHeader(null);
  }, [ctx, stable]);
}

