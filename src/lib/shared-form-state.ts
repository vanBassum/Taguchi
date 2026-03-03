export type SharedRow = {
  p: string
  l: string[]
}

export type SharedFormState = {
  v: 1
  d: string
  rows: SharedRow[]
  scores: string[]
}

const SHARED_STATE_PARAM = "s"

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ""

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/")
  const missingPadding = (4 - (padded.length % 4)) % 4
  const binary = atob(`${padded}${"=".repeat(missingPadding)}`)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))

  return new TextDecoder().decode(bytes)
}

export function readSharedStateFromUrl(): SharedFormState | null {
  const encoded = new URLSearchParams(window.location.search).get(SHARED_STATE_PARAM)

  if (!encoded) {
    return null
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(encoded)) as Partial<SharedFormState>

    if (
      parsed.v !== 1 ||
      typeof parsed.d !== "string" ||
      !Array.isArray(parsed.rows) ||
      !Array.isArray(parsed.scores)
    ) {
      return null
    }

    const rows: SharedRow[] = parsed.rows
      .filter((row): row is SharedRow => Boolean(row && typeof row.p === "string" && Array.isArray(row.l)))
      .map((row) => ({
        p: row.p,
        l: row.l.map((level) => (typeof level === "string" ? level : "")),
      }))

    const scores = parsed.scores.map((score) => (typeof score === "string" ? score : ""))

    return {
      v: 1,
      d: parsed.d,
      rows,
      scores,
    }
  } catch {
    return null
  }
}

export function writeSharedStateToUrl(payload: SharedFormState) {
  const encoded = encodeBase64Url(JSON.stringify(payload))
  const url = new URL(window.location.href)

  if (url.searchParams.get(SHARED_STATE_PARAM) === encoded) {
    return
  }

  url.searchParams.set(SHARED_STATE_PARAM, encoded)
  window.history.replaceState(null, "", url)
}
