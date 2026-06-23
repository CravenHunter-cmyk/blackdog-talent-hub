import type { Metadata } from "next"
import { TopNav } from "@/components/layout/TopNav"
import { LoginPage } from "@/components/auth/LoginPage"

export const metadata: Metadata = {
  title: "Login | BlackDog Talent Hub",
  description: "Sign in to the BlackDog Talent Hub platform.",
}

type LoginPageSearchParams = {
  redirect?: string | string[]
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || ""
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<LoginPageSearchParams>
}) {
  const query = await searchParams

  return (
    <>
      <TopNav />
      <LoginPage redirectTarget={firstSearchParam(query.redirect)} />
    </>
  )
}
