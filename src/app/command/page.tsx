import { ProtectedAliasRedirect } from "@/components/auth/ProtectedAliasRedirect";

export default function Page() {
  return <ProtectedAliasRedirect from="/command" to="/settings" />;
}
