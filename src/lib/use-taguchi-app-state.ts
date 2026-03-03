import { useEffect, useLayoutEffect, useMemo, useReducer, useState } from "react"

import {
  DEFAULT_SCORE_COLUMN_HEADER,
  PRESETS_STORAGE_KEY,
  areSharedStatesEqual,
  buildRowsFromShared,
  createPresetGuid,
  createRandomPresetName,
  getUniquePresetName,
  getUniquePresetNameWithExclusion,
  normalizeScoreColumns,
  normalizeScores,
  readPresetsFromStorage,
  type NamedPreset,
  writePresetsToStorage,
} from "@/lib/presets"
import {
  buildSharedStateUrl,
  clearSharedStateFromUrl,
  type SharedFormState,
  readSharedStateFromUrl,
} from "@/lib/shared-form-state"
import { getOrthogonalArrayById } from "@/models/orthogonal-arrays"
import {
  createInitialParameterTableState,
  getVisibleParameterRows,
  parameterTableReducer,
  type ParameterTableEvent,
} from "@/models/parameter-table-model"

const defaultArray = getOrthogonalArrayById("L8_P4_2LEVEL")

if (!defaultArray) {
  throw new Error("Default orthogonal array is not defined.")
}

const DEFAULT_ARRAY = defaultArray

type ImportConflict = {
  presetId: string
  incomingState: SharedFormState
}

type ScoreColumnState = {
  id: string
  header: string
  scores: string[]
}

function createScoreColumnState(
  scoreColumns: SharedFormState["scoreColumns"],
  legacyScores: string[] | undefined,
  runCount: number
): ScoreColumnState[] {
  return normalizeScoreColumns(scoreColumns, legacyScores, runCount).map((column) => ({
    id: createPresetGuid(),
    header: column.h,
    scores: column.s,
  }))
}

function toSharedScoreColumns(scoreColumns: ScoreColumnState[], runCount: number) {
  return scoreColumns.map((column, columnIndex) => ({
    h:
      column.header.trim().length > 0
        ? column.header
        : columnIndex === 0
          ? DEFAULT_SCORE_COLUMN_HEADER
          : `${DEFAULT_SCORE_COLUMN_HEADER} ${columnIndex + 1}`,
    s: normalizeScores(column.scores, runCount),
  }))
}

