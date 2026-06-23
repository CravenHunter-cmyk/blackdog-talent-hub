import Image from "next/image";
import type { CSSProperties } from "react";

type BlackDogLogoSize = "sm" | "md" | "lg";
type BlackDogLogoTone = "default" | "white";

type BlackDogLogoProps = {
  size?: BlackDogLogoSize;
  tone?: BlackDogLogoTone;
  className?: string;
};

const LOGO_ICON_SRC = "/images/Logo_icon_tight.png";
const TEXT_DARK = "#071B3A";
const TEXT_WHITE = "#FFFFFF";

const logoSizes: Record<BlackDogLogoSize, { height: number; paw: number; font: number; gap: number }> = {
  sm: { height: 30, paw: 25, font: 21, gap: 7 },
  md: { height: 40, paw: 34, font: 28, gap: 8 },
  lg: { height: 54, paw: 46, font: 38, gap: 10 },
};

const logoTextColor: Record<BlackDogLogoTone, string> = {
  default: TEXT_DARK,
  white: TEXT_WHITE,
};

export function BlackDogLogo({ size = "md", tone = "default", className = "" }: BlackDogLogoProps) {
  const spec = logoSizes[size];
  const rootStyle: CSSProperties = {
    display: "inline-flex",
    height: spec.height,
    alignItems: "center",
    gap: spec.gap,
    color: logoTextColor[tone],
    lineHeight: 1,
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  };
  const pawStyle: CSSProperties = {
    width: spec.paw,
    height: spec.paw,
    flex: "0 0 auto",
    objectFit: "contain",
  };
  const wordmarkStyle: CSSProperties = {
    display: "inline-block",
    color: "currentColor",
    fontSize: spec.font,
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: "-0.03em",
  };

  return (
    <span
      className={`blackdog-logo blackdog-logo-${size} blackdog-logo-${tone}${className ? ` ${className}` : ""}`}
      style={rootStyle}
      role="img"
      aria-label="BlackDog"
    >
      <Image src={LOGO_ICON_SRC} alt="" width={spec.paw} height={spec.paw} style={pawStyle} />
      <span className="blackdog-logo-wordmark" style={wordmarkStyle}>
        BlackDog
      </span>
    </span>
  );
}

export const blackDogLogoSpec = {
  iconSrc: LOGO_ICON_SRC,
  colors: {
    textDark: TEXT_DARK,
    textWhite: TEXT_WHITE,
  },
  sizes: logoSizes,
} as const;
