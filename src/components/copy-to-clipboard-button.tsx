"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { t } from "@/i18n/t";

type CopyFeedbackStatus = "idle" | "success" | "error";

type CopyToClipboardButtonProps = {
  text: string;
  compact?: boolean;
  describedBy?: string;
};

export function CopyToClipboardButton({
  text,
  compact = false,
  describedBy
}: CopyToClipboardButtonProps) {
  const [status, setStatus] = useState<CopyFeedbackStatus>("idle");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleCopyClick(): Promise<void> {
    if (!navigator.clipboard?.writeText) {
      setStatus("error");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setStatus("success");

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setStatus("idle");
      }, 2500);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      className={
        compact ? "copy-control-compact" : "flex flex-wrap items-center gap-3"
      }
    >
      <Button
        onClick={() => void handleCopyClick()}
        type="button"
        variant={compact ? "tertiary" : "secondary"}
        className={compact ? "px-2" : undefined}
        aria-describedby={describedBy}
      >
        {t("common.copyLink")}
      </Button>
      <span
        aria-live="polite"
        className={compact ? "copy-feedback-compact" : "text-sm text-slate-700"}
        role="status"
      >
        {status === "success"
          ? t("common.linkCopied")
          : status === "error"
            ? t("common.copyFailed")
            : ""}
      </span>
    </div>
  );
}
