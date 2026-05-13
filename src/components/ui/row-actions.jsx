"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export function RowActions({ items = [], align = "end" }) {
  const id = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const closeTimer = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, minWidth: 144 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const enabledItems = useMemo(() => (items || []).filter((it) => it && !it.hidden), [items]);
  if (!enabledItems.length) return null;

  function computePos() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 6;
    const w = Math.max(144, r.width);

    const top = Math.round(r.bottom + gap);
    const left =
      align === "start" ? Math.round(r.left) : Math.round(r.right - w);

    setPos({
      top,
      left: Math.max(8, left),
      minWidth: w,
    });
  }

  function openNow() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    computePos();
    setOpen(true);
  }

  function closeSoon() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  }

  useEffect(() => {
    function onDoc(e) {
      if (!open) return;
      if (!rootRef.current) return;
      if (rootRef.current.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative inline-flex items-center justify-end"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`row-actions-${id}`}
        onClick={() => {
          // Mobile/touch fallback (hover won't fire reliably)
          if (!open) openNow();
          else setOpen(false);
        }}
        onFocus={() => {
          computePos();
        }}
        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md border border-border bg-surface text-slate-600 hover:bg-muted"
      >
        <MoreVertical className="size-4" />
      </button>

      {mounted && open
        ? createPortal(
            <div
              id={`row-actions-${id}`}
              role="menu"
              onMouseEnter={openNow}
              onMouseLeave={closeSoon}
              style={{
                position: "fixed",
                top: `${pos.top}px`,
                left: `${pos.left}px`,
                minWidth: `${pos.minWidth}px`,
                zIndex: 1000,
              }}
              className="overflow-hidden rounded-md border border-border bg-surface shadow-lg"
            >
              {enabledItems.map((it) => (
                <button
                  key={it.key}
                  type="button"
                  role="menuitem"
                  disabled={it.disabled}
                  onClick={() => {
                    setOpen(false);
                    it.onSelect?.();
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60",
                    it.danger && "text-red-700 hover:bg-red-50"
                  )}
                >
                  {it.icon ? <it.icon className="size-4" /> : null}
                  <span>{it.label}</span>
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

