"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CARD_LIBRARY } from "@/data/cards";

/** Compact card used in the deck builder library and deck slots */
export function DraggableCard({
  templateId,
  source,
  disabled,
  dragId,
}: {
  templateId: string;
  source: "library" | "deck";
  disabled?: boolean;
  dragId?: string;
}) {
  const card = CARD_LIBRARY.find((c) => c.templateId === templateId);
  const draggableId = dragId ?? (source === "library" ? `lib:${templateId}` : `deck:${templateId}`);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: draggableId,
    data: { source, templateId },
    disabled,
  });
  if (!card) return null;

  // Tier colours
  const tierBg =
    card.tier === "legendary"
      ? "from-purple-950 to-slate-900 border-purple-500/70"
      : card.tier === "hero"
      ? "from-blue-950 to-slate-900 border-blue-400/60"
      : "from-slate-850 to-slate-900 border-slate-600/70";

  const tierGlow =
    card.tier === "legendary"
      ? "shadow-[0_0_10px_rgba(168,85,247,0.35)]"
      : card.tier === "hero"
      ? "shadow-[0_0_6px_rgba(59,130,246,0.2)]"
      : "shadow-sm";

  const tierLabel =
    card.tier === "legendary" ? "✨ ตำนาน" : card.tier === "hero" ? "⚔️ ฮีโร่" : "พื้นฐาน";

  const tierLabelClasses =
    card.tier === "legendary"
      ? "text-purple-300"
      : card.tier === "hero"
      ? "text-yellow-300"
      : "text-slate-400";

  // Faction stripe
  const stripeColor =
    card.cardFaction === "RAMA"
      ? "from-blue-500 to-indigo-600"
      : card.cardFaction === "LANKA"
      ? "from-red-500 to-rose-600"
      : "from-slate-500 to-slate-600";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      className={[
        "relative rounded-xl border bg-gradient-to-b text-left overflow-hidden transition-all select-none",
        tierBg,
        tierGlow,
        isDragging ? "scale-105 opacity-80 shadow-xl" : "hover:scale-[1.02] hover:brightness-110",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-grab active:cursor-grabbing",
      ].join(" ")}
    >
      {/* Faction stripe */}
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${stripeColor}`} />

      <div className="flex items-center gap-2 px-2 pt-2 pb-1.5">
        {/* Icon / Image */}
        {card.image ? (
          <img src={card.image} alt={card.name} className="h-6 w-auto object-contain shrink-0 drop-shadow-sm" />
        ) : (
          <span className="text-lg leading-none shrink-0">{card.icon}</span>
        )}

        {/* Name + meta */}
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-bold text-white">{card.name}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={["text-[10px] font-semibold", tierLabelClasses].join(" ")}>
              {tierLabel}
            </span>
            <span className="text-[10px] text-slate-500">•</span>
            <span className="text-[10px] text-slate-400">
              {card.type === "skill" ? "⚡" : "🛡"} {card.cost}⚡
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
