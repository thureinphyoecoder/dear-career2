import {
  SproutBase,
  SproutLeafLeft,
  SproutLeafRight,
  SproutStem,
} from "@/components/public/HeroSproutParts";

export function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-[999] grid place-items-center overflow-hidden bg-[#f2f2f2]"
      aria-live="polite"
      aria-label="Loading website"
    >
      <div className="absolute inset-0" />
      <div className="relative z-[1] grid justify-items-center gap-[18px]">
        <div className="site-loader-mark relative aspect-[210/180] w-[min(26vw,180px)] min-w-[132px]">
          <SproutBase className="site-loader-part site-loader-base" />
          <SproutStem className="site-loader-part site-loader-stem" />
          <SproutLeafLeft className="site-loader-part site-loader-leaf-left" />
          <SproutLeafRight className="site-loader-part site-loader-leaf-right" />
        </div>
        <div className="grid justify-items-center gap-[6px]">
          <span className="font-serif text-[clamp(2.2rem,5vw,3.6rem)] leading-[0.92] text-[#454c49]">
            dear career
          </span>
          <span className="text-[0.74rem] uppercase tracking-[0.24em] text-[rgba(141,166,147,0.9)]">
            loading opportunities
          </span>
        </div>
      </div>
    </div>
  );
}
