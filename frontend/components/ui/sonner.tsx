"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      closeButton
      expand={false}
      position="top-right"
      richColors
      visibleToasts={4}
      toastOptions={{
        classNames: {
          toast:
            "!w-[380px] !rounded-2xl !border !border-[rgba(160,183,164,0.26)] !bg-[rgba(255,255,255,0.98)] !px-4 !py-3 !text-[#334039] !shadow-[0_18px_48px_rgba(47,57,51,0.16)]",
          title: "!text-[0.95rem] !font-semibold !text-[#334039]",
          description: "!text-[0.88rem] !leading-6 !text-[#66726b]",
          actionButton: "!bg-[#7f9582] !text-white",
          cancelButton: "!bg-[#eef3ef] !text-[#334039]",
          closeButton:
            "!border !border-[rgba(160,183,164,0.2)] !bg-white !text-[#66726b] hover:!bg-[#f5f7f5]",
        },
      }}
    />
  );
}
