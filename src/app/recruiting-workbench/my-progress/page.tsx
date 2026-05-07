/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next"
import { TopNav } from "@/components/layout/TopNav"
import { loadMyProgressEntries } from "@/data/talentPoolStore"

export const metadata: Metadata = {
  title: "My Progress | BlackDog Talent Hub",
  description: "HR progress for successfully collected talent profiles.",
}

function initials(name = "") {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return "U"
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export default async function Page() {
  const { count, entries } = await loadMyProgressEntries("mock-hr-julie")

  return (
    <>
      <TopNav />
      <main className="min-h-screen bg-[#f6f3ed] px-6 py-8 text-[#111827]">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-black tracking-tight">Recruiting Workbench · My Progress</h1>

          <section className="mt-6 rounded-xl border border-[#d7dccf] bg-white p-6 shadow-[0_12px_28px_rgba(31,41,51,0.08)]">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f6256]">
              Successfully Collected Profiles
            </div>
            <div className="mt-2 text-5xl font-black tabular-nums text-[#1f5c43]">{count}</div>
          </section>

          <section className="mt-6 rounded-xl border border-[#d7dccf] bg-white p-6 shadow-[0_12px_28px_rgba(31,41,51,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold">Recent Submissions</h2>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e8e0d2] text-left text-xs uppercase tracking-[0.18em] text-[#6f6256]">
                    <th className="py-3 pr-3">Photo</th>
                    <th className="py-3 pr-3">Candidate Name</th>
                    <th className="py-3 pr-3">Language</th>
                    <th className="py-3 pr-3">Upwork Chat URL</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length ? (
                    entries.map(({ submission, profile }) => {
                      const name = profile?.candidateName || submission.candidateName
                      const avatarUrl = profile?.avatarUrl || submission.avatarUrl
                      const language = profile
                        ? [profile.nativeLanguage, profile.secondLanguage].filter(Boolean).join(" / ")
                        : [submission.nativeLanguage, submission.secondLanguage].filter(Boolean).join(" / ")
                      const chatUrl = profile?.upworkChatUrl || submission.upworkChatUrl
                      return (
                        <tr key={submission.talentId} className="border-b border-[#eee7db] last:border-b-0">
                          <td className="py-3 pr-3 align-middle">
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#eef4ee] text-sm font-black text-[#1f5c43]">
                              {avatarUrl ? (
                                <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                              ) : (
                                initials(name)
                              )}
                            </div>
                          </td>
                          <td className="py-3 pr-3 font-semibold">{name}</td>
                          <td className="py-3 pr-3 text-[#374151]">{language || "—"}</td>
                          <td className="py-3 pr-3">
                            {chatUrl ? (
                              <a href={chatUrl} target="_blank" rel="noreferrer" className="font-semibold text-[#1f5c43] underline">
                                Open Chat
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-[#6f6256]">
                        No submissions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
