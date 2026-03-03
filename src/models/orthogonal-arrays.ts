import { type ParameterRow } from "@/models/parameter-table-model"
import orthogonalArrayDefinitions from "@/models/orthogonal-arrays.json"

export type OrthogonalArrayDefinition = {
  id: string
  label: string
  runs: number[][]
}

export const ORTHOGONAL_ARRAYS: OrthogonalArrayDefinition[] = orthogonalArrayDefinitions

export function getOrthogonalArrayById(id: string): OrthogonalArrayDefinition | undefined {
  return ORTHOGONAL_ARRAYS.find((definition) => definition.id === id)
}

export function createRowsFromOrthogonalArray(
  definition: OrthogonalArrayDefinition,
  options?: {
    parameterNames?: string[]
    levelValuesByParameter?: string[][]
    parameterCount?: number
  }
): ParameterRow[] {
  const maxParameterCount = definition.runs[0]?.length ?? 0
  const levelCount = Math.max(...definition.runs.flat())
  const parameterCount = Math.min(
    options?.parameterCount ?? maxParameterCount,
    maxParameterCount
  )

  return Array.from({ length: parameterCount }, (_, parameterIndex) => {
    const fallbackParameterName = `Param ${parameterIndex + 1}`
    const sourceLevelValues = options?.levelValuesByParameter?.[parameterIndex] ?? []

    return {
      id: `parameter-${parameterIndex + 1}`,
      parameter: options?.parameterNames?.[parameterIndex] ?? fallbackParameterName,
      levels: Array.from(
        { length: levelCount },
        (_, levelIndex) => sourceLevelValues[levelIndex] ?? ""
      ),
    }
  })
}
