import { ProtectedAliasRedirect } from "@/components/auth/ProtectedAliasRedirect";

export default function Page() {
  return <ProtectedAliasRedirect from="/pm-hub" to="/workhub/pm-hub" />;
}
