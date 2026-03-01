import {
  SproutBase,
  SproutLeafLeft,
  SproutLeafRight,
  SproutStem,
} from "@/components/public/HeroSproutParts";

export function LoadingScreen() {
  return (
    <div className="site-loader" aria-live="polite" aria-label="Loading website">
      <div className="site-loader-backdrop" />
      <div className="site-loader-content">
        <div className="site-loader-mark">
          <SproutBase className="site-loader-part site-loader-base" />
          <SproutStem className="site-loader-part site-loader-stem" />
          <SproutLeafLeft className="site-loader-part site-loader-leaf-left" />
          <SproutLeafRight className="site-loader-part site-loader-leaf-right" />
        </div>
        <div className="site-loader-copy">
          <span className="site-loader-title">dear career</span>
          <span className="site-loader-subtitle">loading opportunities</span>
        </div>
      </div>
    </div>
  );
}
