"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { JobReportForm } from "@/components/public/JobReportForm";

export function JobReportModalTrigger({ jobId }: { jobId: number }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-fit items-center gap-2 rounded-full border border-[rgba(160,183,164,0.2)] bg-[rgba(255,255,255,0.86)] px-4 py-2 text-sm font-medium text-[#4f6354] transition-colors hover:bg-white"
      >
        <AlertTriangle className="h-4 w-4" />
        Report to admin
      </button>

      {mounted && open
        ? createPortal(
            <div className="fixed inset-0 z-[120] grid place-items-center bg-[rgba(27,35,30,0.34)] p-4 backdrop-blur-[2px]">
              <div className="w-full max-w-[620px] rounded-[1.6rem] border border-[rgba(160,183,164,0.22)] bg-[linear-gradient(165deg,rgba(255,255,255,0.96),rgba(247,243,236,0.78))] p-5 shadow-[0_24px_70px_rgba(74,95,80,0.24)] sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="grid gap-1">
                    <h3 className="m-0 text-[1.08rem] font-semibold text-[#334039]">Report to admin</h3>
                    <p className="m-0 text-sm leading-6 text-[#5f6763]">
                      Share if this listing looks suspicious, outdated, or inaccurate.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(160,183,164,0.22)] bg-white/90 text-[#5f6a64] transition-colors hover:bg-white"
                    aria-label="Close report modal"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <JobReportForm jobId={jobId} compact onSubmitted={() => setOpen(false)} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
