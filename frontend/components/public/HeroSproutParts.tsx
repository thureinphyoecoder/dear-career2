import type { ReactNode } from "react";

function SproutSvg({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 210 180"
      aria-hidden="true"
      fill="none"
    >
      {children}
    </svg>
  );
}

export function SproutBase({ className }: { className?: string }) {
  return (
    <SproutSvg className={className}>
      <path
        d="M21 163C48 136 72 128 105 128C137 128 164 139 187 163H21Z"
        fill="#9fb1a0"
      />
    </SproutSvg>
  );
}

export function SproutStem({ className }: { className?: string }) {
  return (
    <SproutSvg className={className}>
      <path
        d="M97 139C97 116 100 95 106 75C112 54 120 38 134 21"
        stroke="#9fb1a0"
        strokeWidth="10"
        strokeLinecap="round"
      />
    </SproutSvg>
  );
}

export function SproutLeafLeft({ className }: { className?: string }) {
  return (
    <SproutSvg className={className}>
      <path
        d="M95 103C89 83 76 66 59 55C38 42 21 43 4 52C24 64 37 76 50 94C58 106 68 116 81 120C90 123 99 116 95 103Z"
        fill="#9fb1a0"
      />
      <path
        d="M85 120C77 99 60 74 32 60"
        stroke="#ede9e3"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </SproutSvg>
  );
}

export function SproutLeafRight({ className }: { className?: string }) {
  return (
    <SproutSvg className={className}>
      <path
        d="M113 87C116 67 126 48 142 31C158 14 177 4 202 0C183 12 169 24 157 39C144 55 135 71 122 86C118 92 112 96 109 93C107 91 111 89 113 87Z"
        fill="#9fb1a0"
      />
      <path
        d="M120 88C133 58 154 31 182 15"
        stroke="#ede9e3"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </SproutSvg>
  );
}
