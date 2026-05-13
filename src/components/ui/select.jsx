"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Select({ value, onValueChange, options, placeholder = "Select", className, align = "start" }) {
  const id = useId();
  const triggerRef = useRef(null);
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, minWidth: 180 });

  // this component is client-only; portal is always safe here

  const opts = useMemo(() => (options || []).filter(Boolean), [options]);
  const selected = opts.find((o) => String(o.value) === String(value));
  const label = selected?.label ?? placeholder;

  function computePos() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 6;
    const minWidth = Math.max(180, Math.round(r.width));
    const top = Math.round(r.bottom + gap);
    const left = align === "end" ? Math.round(r.right - minWidth) : Math.round(r.left);
    setPos({ top, left: Math.max(8, left), minWidth });
  }

  useEffect(() => {
    function onDoc(e) {
      if (!open) return;
      if (!rootRef.current) return;
      if (rootRef.current.contains(e.target)) return;
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [open]);

  useEffect(() => {
    function onResize() {
      if (!open) return;
      computePos();
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div ref={rootRef} className={cn("inline-flex", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`select-${id}`}
        onClick={() => {
          if (!open) computePos();
          setOpen((v) => !v);
        }}
        className={cn(
          "inline-flex h-10 cursor-pointer items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 text-sm text-slate-800 hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-500",
          "min-w-[160px] w-full"
        )}
      >
        <span className={cn("truncate", selected ? "" : "text-slate-500")}>{label}</span>
        <ChevronDown className={cn("size-4 text-slate-500 transition-transform", open && "rotate-180")} />
      </button>

      {open
        ? createPortal(
            <div
              id={`select-${id}`}
              role="listbox"
              ref={menuRef}
              style={{
                position: "fixed",
                top: `${pos.top}px`,
                left: `${pos.left}px`,
                minWidth: `${pos.minWidth}px`,
                zIndex: 1000,
              }}
              className="scrollbar max-h-72 overflow-auto rounded-md border border-border bg-surface shadow-lg"
            >
              {opts.map((o) => {
                const isSel = String(o.value) === String(value);
                return (
                  <button
                    key={String(o.value)}
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    onClick={() => {
                      setOpen(false);
                      onValueChange?.(o.value);
                    }}
                    className={cn(
                      "flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-sm",
                      isSel ? "bg-brand-50 text-brand-900" : "text-slate-700 hover:bg-muted"
                    )}
                  >
                    <span className="truncate">{o.label}</span>
                    {isSel ? <Check className="size-4 text-brand-700" /> : null}
                  </button>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

