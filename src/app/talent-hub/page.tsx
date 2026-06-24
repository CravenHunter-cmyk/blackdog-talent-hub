import { ProtectedAliasRedirect } from "@/components/auth/ProtectedAliasRedirect";

export default function Page() {
  return <ProtectedAliasRedirect from="/talent-hub" to="/workhub/talent-hub" />;
}
