export function isBlackDogBrainWorkspaceEnabled() {
  return process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ENABLE_BLACKDOG_BRAIN === "true";
}
