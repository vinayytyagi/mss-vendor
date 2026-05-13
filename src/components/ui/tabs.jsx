"use client";

import { cn } from "@/lib/utils";

export function Tabs({ value, onValueChange, children, className }) {
  return (
    <div className={cn("space-y-3", className)} data-tabs-value={value}>
      {typeof children === "function" ? children({ value, onValueChange }) : children}
    </div>
  );
}

export function TabsList({ className, ...props }) {
  return (
    <div
      className={cn("inline-flex items-center gap-1 rounded-md border border-border bg-surface p-1", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ value, currentValue, onValueChange, className, children }) {
  const active = value === currentValue;
  return (
    <button
      type="button"
      onClick={() => onValueChange?.(value)}
      className={cn(
        "cursor-pointer rounded-md px-3 py-1.5 text-sm transition",
        active ? "bg-brand-700 text-white" : "text-slate-700 hover:bg-muted",
        className
      )}
    >
      {children}
    </button>
  );
}

