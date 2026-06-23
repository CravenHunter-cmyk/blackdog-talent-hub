import type { CSSProperties } from "react";

type TalentAvatarId =
  | "matchingSarah"
  | "matchingDaniel"
  | "matchingPriya"
  | "matchingJames"
  | "profileSarah"
  | "chatDaniel"
  | "chatPriya";

type TalentAvatarLayout = {
  x: number;
  y: number;
  size: number;
  face: 0 | 1 | 2 | 3;
};

type TalentAvatarLayoutMap = Record<TalentAvatarId, TalentAvatarLayout>;

const TALENT_AVATAR_LAYOUT: TalentAvatarLayoutMap = {
  matchingSarah: { x: 82.7, y: 22.9, size: 3.1, face: 0 },
  matchingDaniel: { x: 86.4, y: 23.1, size: 3.1, face: 1 },
  matchingPriya: { x: 69.3, y: 42.4, size: 2.6, face: 2 },
  matchingJames: { x: 90, y: 23.2, size: 3.1, face: 3 },
  profileSarah: { x: 56.2, y: 40.9, size: 2.7, face: 0 },
  chatDaniel: { x: 69.3, y: 55.5, size: 2.6, face: 1 },
  chatPriya: { x: 93.5, y: 23.2, size: 3.3, face: 2 },
};

const TALENT_AVATARS: Array<{ id: TalentAvatarId; label: string }> = [
  { id: "matchingSarah", label: "Matching talent 1" },
  { id: "matchingDaniel", label: "Matching talent 2" },
  { id: "matchingPriya", label: "Matching talent 3" },
  { id: "matchingJames", label: "Matching talent 4" },
  { id: "profileSarah", label: "Talent profile" },
  { id: "chatDaniel", label: "Chat talent 1" },
  { id: "chatPriya", label: "Chat talent 2" },
];

const FACE_POSITIONS = [
  { x: "4%", y: "30%" },
  { x: "33%", y: "30%" },
  { x: "64%", y: "30%" },
  { x: "94%", y: "30%" },
] as const;

function avatarStyle(layout: TalentAvatarLayout): CSSProperties {
  const face = FACE_POSITIONS[layout.face];

  return {
    "--talent-avatar-x": `${layout.x}%`,
    "--talent-avatar-y": `${layout.y}%`,
    "--talent-avatar-size": `${layout.size}%`,
    "--talent-avatar-focus-x": face.x,
    "--talent-avatar-focus-y": face.y,
  } as CSSProperties;
}

export function WhyTalentAvatarOverlay() {
  return (
    <div className="why-talent-avatar-overlay" aria-label="Human talent avatars">
      {TALENT_AVATARS.map((avatar) => (
        <span
          aria-label={avatar.label}
          className="why-talent-avatar"
          key={avatar.id}
          role="img"
          style={avatarStyle(TALENT_AVATAR_LAYOUT[avatar.id])}
        >
          <span aria-hidden="true" className="why-talent-avatar-face" />
        </span>
      ))}
    </div>
  );
}
