import type { Metadata } from "next"
import { TopNav } from "@/components/layout/TopNav"
import { LoginPage } from "@/components/auth/LoginPage"

export const metadata: Metadata = {
  title: "Login | BlackDog Talent Hub",
  description: "Sign in to the BlackDog Talent Hub platform.",
}

export default function Page() {
  return (
    <>
      <TopNav />
      <LoginPage />
    </>
  )
}
