import { ProtectedAliasRedirect } from "@/components/auth/ProtectedAliasRedirect";

export default function Page() {
  return <ProtectedAliasRedirect from="/sourcing-hub" to="/workhub/sourcing-hub" />;
}
