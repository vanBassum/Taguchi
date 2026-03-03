export type ParameterRow = {
  id: string
  parameter: string
  levels: string[]
}

export type ParameterTableState = {
  rows: ParameterRow[]
  visibleParameterCount: number
  visibleLevelCount: number
}

export type ParameterTableEvent =
  | { type: "parameterNameChanged"; rowIndex: number; value: string }
  | { type: "levelValueChanged"; rowIndex: number; levelIndex: number; value: string }
  | { type: "parameterAdded" }
  | { type: "parameterRemoved" }
  | { type: "levelAdded" }
  | { type: "levelRemoved" }
  | { type: "tableReset"; rows: ParameterRow[] }
  | { type: "definitionSelected"; definitionId: string }

export function createInitialParameterTableState(rows: ParameterRow[]): ParameterTableState {
  return {
    rows,
    visibleParameterCount: rows.length,
    visibleLevelCount: rows[0]?.levels.length ?? 1,
  }
}

export function getVisibleParameterRows(state: ParameterTableState): ParameterRow[] {
  return state.rows.slice(0, state.visibleParameterCount).map((row) => ({
    ...row,
    levels: row.levels.slice(0, state.visibleLevelCount),
  }))
}

export function parameterTableReducer(
  state: ParameterTableState,
  event: ParameterTableEvent
): ParameterTableState {
  if (event.type === "tableReset") {
    return createInitialParameterTableState(event.rows)
  }

  if (event.type === "parameterNameChanged") {
    return {
      ...state,
      rows: state.rows.map((row, index) =>
        index === event.rowIndex ? { ...row, parameter: event.value } : row
      ),
    }
  }

  if (event.type === "levelValueChanged") {
    return {
      ...state,
      rows: state.rows.map((row, index) => {
        if (index !== event.rowIndex) {
          return row
        }

        return {
          ...row,
          levels: row.levels.map((levelValue, levelIndex) =>
            levelIndex === event.levelIndex ? event.value : levelValue
          ),
        }
      }),
    }
  }

  if (event.type === "parameterAdded") {
    if (state.visibleParameterCount < state.rows.length) {
      return {
        ...state,
        visibleParameterCount: state.visibleParameterCount + 1,
      }
    }

    const nextParameterNumber = state.rows.length + 1
    const levelCount = state.rows[0]?.levels.length ?? state.visibleLevelCount

    return {
      ...state,
      rows: [
        ...state.rows,
        {
          id: `parameter-${Date.now()}-${nextParameterNumber}`,
          parameter: `Parameter ${nextParameterNumber}`,
          levels: Array.from({ length: levelCount }, () => ""),
        },
      ],
      visibleParameterCount: state.visibleParameterCount + 1,
    }
  }

  if (event.type === "parameterRemoved") {
    return {
      ...state,
      visibleParameterCount:
        state.visibleParameterCount <= 1
          ? state.visibleParameterCount
          : state.visibleParameterCount - 1,
    }
  }

  if (event.type === "levelAdded") {
    const maxStoredLevels = state.rows[0]?.levels.length ?? 0

    if (state.visibleLevelCount < maxStoredLevels) {
      return {
        ...state,
        visibleLevelCount: state.visibleLevelCount + 1,
      }
    }

    return {
      ...state,
      rows: state.rows.map((row) => ({ ...row, levels: [...row.levels, ""] })),
      visibleLevelCount: state.visibleLevelCount + 1,
    }
  }

  if (event.type === "levelRemoved") {
    return {
      ...state,
      visibleLevelCount:
        state.visibleLevelCount <= 1 ? state.visibleLevelCount : state.visibleLevelCount - 1,
    }
  }

  return state
}
