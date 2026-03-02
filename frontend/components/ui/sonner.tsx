"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      closeButton
      expand={false}
      position="top-right"
      richColors
      toastOptions={{
        classNames: {
          toast: "!border !border-[rgba(160,183,164,0.2)] !bg-white !text-[#334039] !shadow-lg",
          title: "!text-[#334039]",
          description: "!text-[#66726b]",
          actionButton: "!bg-[#7f9582] !text-white",
          cancelButton: "!bg-[#eef3ef] !text-[#334039]",
        },
      }}
    />
  );
}
