export type SharedRow = {
  p: string
  l: string[]
}

export type SharedFormState = {
  v: 1
  d: string
  rows: SharedRow[]
  scores: string[]
  n?: string
  g?: string
  i?: 1
}

const SHARED_STATE_PARAM = "s"

function encodeSharedState(payload: SharedFormState): string {
  const encodedPayload: SharedFormState = {
    v: payload.v,
    d: payload.d,
    rows: payload.rows,
    scores: payload.scores,
    n: payload.n,
    g: payload.g,
  }
  const json = JSON.stringify(encodedPayload)
  const jsonBytes = new TextEncoder().encode(json)
  const compressedBytes = compressLzw(json)

  return compressedBytes && compressedBytes.length < jsonBytes.length
    ? `l${encodeBase64Url(compressedBytes)}`
    : `j${encodeBase64Url(jsonBytes)}`
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = ""

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function decodeBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/")
  const missingPadding = (4 - (padded.length % 4)) % 4
  const binary = atob(`${padded}${"=".repeat(missingPadding)}`)

  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function compressLzw(input: string): Uint8Array | null {
  const dictionary = new Map<string, number>()

  for (let index = 0; index < 256; index += 1) {
    dictionary.set(String.fromCharCode(index), index)
  }

  let nextCode = 256
  let word = ""
  const codes: number[] = []

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]
    const combined = `${word}${char}`

    if (dictionary.has(combined)) {
      word = combined
      continue
    }

    if (word) {
      codes.push(dictionary.get(word) ?? 0)
    }

    dictionary.set(combined, nextCode)
    nextCode += 1
    word = char
  }

  if (word) {
    codes.push(dictionary.get(word) ?? 0)
  }

  if (codes.some((code) => code > 0xffff)) {
    return null
  }

  const bytes = new Uint8Array(codes.length * 2)

  codes.forEach((code, index) => {
    const offset = index * 2
    bytes[offset] = (code >> 8) & 0xff
    bytes[offset + 1] = code & 0xff
  })

  return bytes
}

function decompressLzw(bytes: Uint8Array): string {
  if (bytes.length === 0 || bytes.length % 2 !== 0) {
    return ""
  }

  const codes = Array.from({ length: bytes.length / 2 }, (_, index) => {
    const offset = index * 2
    return (bytes[offset] << 8) | bytes[offset + 1]
  })

  if (codes.length === 0) {
    return ""
  }

  const dictionary = new Map<number, string>()

  for (let index = 0; index < 256; index += 1) {
    dictionary.set(index, String.fromCharCode(index))
  }

  let nextCode = 256
  let previous = dictionary.get(codes[0]) ?? ""
  let output = previous

  for (let index = 1; index < codes.length; index += 1) {
    const currentCode = codes[index]
    const entry =
      dictionary.get(currentCode) ??
      (currentCode === nextCode ? `${previous}${previous[0] ?? ""}` : "")

    output += entry
    dictionary.set(nextCode, `${previous}${entry[0] ?? ""}`)
    nextCode += 1
    previous = entry
  }

  return output
}

export function readSharedStateFromUrl(): SharedFormState | null {
  const raw = new URLSearchParams(window.location.search).get(SHARED_STATE_PARAM)

  if (!raw) {
    return null
  }

  try {
    let decodedJson = ""

    if (raw.startsWith("l")) {
      decodedJson = decompressLzw(decodeBase64Url(raw.slice(1)))
    } else if (raw.startsWith("j")) {
      decodedJson = new TextDecoder().decode(decodeBase64Url(raw.slice(1)))
    } else {
      decodedJson = new TextDecoder().decode(decodeBase64Url(raw))
    }

    const parsed = JSON.parse(decodedJson) as Partial<SharedFormState>

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
      n: typeof parsed.n === "string" ? parsed.n : undefined,
      g: typeof parsed.g === "string" ? parsed.g : undefined,
      i: undefined,
    }
  } catch {
    return null
  }
}

export function writeSharedStateToUrl(payload: SharedFormState) {
  const encoded = encodeSharedState(payload)
  const url = new URL(window.location.href)

  if (url.searchParams.get(SHARED_STATE_PARAM) === encoded) {
    return
  }

  url.searchParams.set(SHARED_STATE_PARAM, encoded)

  window.history.replaceState(null, "", url)
}

export function buildSharedStateUrl(payload: SharedFormState): string {
  const url = new URL(`${window.location.origin}${window.location.pathname}`)

  url.searchParams.set(SHARED_STATE_PARAM, encodeSharedState(payload))

  return url.toString()
}

export function clearSharedStateFromUrl() {
  const url = new URL(window.location.href)

  if (!url.searchParams.has(SHARED_STATE_PARAM)) {
    return
  }

  window.history.replaceState(null, "", `${url.origin}${url.pathname}`)
}
