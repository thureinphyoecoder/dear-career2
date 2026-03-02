"use client";

import { AlertTriangle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  isLoading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(28,37,33,0.36)] px-4 backdrop-blur-[2px]">
      <div className="w-full max-w-[420px] rounded-[24px] border border-border/70 bg-white p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full",
              tone === "danger"
                ? "bg-[rgba(169,97,111,0.1)] text-[#8e4a4a]"
                : "bg-[rgba(141,166,147,0.14)] text-[#4f6354]",
            )}
          >
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="grid gap-1">
            <h3 className="text-[1.04rem] font-semibold tracking-[-0.02em] text-[#334039]">
              {title}
            </h3>
            <p className="text-sm leading-6 text-[#727975]">{description}</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            className={cn(buttonVariants({ variant: "secondary" }), "rounded-md")}
            type="button"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className={cn(
              buttonVariants(),
              "rounded-md",
              tone === "danger" &&
                "border-[rgba(169,97,111,0.22)] bg-[#9d5c64] text-white hover:bg-[#8e4a4a]",
            )}
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
