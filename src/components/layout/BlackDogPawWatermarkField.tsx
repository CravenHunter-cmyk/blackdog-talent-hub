import type { CSSProperties } from "react";

const WATERMARK_PAW_COUNT = 999;

const watermarkPawMarks = Array.from({ length: WATERMARK_PAW_COUNT }, (_, id) => {
  const scale = 0.82 + ((id * 17) % 9) * 0.035;
  const rotate = -8 + ((id * 23) % 17);
  const opacity = 0.065 + ((id * 11) % 5) * 0.007;
  const offsetX = -16 + ((id * 29) % 33);
  const offsetY = -14 + ((id * 31) % 29);

  return {
    id,
    style: {
      "--paw-offset-x": `${offsetX}px`,
      "--paw-offset-y": `${offsetY}px`,
      "--paw-opacity": opacity,
      "--paw-rotate": `${rotate}deg`,
      "--paw-scale": scale,
    } as CSSProperties,
  };
});

export function BlackDogPawWatermarkField() {
  return (
    <div className="blackdog-paw-watermark-field" aria-hidden="true">
      <div className="blackdog-paw-watermark-field__plane">
        {watermarkPawMarks.map((paw) => (
          <span key={paw.id} className="blackdog-paw-watermark-field__paw" style={paw.style} />
        ))}
      </div>
    </div>
  );
}
