import { redirect } from "next/navigation"

type SearchParams = Record<string, string | string[] | undefined>

export default function CallReviewsPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const qs = new URLSearchParams()

  const agent = searchParams?.agent
  const status = searchParams?.status
  const q = searchParams?.q

  if (typeof agent === "string" && agent.trim()) qs.set("agent", agent)
  if (typeof status === "string" && status.trim()) qs.set("status", status)
  if (typeof q === "string" && q.trim()) qs.set("q", q)

  const suffix = qs.toString()
  redirect(suffix ? `/reviews?${suffix}` : "/reviews")
}
