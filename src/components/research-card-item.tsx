"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SOURCE_TOOL_LABELS, STATUS_LABELS, type ResearchCard } from "@/types/research";

type ResearchCardItemProps = {
  card: ResearchCard;
  onDelete: (id: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  compact?: boolean;
};

export function ResearchCardItem({
  card,
  onDelete,
  selectable,
  selected,
  onSelectToggle,
  compact = false,
}: ResearchCardItemProps) {
  return (
    <div
      role={selectable ? "button" : undefined}
      tabIndex={selectable ? 0 : undefined}
      onClick={selectable ? onSelectToggle : undefined}
      onKeyDown={
        selectable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectToggle?.();
              }
            }
          : undefined
      }
      className={cn(
        "rounded-xl border border-[#D8E2EC] bg-white transition-colors",
        compact
          ? "p-3 text-xs leading-relaxed shadow-[var(--rw-shadow)]"
          : "p-5 text-sm leading-relaxed shadow-[var(--rw-shadow)]",
        card.status === "rejected" && "opacity-50",
        selectable && "cursor-pointer hover:border-[#2563EB]/40",
        selected && "border-[#2563EB]/50 ring-2 ring-[#2563EB]/15",
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {selectable && (
          <span
            className={cn(
              "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]",
              selected
                ? "border-[#2563EB] bg-[#2563EB] text-white"
                : "border-[#D8E2EC] bg-white",
            )}
          >
            {selected ? "?" : ""}
          </span>
        )}
        <span className="rounded-full bg-[#EAF2F8] px-2 py-0.5 text-[10px] font-medium text-[#334155]">
          {STATUS_LABELS[card.status]}
        </span>
        {!compact && (
          <Badge variant="outline" className="border-[#D8E2EC] font-normal text-[10px] text-[#64748B]">
            {SOURCE_TOOL_LABELS[card.sourceTool]}
          </Badge>
        )}
      </div>

      <p
        className={cn(
          "whitespace-pre-wrap text-[#0F172A]",
          compact ? "mt-2 line-clamp-4" : "mt-3",
        )}
      >
        {card.content}
      </p>

      {!compact && (card.sourceUrl || card.memo) && (
        <div className="mt-2 space-y-1 text-xs text-[#64748B]">
          {card.sourceUrl && (
            <p className="truncate">
              ??:{" "}
              <a
                href={card.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                onClick={(e) => e.stopPropagation()}
              >
                {card.sourceUrl}
              </a>
            </p>
          )}
          {card.memo && <p className="whitespace-pre-wrap">{card.memo}</p>}
        </div>
      )}

      <div
        className={cn(
          "flex justify-end",
          compact ? "mt-2" : "mt-3 border-t border-[#D8E2EC] pt-2",
        )}
      >
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[11px] text-[#64748B] hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card.id);
          }}
        >
          ??
        </Button>
      </div>
    </div>
  );
}