export function useTaguchiAppState() {
  const [sharedState] = useState(() => readSharedStateFromUrl())
  const defaultRows = buildRowsFromShared(DEFAULT_ARRAY.id, undefined, DEFAULT_ARRAY.id)
  const defaultScoreColumns = normalizeScoreColumns(undefined, undefined, DEFAULT_ARRAY.runs.length)
  const defaultSnapshot: SharedFormState = {
    v: 1,
    d: DEFAULT_ARRAY.id,
    rows: defaultRows.map((row) => ({
      p: row.parameter,
      l: [...row.levels],
    })),
    scores: defaultScoreColumns[0]?.s ?? normalizeScores(undefined, DEFAULT_ARRAY.runs.length),
    scoreColumns: defaultScoreColumns,
    n: "New project",
  }

  const sharedDefinitionId =
    sharedState?.d && getOrthogonalArrayById(sharedState.d) ? sharedState.d : DEFAULT_ARRAY.id
  const sharedDefinition = getOrthogonalArrayById(sharedDefinitionId) ?? DEFAULT_ARRAY
  const sharedRows = buildRowsFromShared(sharedDefinitionId, sharedState?.rows, DEFAULT_ARRAY.id)
  const sharedScoreColumns = normalizeScoreColumns(
    sharedState?.scoreColumns,
    sharedState?.scores,
    sharedDefinition.runs.length
  )
  const incomingSharedSnapshot: SharedFormState = {
    v: 1,
    d: sharedDefinitionId,
    rows: sharedRows.map((row) => ({
      p: row.parameter,
      l: [...row.levels],
    })),
    scores: sharedScoreColumns[0]?.s ?? normalizeScores(undefined, sharedDefinition.runs.length),
    scoreColumns: sharedScoreColumns,
    n: sharedState?.n,
    g: sharedState?.g,
  }

  const storedPresets = readPresetsFromStorage(PRESETS_STORAGE_KEY, DEFAULT_ARRAY.id)
  const basePresets =
    storedPresets.length > 0
      ? storedPresets
      : [{ id: createPresetGuid(), name: "New project", state: defaultSnapshot, isImportedFromUrl: false }]
  const hasPastedUrlState = Boolean(sharedState)
  const matchedByGuid =
    hasPastedUrlState && sharedState?.g
      ? basePresets.find((preset) => preset.id === sharedState.g)
      : null
  const hasImportConflict = Boolean(
    matchedByGuid && !areSharedStatesEqual(matchedByGuid.state, incomingSharedSnapshot)
  )
  const sharedUrlPresetName = sharedState?.n?.trim()
  const pastedUrlPresetNameBase = sharedUrlPresetName || "Pasted URL"
  const shouldCreateImportedPreset = hasPastedUrlState && !matchedByGuid
  const createdImportedPresetId = sharedState?.g || createPresetGuid()
  const createdImportedPreset = shouldCreateImportedPreset
    ? {
        id: createdImportedPresetId,
        name: getUniquePresetName(basePresets, pastedUrlPresetNameBase),
        state: {
          ...incomingSharedSnapshot,
          n: sharedUrlPresetName || pastedUrlPresetNameBase,
          g: createdImportedPresetId,
        },
        isImportedFromUrl: true,
      }
    : null
  const initialPresets = createdImportedPreset ? [...basePresets, createdImportedPreset] : basePresets
  const initialSelectedPreset = createdImportedPreset || matchedByGuid || initialPresets[0]
  const initialDefinitionId = initialSelectedPreset?.state.d ?? DEFAULT_ARRAY.id
  const initialRows = buildRowsFromShared(initialDefinitionId, initialSelectedPreset?.state.rows, DEFAULT_ARRAY.id)
  const initialRunCount = (getOrthogonalArrayById(initialDefinitionId) ?? DEFAULT_ARRAY).runs.length
  const initialScoreColumns = createScoreColumnState(
    initialSelectedPreset?.state.scoreColumns,
    initialSelectedPreset?.state.scores,
    initialRunCount
  )

  const [selectedDefinitionId, setSelectedDefinitionId] = useState(initialDefinitionId)
  const [runScoreColumns, setRunScoreColumns] = useState<ScoreColumnState[]>(initialScoreColumns)
  const [presets, setPresets] = useState<NamedPreset[]>(initialPresets)
  const [selectedPresetName, setSelectedPresetName] = useState<string>(initialSelectedPreset?.name ?? "")
  const [pendingImportConflict, setPendingImportConflict] = useState<ImportConflict | null>(
    hasImportConflict && matchedByGuid
      ? {
          presetId: matchedByGuid.id,
          incomingState: { ...incomingSharedSnapshot, g: matchedByGuid.id, n: sharedUrlPresetName || matchedByGuid.name },
        }
      : null
  )

  const [state, dispatchEvent] = useReducer(
    parameterTableReducer,
    initialRows,
    createInitialParameterTableState
  )

  const selectedDefinition = getOrthogonalArrayById(selectedDefinitionId) ?? DEFAULT_ARRAY
  const visibleRows = useMemo(() => getVisibleParameterRows(state), [state])
  const selectedPreset = useMemo(
    () => presets.find((preset) => preset.name === selectedPresetName),
    [presets, selectedPresetName]
  )

  const snapshot = useMemo<SharedFormState>(
    () => {
      const sharedScoreColumns = toSharedScoreColumns(runScoreColumns, selectedDefinition.runs.length)

      return {
        v: 1,
        d: selectedDefinitionId,
        rows: visibleRows.map((row) => ({
          p: row.parameter,
          l: [...row.levels],
        })),
        scores: sharedScoreColumns[0]?.s ?? normalizeScores(undefined, selectedDefinition.runs.length),
        scoreColumns: sharedScoreColumns,
        n: selectedPresetName || undefined,
        g: selectedPreset?.id,
      }
    },
    [runScoreColumns, selectedDefinition.runs.length, selectedDefinitionId, selectedPreset?.id, selectedPresetName, visibleRows]
  )
  const presetNames = useMemo(() => presets.map((preset) => preset.name), [presets])
  const importedPresetNames = useMemo(
    () => presets.filter((preset) => preset.isImportedFromUrl).map((preset) => preset.name),
    [presets]
  )
  const hasPendingChanges = selectedPreset ? !areSharedStatesEqual(selectedPreset.state, snapshot) : false

  const applySharedState = (payload: SharedFormState) => {
    const definition = getOrthogonalArrayById(payload.d) ?? DEFAULT_ARRAY
    const rows = buildRowsFromShared(definition.id, payload.rows, DEFAULT_ARRAY.id)

    setSelectedDefinitionId(definition.id)
    dispatchEvent({ type: "tableReset", rows })
    setRunScoreColumns(createScoreColumnState(payload.scoreColumns, payload.scores, definition.runs.length))
  }

  useLayoutEffect(() => {
    clearSharedStateFromUrl()
  }, [])

  useEffect(() => {
    writePresetsToStorage(PRESETS_STORAGE_KEY, presets)
  }, [presets])

  const handleEvent = (event: ParameterTableEvent) => {
    if (event.type === "definitionSelected") {
      const definition = getOrthogonalArrayById(event.definitionId)

      if (!definition) {
        return
      }
      const parameterCount = definition.runs[0]?.length ?? 1
      const levelCount = Math.max(1, ...definition.runs.flat())

      setSelectedDefinitionId(definition.id)
      setRunScoreColumns((previousColumns) =>
        previousColumns.map((column) => ({
          ...column,
          scores: Array.from(
            { length: definition.runs.length },
            (_, runIndex) => column.scores[runIndex] ?? ""
          ),
        }))
      )
      dispatchEvent({ type: "definitionShapeChanged", parameterCount, levelCount })
      return
    }

    dispatchEvent(event)
  }

  const handleScoreChanged = (columnIndex: number, runIndex: number, value: string) => {
    setRunScoreColumns((previousColumns) => {
      const nextColumns = [...previousColumns]
      const targetColumn = nextColumns[columnIndex]

      if (!targetColumn) {
        return previousColumns
      }

      const nextScores = [...targetColumn.scores]
      nextScores[runIndex] = value
      nextColumns[columnIndex] = {
        ...targetColumn,
        scores: nextScores,
      }

      return nextColumns
    })
  }

  const handleScoreColumnHeaderChanged = (columnIndex: number, value: string) => {
    setRunScoreColumns((previousColumns) => {
      const nextColumns = [...previousColumns]
      const targetColumn = nextColumns[columnIndex]

      if (!targetColumn) {
        return previousColumns
      }

      nextColumns[columnIndex] = {
        ...targetColumn,
        header: value,
      }

      return nextColumns
    })
  }

  const handleAddScoreColumn = () => {
    setRunScoreColumns((previousColumns) => [
      ...previousColumns,
      {
        id: createPresetGuid(),
        header: `${DEFAULT_SCORE_COLUMN_HEADER} ${previousColumns.length + 1}`,
        scores: Array.from({ length: selectedDefinition.runs.length }, () => ""),
      },
    ])
  }

  const handleRemoveScoreColumn = (columnIndex: number) => {
    setRunScoreColumns((previousColumns) => {
      if (previousColumns.length <= 1) {
        return previousColumns
      }

      return previousColumns.filter((_, index) => index !== columnIndex)
    })
  }

  const handleClearParameterValues = () => {
    const rows = visibleRows.map((row) => ({
      ...row,
      levels: row.levels.map(() => ""),
    }))

    dispatchEvent({ type: "tableReset", rows })
  }

  const handleClearRunScores = () => {
    setRunScoreColumns((previousColumns) =>
      previousColumns.map((column) => ({
        ...column,
        scores: column.scores.map(() => ""),
      }))
    )
  }

  const handlePresetSelected = (name: string) => {
    if (selectedPresetName === name) {
      return
    }

    const nextPreset = presets.find((preset) => preset.name === name)

    if (!nextPreset) {
      return
    }

    setSelectedPresetName(name)
    applySharedState(nextPreset.state)
  }

  const handlePresetRenamed = (currentName: string, nextName: string) => {
    const trimmedName = nextName.trim()

    if (!trimmedName || trimmedName === currentName) {
      return
    }

    setPresets((previousPresets) => {
      if (previousPresets.some((preset) => preset.name === trimmedName && preset.name !== currentName)) {
        return previousPresets
      }

      return previousPresets.map((preset) =>
        preset.name === currentName
          ? {
              ...preset,
              name: trimmedName,
              state: {
                ...preset.state,
                n: trimmedName,
                g: preset.id,
                i: preset.isImportedFromUrl ? 1 : undefined,
              },
            }
          : preset
      )
    })

    setSelectedPresetName((previousName) => (previousName === currentName ? trimmedName : previousName))
  }

  const handleCreatePreset = () => {
    const nextName = createRandomPresetName(presets)
    const nextId = createPresetGuid()

    setPresets((previousPresets) => [
      ...previousPresets,
      {
        id: nextId,
        name: nextName,
        state: { ...snapshot, n: nextName, g: nextId, i: undefined },
        isImportedFromUrl: false,
      },
    ])
    setSelectedPresetName(nextName)
  }

  const handleDuplicatePreset = () => {
    const baseName = selectedPresetName ? `${selectedPresetName} Copy` : "New project Copy"
    const nextName = getUniquePresetName(presets, baseName)
    const nextId = createPresetGuid()

    setPresets((previousPresets) => [
      ...previousPresets,
      {
        id: nextId,
        name: nextName,
        state: { ...snapshot, n: nextName, g: nextId, i: undefined },
        isImportedFromUrl: false,
      },
    ])
    setSelectedPresetName(nextName)
  }

  const handleSaveSelectedPreset = () => {
    if (!selectedPresetName) {
      return
    }

    setPresets((previousPresets) =>
      previousPresets.map((preset) =>
        preset.name === selectedPresetName
          ? { ...preset, state: { ...snapshot, n: selectedPresetName, i: preset.isImportedFromUrl ? 1 : undefined } }
          : preset
      )
    )
  }

  const handleDeletePreset = (name: string) => {
    setPresets((previousPresets) => {
      const remainingPresets = previousPresets.filter((preset) => preset.name !== name)

      if (remainingPresets.length > 0) {
        return remainingPresets
      }

      return [
        {
          id: createPresetGuid(),
          name: "New project",
          state: { ...defaultSnapshot, n: "New project", g: undefined, i: undefined },
          isImportedFromUrl: false,
        },
      ]
    })
    setSelectedPresetName((previousName) => {
      if (previousName !== name) {
        return previousName
      }

      const firstRemaining = presets.find((preset) => preset.name !== name)
      return firstRemaining?.name ?? "New project"
    })
  }

  const handleOverwriteImportedProject = () => {
    if (!pendingImportConflict) {
      return
    }

    const targetPreset = presets.find((preset) => preset.id === pendingImportConflict.presetId)

    if (!targetPreset) {
      setPendingImportConflict(null)
      return
    }

    const incomingName = pendingImportConflict.incomingState.n?.trim()
    const nextName = incomingName
      ? getUniquePresetNameWithExclusion(presets, incomingName, targetPreset.name)
      : targetPreset.name

    const nextState: SharedFormState = {
      ...pendingImportConflict.incomingState,
      n: nextName,
      g: targetPreset.id,
    }

    setPresets((previousPresets) =>
      previousPresets.map((preset) =>
        preset.id === targetPreset.id
          ? {
              ...preset,
              name: nextName,
              isImportedFromUrl: false,
              state: nextState,
            }
          : preset
      )
    )
    setSelectedPresetName(nextName)
    applySharedState(nextState)
    setPendingImportConflict(null)
  }

  const handleKeepExistingProject = () => {
    setPendingImportConflict(null)
  }

  const getShareUrl = () => buildSharedStateUrl(snapshot)

  return {
    selectedDefinitionId,
    selectedDefinition,
    visibleRows,
    runScoreColumns,
    selectedPresetName,
    presetNames,
    importedPresetNames,
    hasPendingChanges,
    hasPendingImportConflict: Boolean(pendingImportConflict),
    handleEvent,
    handleScoreChanged,
    handleScoreColumnHeaderChanged,
    handleAddScoreColumn,
    handleRemoveScoreColumn,
    handleClearParameterValues,
    handleClearRunScores,
    handlePresetSelected,
    handlePresetRenamed,
    handleCreatePreset,
    handleDuplicatePreset,
    handleSaveSelectedPreset,
    handleDeletePreset,
    handleOverwriteImportedProject,
    handleKeepExistingProject,
    getShareUrl,
  }
}