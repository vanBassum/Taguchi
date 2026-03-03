import { useEffect, useMemo, useReducer, useState } from "react"

import { AverageScoreCard } from "@/components/average-score-card"
import { ParameterTableCard } from "@/components/parameter-table-card"
import { PresetSwitchCard } from "@/components/preset-switch-card"
import { RunTableCard } from "@/components/run-table-card"
import { type SharedFormState, type SharedRow, readSharedStateFromUrl, writeSharedStateToUrl } from "@/lib/shared-form-state"
import {
    ORTHOGONAL_ARRAYS,
    createRowsFromOrthogonalArray,
    getOrthogonalArrayById,
} from "@/models/orthogonal-arrays"
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

const LOCAL_STORAGE_PRESETS_KEY = "taguchi-presets-v1"

type NamedPreset = {
    name: string
    state: SharedFormState
}

function areSharedStatesEqual(left: SharedFormState, right: SharedFormState): boolean {
    return JSON.stringify(left) === JSON.stringify(right)
}

function buildInitialRowsFromShared(definitionId: string, sharedRows: SharedRow[] | undefined) {
    const definition = getOrthogonalArrayById(definitionId) ?? DEFAULT_ARRAY
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

function normalizeScores(scores: string[] | undefined, runCount: number): string[] {
    return Array.from({ length: runCount }, (_, runIndex) => scores?.[runIndex] ?? "")
}

function readPresetsFromStorage(): NamedPreset[] {
    try {
        const source = window.localStorage.getItem(LOCAL_STORAGE_PRESETS_KEY)

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
            .map((item) => ({
                name: item.name,
                state: {
                    v: item.state.v === 1 ? 1 : 1,
                    d: typeof item.state.d === "string" ? item.state.d : DEFAULT_ARRAY.id,
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
                },
            }))
    } catch {
        return []
    }
}

function writePresetsToStorage(presets: NamedPreset[]) {
    window.localStorage.setItem(LOCAL_STORAGE_PRESETS_KEY, JSON.stringify(presets))
}

export function App() {
    const sharedState = useMemo(readSharedStateFromUrl, [])
    const initialDefinitionId =
        sharedState?.d && getOrthogonalArrayById(sharedState.d) ? sharedState.d : DEFAULT_ARRAY.id
    const initialDefinition = getOrthogonalArrayById(initialDefinitionId) ?? DEFAULT_ARRAY

    const [selectedDefinitionId, setSelectedDefinitionId] = useState(initialDefinitionId)
    const [runScores, setRunScores] = useState<string[]>(() =>
        normalizeScores(sharedState?.scores, initialDefinition.runs.length)
    )
    const [presetName, setPresetName] = useState("")
    const [selectedPresetName, setSelectedPresetName] = useState("")
    const [presets, setPresets] = useState<NamedPreset[]>(() => readPresetsFromStorage())

    const [state, dispatchEvent] = useReducer(
        parameterTableReducer,
        buildInitialRowsFromShared(initialDefinitionId, sharedState?.rows),
        createInitialParameterTableState
    )

    const selectedDefinition = getOrthogonalArrayById(selectedDefinitionId) ?? DEFAULT_ARRAY
    const visibleRows = useMemo(() => getVisibleParameterRows(state), [state])

    const snapshot = useMemo<SharedFormState>(
        () => ({
            v: 1,
            d: selectedDefinitionId,
            rows: visibleRows.map((row) => ({
                p: row.parameter,
                l: [...row.levels],
            })),
            scores: normalizeScores(runScores, selectedDefinition.runs.length),
        }),
        [runScores, selectedDefinition.runs.length, selectedDefinitionId, visibleRows]
    )

    const selectedPreset = useMemo(
        () => presets.find((preset) => preset.name === selectedPresetName),
        [presets, selectedPresetName]
    )
    const hasPendingChanges = selectedPreset ? !areSharedStatesEqual(selectedPreset.state, snapshot) : false

    const applySharedState = (payload: SharedFormState) => {
        const definition = getOrthogonalArrayById(payload.d) ?? DEFAULT_ARRAY
        const rows = buildInitialRowsFromShared(definition.id, payload.rows)

        setSelectedDefinitionId(definition.id)
        dispatchEvent({ type: "tableReset", rows })
        setRunScores(normalizeScores(payload.scores, definition.runs.length))
    }

    useEffect(() => {
        writeSharedStateToUrl(snapshot)
    }, [snapshot])

    useEffect(() => {
        writePresetsToStorage(presets)
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
            setRunScores((previousScores) =>
                Array.from({ length: definition.runs.length }, (_, runIndex) => previousScores[runIndex] ?? "")
            )
            dispatchEvent({ type: "definitionShapeChanged", parameterCount, levelCount })
            return
        }

        dispatchEvent(event)
    }

    const handleScoreChanged = (runIndex: number, value: string) => {
        setRunScores((previousScores) => {
            const nextScores = [...previousScores]
            nextScores[runIndex] = value
            return nextScores
        })
    }

    const handleSavePreset = () => {
        const trimmedName = presetName.trim()

        if (!trimmedName) {
            return
        }

        setPresets((previousPresets) => {
            const nextPresets = previousPresets.filter((preset) => preset.name !== trimmedName)
            nextPresets.push({ name: trimmedName, state: snapshot })
            return nextPresets
        })
        setSelectedPresetName(trimmedName)
        setPresetName("")
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

    const handleSaveSelectedPreset = () => {
        if (!selectedPresetName) {
            return
        }

        setPresets((previousPresets) =>
            previousPresets.map((preset) =>
                preset.name === selectedPresetName ? { ...preset, state: snapshot } : preset
            )
        )
    }

    const handleDeletePreset = (name: string) => {
        setPresets((previousPresets) => previousPresets.filter((preset) => preset.name !== name))
        setSelectedPresetName((previousName) => (previousName === name ? "" : previousName))
    }

    return (
        <main className="min-h-screen bg-background p-4">
            <div className="mx-auto grid w-full max-w-6xl items-start gap-4 lg:grid-cols-[26.4rem_1fr]">
                <div className="grid gap-4">
                    <PresetSwitchCard
                        presetName={presetName}
                        onPresetNameChanged={setPresetName}
                        presetNames={presets.map((preset) => preset.name)}
                        selectedPresetName={selectedPresetName}
                        hasPendingChanges={hasPendingChanges}
                        onPresetSelected={handlePresetSelected}
                        onSavePreset={handleSavePreset}
                        onSaveSelectedPreset={handleSaveSelectedPreset}
                        onDeletePreset={handleDeletePreset}
                    />
                    <ParameterTableCard
                        rows={visibleRows}
                        definitions={ORTHOGONAL_ARRAYS}
                        selectedDefinitionId={selectedDefinitionId}
                        onEvent={handleEvent}
                    />
                    <AverageScoreCard definition={selectedDefinition} rows={visibleRows} scores={runScores} />
                </div>
                <div className="grid gap-4">
                    <RunTableCard
                        definition={selectedDefinition}
                        rows={visibleRows}
                        scores={runScores}
                        onScoreChanged={handleScoreChanged}
                    />
                </div>
            </div>
        </main>
    )
}

export default App