"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { copyMarkdownToClipboard } from "@/lib/research-markdown";

type ReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  content: string;
};

export function ReportDialog({
  open,
  onOpenChange,
  title,
  description,
  content,
}: ReportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl gap-3">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-xs">{description}</DialogDescription>
          )}
        </DialogHeader>
        <ScrollArea className="max-h-[55vh] rounded-md border bg-muted/30 p-3">
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
            {content.trim() || "（内容がありません）"}
          </pre>
        </ScrollArea>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => copyMarkdownToClipboard(content)}
            disabled={!content.trim()}
          >
            コピー
          </Button>
          <Button type="button" size="sm" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
