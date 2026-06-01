export function isBlackDogCommandWorkspaceEnabled() {
  return process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ENABLE_BLACKDOG_COMMAND === "true";
}
