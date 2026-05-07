import type { Metadata } from "next";
import { TopNav } from "@/components/layout/TopNav";
import { UsersPermissionsPage } from "@/components/settings/UsersPermissionsPage";

export const metadata: Metadata = {
  title: "Users & Permissions | BlackDog Talent Hub",
  description: "Manage role templates and account-level permission overrides.",
};

export default function Page() {
  return (
    <>
      <TopNav />
      <UsersPermissionsPage />
    </>
  );
}
