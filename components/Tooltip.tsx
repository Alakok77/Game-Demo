"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

const PADDING = 12;
const TOOLTIP_WIDTH = 256; // w-64 = 256px

/**
 * Compute the best left/top position for the tooltip so it never clips
 * outside viewport boundaries.
 */
function clampPosition(
  x: number,
  y: number,
  tooltipH: number,
): { left: number; top: number; below: boolean } {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  // Prefer right of cursor; flip left if would overflow
  let left = x + PADDING;
  if (left + TOOLTIP_WIDTH > vw - PADDING) {
    left = x - TOOLTIP_WIDTH - PADDING;
  }
  // Clamp to viewport edge
  left = Math.max(PADDING, Math.min(left, vw - TOOLTIP_WIDTH - PADDING));

  // Prefer above cursor; flip below if would overflow top
  const estimatedH = tooltipH > 0 ? tooltipH : 160;
  let top: number;
  let below: boolean;

  if (y - estimatedH - PADDING < 0) {
    // Not enough space above → place below
    top = y + PADDING;
    below = true;
  } else {
    top = y - estimatedH - PADDING;
    below = false;
  }

  // Clamp bottom edge
  if (top + estimatedH > vh - PADDING) {
    top = vh - estimatedH - PADDING;
  }
  top = Math.max(PADDING, top);

  return { left, top, below };
}

export function Tooltip({
  content,
  children,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [coords, setCoords] = React.useState({ x: 0, y: 0 });
  const [tooltipH, setTooltipH] = React.useState(0);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { setMounted(true); }, []);

  // Measure real tooltip height after it renders
  React.useLayoutEffect(() => {
    if (open && tooltipRef.current) {
      setTooltipH(tooltipRef.current.offsetHeight);
    }
  });

  const updateCoords = (e: React.MouseEvent) => {
    setCoords({ x: e.clientX, y: e.clientY });
  };

  const { left, top, below } = clampPosition(coords.x, coords.y, tooltipH);

  const portalContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.95, y: below ? -6 : 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: below ? -4 : 4 }}
          transition={{ duration: 0.13, ease: "easeOut" }}
          className="fixed z-[9999] pointer-events-none w-64 rounded-xl border border-slate-600/60 bg-slate-900/96 px-3 py-2 text-xs text-slate-100 shadow-2xl backdrop-blur-md"
          style={{ left, top }}
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <span
        className="relative inline-flex"
        onMouseEnter={(e) => { updateCoords(e); setOpen(true); }}
        onMouseMove={updateCoords}
        onMouseLeave={() => setOpen(false)}
        onFocus={(e) => {
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          setCoords({ x: rect.left + rect.width / 2, y: rect.top });
          setOpen(true);
        }}
        onBlur={() => setOpen(false)}
      >
        {children}
      </span>
      {mounted ? createPortal(portalContent, document.body) : null}
    </>
  );
}
