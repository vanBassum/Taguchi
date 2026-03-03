import { type SharedFormState, type SharedRow, type SharedScoreColumn } from "@/lib/shared-form-state"
import { createRowsFromOrthogonalArray, getOrthogonalArrayById } from "@/models/orthogonal-arrays"

export const PRESETS_STORAGE_KEY = "taguchi-presets-v1"
export const DEFAULT_SCORE_COLUMN_HEADER = "Score"

export type NamedPreset = {
  id: string
  name: string
  state: SharedFormState
  isImportedFromUrl: boolean
}

const SHORT_ID_PATTERN = /^[A-Za-z0-9]{8}$/

export function areSharedStatesEqual(left: SharedFormState, right: SharedFormState): boolean {
  const leftRunCount = Math.max(left.scores.length, left.scoreColumns?.[0]?.s.length ?? 0)
  const rightRunCount = Math.max(right.scores.length, right.scoreColumns?.[0]?.s.length ?? 0)

  const comparableLeft = {
    d: left.d,
    rows: left.rows,
    scoreColumns: normalizeScoreColumns(left.scoreColumns, left.scores, leftRunCount),
  }
  const comparableRight = {
    d: right.d,
    rows: right.rows,
    scoreColumns: normalizeScoreColumns(right.scoreColumns, right.scores, rightRunCount),
  }

  return JSON.stringify(comparableLeft) === JSON.stringify(comparableRight)
}

export function getUniquePresetName(existingPresets: NamedPreset[], baseName: string): string {
  if (!existingPresets.some((preset) => preset.name === baseName)) {
    return baseName
  }

  let suffix = 2

  while (existingPresets.some((preset) => preset.name === `${baseName} ${suffix}`)) {
    suffix += 1
  }

  return `${baseName} ${suffix}`
}

export function getUniquePresetNameWithExclusion(
  existingPresets: NamedPreset[],
  baseName: string,
  excludedName: string
): string {
  if (!existingPresets.some((preset) => preset.name === baseName && preset.name !== excludedName)) {
    return baseName
  }

  let suffix = 2

  while (existingPresets.some((preset) => preset.name === `${baseName} ${suffix}` && preset.name !== excludedName)) {
    suffix += 1
  }

  return `${baseName} ${suffix}`
}

export function createRandomPresetName(existingPresets: NamedPreset[]): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

  let candidate = ""

  do {
    let suffix = ""

    for (let index = 0; index < 6; index += 1) {
      suffix += chars[Math.floor(Math.random() * chars.length)]
    }

    candidate = `Project ${suffix}`
  } while (existingPresets.some((preset) => preset.name === candidate))

  return candidate
}

export function createPresetGuid(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)

    return Array.from(bytes, (byte) => chars[byte % chars.length]).join("")
  }

  let output = ""

  for (let index = 0; index < 8; index += 1) {
    output += chars[Math.floor(Math.random() * chars.length)]
  }

  return output
}

export function buildRowsFromShared(
  definitionId: string,
  sharedRows: SharedRow[] | undefined,
  fallbackDefinitionId: string
) {
  const definition = getOrthogonalArrayById(definitionId) ?? getOrthogonalArrayById(fallbackDefinitionId)

  if (!definition) {
    return []
  }

  const parameterCount = definition.runs[0]?.length ?? 1
  const levelCount = Math.max(1, ...definition.runs.flat())
  const baseRows = createRowsFromOrthogonalArray(definition, { parameterCount })

  return baseRows.map((baseRow, rowIndex) => {
    const sharedRow = sharedRows?.[rowIndex]

    return {
      ...baseRow,
      parameter: sharedRow?.p ?? baseRow.parameter,
      levels: Array.from(
        { length: levelCount },
        (_, levelIndex) => sharedRow?.l[levelIndex] ?? baseRow.levels[levelIndex] ?? ""
      ),
    }
  })
}

export function normalizeScores(scores: string[] | undefined, runCount: number): string[] {
  return Array.from({ length: runCount }, (_, runIndex) => scores?.[runIndex] ?? "")
}

export function normalizeScoreColumns(
  scoreColumns: SharedScoreColumn[] | undefined,
  legacyScores: string[] | undefined,
  runCount: number
): SharedScoreColumn[] {
  if (Array.isArray(scoreColumns) && scoreColumns.length > 0) {
    return scoreColumns.map((column, columnIndex) => ({
      h: typeof column.h === "string" && column.h.trim().length > 0
        ? column.h
        : columnIndex === 0
          ? DEFAULT_SCORE_COLUMN_HEADER
          : `${DEFAULT_SCORE_COLUMN_HEADER} ${columnIndex + 1}`,
      s: normalizeScores(column.s, runCount),
    }))
  }

  return [
    {
      h: DEFAULT_SCORE_COLUMN_HEADER,
      s: normalizeScores(legacyScores, runCount),
    },
  ]
}

export function readPresetsFromStorage(
  storageKey: string,
  fallbackDefinitionId: string
): NamedPreset[] {
  try {
    const source = window.localStorage.getItem(storageKey)

    if (!source) {
      return []
    }

    const parsed = JSON.parse(source) as Partial<NamedPreset>[]

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter(
        (item): item is NamedPreset =>
          Boolean(item && typeof item.name === "string" && item.state && typeof item.state === "object")
      )
      .map((item) => {
        const isImportedFromUrl = item.state.i === 1 || item.isImportedFromUrl === true
        const presetId =
          typeof item.id === "string" && SHORT_ID_PATTERN.test(item.id)
            ? item.id
            : createPresetGuid()

        return {
          id: presetId,
          name: item.name,
          state: {
            v: item.state.v === 1 ? 1 : 1,
            d: typeof item.state.d === "string" ? item.state.d : fallbackDefinitionId,
            rows: Array.isArray(item.state.rows)
              ? item.state.rows.map((row) => ({
                  p: typeof row?.p === "string" ? row.p : "",
                  l: Array.isArray(row?.l)
                    ? row.l.map((level) => (typeof level === "string" ? level : ""))
                    : [],
                }))
              : [],
            scores: Array.isArray(item.state.scores)
              ? item.state.scores.map((score) => (typeof score === "string" ? score : ""))
              : [],
            scoreColumns: Array.isArray(item.state.scoreColumns)
              ? item.state.scoreColumns
                  .filter((column): column is SharedScoreColumn =>
                    Boolean(column && typeof column.h === "string" && Array.isArray(column.s))
                  )
                  .map((column) => ({
                    h: column.h,
                    s: column.s.map((score) => (typeof score === "string" ? score : "")),
                  }))
              : undefined,
            n: typeof item.state.n === "string" ? item.state.n : undefined,
            g: typeof item.state.g === "string" ? item.state.g : presetId,
            i: isImportedFromUrl ? 1 : undefined,
          },
          isImportedFromUrl,
        }
      })
  } catch {
    return []
  }
}

export function writePresetsToStorage(storageKey: string, presets: NamedPreset[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(presets))
}
