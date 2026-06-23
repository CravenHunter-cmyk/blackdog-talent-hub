import { ProtectedAliasRedirect } from "@/components/auth/ProtectedAliasRedirect";

export default function Page() {
  return <ProtectedAliasRedirect from="/blackdog-tools" to="/workspace/tools" />;
}
