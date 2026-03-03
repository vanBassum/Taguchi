import { useReducer, useState } from "react"

import { AverageScoreCard } from "@/components/average-score-card"
import { ParameterTableCard } from "@/components/parameter-table-card"
import { RunTableCard } from "@/components/run-table-card"
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

const initialParameters = createRowsFromOrthogonalArray(defaultArray, {
    parameterCount: 4,
    parameterNames: ["Length", "Width", "Weight", "Voltage"],
    levelValuesByParameter: [
        ["120 mm", "125 mm"],
        ["78 mm", "80 mm"],
        ["245 g", "250 g"],
        ["4.9 V", "5.0 V"],
    ],
})

export function App() {
    const [selectedDefinitionId, setSelectedDefinitionId] = useState(defaultArray!.id)
    const [runScores, setRunScores] = useState<string[]>(() =>
        Array.from({ length: defaultArray!.runs.length }, () => "")
    )

    const [state, dispatchEvent] = useReducer(
        parameterTableReducer,
        initialParameters,
        createInitialParameterTableState
    )

    const selectedDefinition = getOrthogonalArrayById(selectedDefinitionId) ?? defaultArray!
    const visibleRows = getVisibleParameterRows(state)

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

    return (
        <main className="min-h-screen bg-background p-4">
            <div className="mx-auto grid w-full max-w-6xl items-start gap-4 lg:grid-cols-[26.4rem_1fr]">
                <div className="grid gap-4">
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