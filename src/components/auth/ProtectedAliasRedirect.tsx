"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AccessGate } from "@/components/auth/AccessGate";

type ProtectedAliasRedirectProps = {
  from: string;
  to: string;
};

function AliasRedirect({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return null;
}

export function ProtectedAliasRedirect({ from, to }: ProtectedAliasRedirectProps) {
  return (
    <AccessGate route={from}>
      <AliasRedirect to={to} />
    </AccessGate>
  );
}
