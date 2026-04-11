"use client";

import { useDroppable } from "@dnd-kit/core";
import { DraggableCard } from "./DraggableCard";

export function DroppableDeck({
  deckIds,
  invalidPulse,
  onRemoveAt,
  onPreview,
  selectedTemplateId,
}: {
  deckIds: string[];
  invalidPulse?: boolean;
  onRemoveAt?: (index: number) => void;
  onPreview?: (templateId?: string) => void;
  selectedTemplateId?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "deck-root" });
  return (
    <div
      ref={setNodeRef}
      className={[
        "flex h-full min-h-0 flex-col rounded-xl border bg-slate-900/70 p-3 transition",
        isOver ? "border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.35)]" : "border-slate-600",
        invalidPulse ? "animate-cell-warn border-red-400" : "",
      ].join(" ")}
    >
      <div className="mb-2 text-xs text-slate-300">วางการ์ดลงเด็ค (5x4)</div>
      <div className="grid min-h-0 flex-1 grid-cols-5 gap-2 overflow-y-auto pr-1">
        {Array.from({ length: 20 }).map((_, i) => {
          const id = deckIds[i];
          return (
            <DeckSlot key={i} index={i} templateId={id} onRemoveAt={onRemoveAt} onPreview={onPreview} selectedTemplateId={selectedTemplateId} />
          );
        })}
      </div>
    </div>
  );
}

function DeckSlot({
  index,
  templateId,
  onRemoveAt,
  onPreview,
  selectedTemplateId,
}: {
  index: number;
  templateId?: string;
  onRemoveAt?: (index: number) => void;
  onPreview?: (templateId?: string) => void;
  selectedTemplateId?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot:${index}` });
  const selected = templateId && templateId === selectedTemplateId;
  return (
    <div
      ref={setNodeRef}
      onMouseEnter={() => onPreview?.(templateId)}
      onMouseLeave={() => onPreview?.(undefined)}
      className={[
        "group relative min-h-16 rounded-lg border p-1",
        isOver ? "border-blue-400 bg-blue-500/10" : "border-slate-700 bg-slate-800/60",
        selected ? "ring-2 ring-yellow-400/80" : "",
      ].join(" ")}
    >
      {templateId ? (
        <>
          <DraggableCard templateId={templateId} source="deck" dragId={`deck:${index}:${templateId}`} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveAt?.(index);
            }}
            className="absolute right-1 top-1 rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] text-rose-200 opacity-0 transition group-hover:opacity-100"
          >
            ลบ
          </button>
        </>
      ) : (
        <div className="flex h-full items-center justify-center text-[11px] text-slate-500">ว่าง</div>
      )}
    </div>
  );
}

export function RemoveZone() {
  const { setNodeRef, isOver } = useDroppable({ id: "remove-zone" });
  return (
    <div
      ref={setNodeRef}
      className={[
        "rounded-xl border px-3 py-2 text-xs transition",
        isOver ? "border-rose-400 bg-rose-500/20 text-rose-100" : "border-slate-600 bg-slate-800 text-slate-300",
      ].join(" ")}
    >
      ลากมาวางตรงนี้เพื่อลบการ์ด
    </div>
  );
}

