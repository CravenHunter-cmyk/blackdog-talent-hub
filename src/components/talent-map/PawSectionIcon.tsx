import type { CSSProperties } from "react";
import Image from "next/image";

const BLACKDOG_PAW_ICON_SRC = "/images/Logo_icon_tight.png";

type PawSectionIconProps = {
  className?: string;
  size?: number;
};

export function PawSectionIcon({ className = "", size = 28 }: PawSectionIconProps) {
  const style = { "--paw-section-icon-size": `${size}px` } as CSSProperties;

  return (
    <span className={`paw-section-icon ${className}`.trim()} style={style} aria-hidden="true">
      <Image src={BLACKDOG_PAW_ICON_SRC} alt="" width={size} height={size} draggable={false} />
    </span>
  );
}
