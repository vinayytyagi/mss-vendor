"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useSyncExternalStore, useState } from "react";
import {
  LayoutGrid,
  FileText,
  User,
  LogOut,
  Package,
  Boxes,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { clearSession, getSessionSnapshot } from "@/lib/vendorApi";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VendorPageHeaderProvider, useVendorPageHeaderState } from "@/components/vendorPageHeader";

const EMPTY_SESSION = { token: null, user: null };

const nav = [
  {
    group: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
      { href: "/quotations", label: "Quotations", icon: FileText },
    ],
  },
  {
    group: "Commerce",
    items: [
      { href: "/items", label: "Listings", icon: Boxes },
      { href: "/orders", label: "Orders", icon: Package },
    ],
  },
  {
    group: "Account",
    items: [{ href: "/profile", label: "Profile", icon: User }],
  },
];

export default function VendorShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutText, setLogoutText] = useState("");

  const session = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      function onStorage(e) {
        if (!e || e.key === null) return onStoreChange();
        if (e.key === "mss_vendor_token" || e.key === "mss_vendor_user") onStoreChange();
      }
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    },
    () => getSessionSnapshot(),
    () => EMPTY_SESSION
  );
  const user = useMemo(() => session?.user || null, [session]);

  useEffect(() => {
    if (!session?.token || !session?.user) router.replace("/login");
  }, [router, session]);

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading...</div>;
  }

  return (
    <VendorPageHeaderProvider fallbackTitle={user.businessName || "Vendor"} fallbackSubtitle="Vendor Panel">
      <VendorShellInner
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        pathname={pathname}
        router={router}
        logoutOpen={logoutOpen}
        setLogoutOpen={setLogoutOpen}
        logoutText={logoutText}
        setLogoutText={setLogoutText}
      >
        {children}
      </VendorShellInner>
    </VendorPageHeaderProvider>
  );
}

function VendorShellInner({
  children,
  user,
  sidebarOpen,
  setSidebarOpen,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  pathname,
  router,
  logoutOpen,
  setLogoutOpen,
  logoutText,
  setLogoutText,
}) {
  const initials = String(user.businessName || user.email || "V")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const { title, subtitle, meta } = useVendorPageHeaderState();

  return (
    <div className="flex min-h-screen bg-background">
      {mobileSidebarOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/30 lg:hidden"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMobileSidebarOpen(false);
          }}
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-60 flex h-screen flex-col overflow-hidden border-r border-border bg-surface transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarOpen ? "lg:w-64" : "lg:w-20",
          "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border/60 px-5 shrink-0">
          {sidebarOpen ? (
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="flex size-9 items-center justify-center rounded-md bg-brand-700 text-white font-bold shadow-lg shadow-brand-100 transition-transform group-hover:scale-105">
                V
              </div>
              <div className="flex flex-col">
                <span className="font-semibold leading-tight text-slate-900">M.S.S. Vendor</span>
                <span className="mt-0.5 text-[10px] text-slate-400 leading-none">Partner console</span>
              </div>
            </Link>
          ) : (
            <div className="mx-auto flex size-10 items-center justify-center rounded-md bg-brand-700 text-white font-black shadow-lg shadow-brand-100">
              V
            </div>
          )}
        </div>

        <div className="scrollbar flex-1 overflow-y-auto px-3 py-6 space-y-6">
          {nav.map((group) => (
            <div key={group.group} className="space-y-1">
              {sidebarOpen ? (
                <h3 className="mb-2 px-4 text-[10px] font-medium text-slate-400 opacity-70">{group.group}</h3>
              ) : null}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link key={item.href} href={item.href} title={!sidebarOpen ? item.label : ""} className="block">
                    <div
                      className={cn(
                        "group relative flex cursor-pointer select-none items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all",
                        isActive
                          ? "bg-brand-50 text-brand-900 shadow-sm"
                          : "text-slate-600 hover:bg-muted hover:text-slate-900"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4.5 shrink-0 transition-colors duration-200",
                          isActive ? "text-brand-700" : "text-slate-400 group-hover:text-slate-600"
                        )}
                      />
                      {sidebarOpen ? <span className={cn("truncate", isActive ? "font-semibold" : "font-medium")}>{item.label}</span> : null}
                      {isActive ? (
                        <div
                          className={cn(
                            "absolute bg-brand-700 transition-all duration-300",
                            sidebarOpen
                              ? "right-2 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full"
                              : "left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full"
                          )}
                        />
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="border-t border-border/70 p-3">
          <div className={cn("flex items-center gap-3 rounded-md bg-muted px-3 py-3", !sidebarOpen && "justify-center")}>
            <div className="flex size-10 items-center justify-center rounded-md bg-brand-700 text-sm font-semibold text-white">
              {initials}
            </div>
            {sidebarOpen ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{user.businessName || "Vendor"}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
            ) : null}
          </div>

          <Button
            type="button"
            variant="outline"
            className={cn("mt-3 w-full gap-2", !sidebarOpen && "px-0")}
            onClick={() => {
              setLogoutText("");
              setLogoutOpen(true);
            }}
          >
            <LogOut className="size-4" />
            {sidebarOpen ? "Logout" : null}
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0 max-h-screen overflow-hidden relative">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface/80 backdrop-blur-md px-6 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMobileSidebarOpen(true)}
              className="cursor-pointer rounded-full h-9 w-9 p-0 text-slate-600 hover:bg-muted lg:hidden"
              aria-label="Open sidebar"
            >
              <ChevronRight className="size-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen((v) => !v)}
              className="cursor-pointer rounded-full h-9 w-9 p-0 text-slate-600 hover:bg-muted"
              aria-label="Toggle sidebar width"
            >
              {sidebarOpen ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
            </Button>
            <div className="hidden sm:block min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
              <p className="truncate text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {meta ? <div className="hidden lg:block text-xs text-slate-500">{meta}</div> : null}
            <div className="flex size-9 items-center justify-center rounded-md bg-brand-700 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="hidden md:flex flex-col items-start leading-tight">
              <span className="max-w-[200px] truncate text-sm font-semibold text-slate-700">{user.email}</span>
              <span className="text-[10px] text-slate-400">Partner</span>
            </div>
          </div>
        </header>

        <main className="scrollbar flex-1 min-w-0 overflow-y-auto px-6 py-6">{children}</main>
      </div>

      {logoutOpen ? (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setLogoutOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-md border border-border bg-surface shadow-xl">
            <div className="border-b border-border/70 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Confirm logout</p>
              <p className="mt-1 text-xs text-slate-500">Type <span className="font-semibold text-slate-700">logout</span> to continue.</p>
            </div>
            <div className="px-4 py-4 space-y-3">
              <input
                autoFocus
                value={logoutText}
                onChange={(e) => setLogoutText(e.target.value)}
                placeholder="Type logout"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring focus:ring-brand-500"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLogoutOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={logoutText.trim().toLowerCase() !== "logout"}
                  onClick={() => {
                    clearSession();
                    router.replace("/login");
                  }}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
