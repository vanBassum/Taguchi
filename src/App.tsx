import { useReducer, useState } from "react"

import { ParameterTableCard } from "@/components/parameter-table-card"
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

    const [state, dispatchEvent] = useReducer(
        parameterTableReducer,
        initialParameters,
        createInitialParameterTableState
    )

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
            dispatchEvent({ type: "definitionShapeChanged", parameterCount, levelCount })
            return
        }

        dispatchEvent(event)
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-4">
            <ParameterTableCard
                rows={visibleRows}
                definitions={ORTHOGONAL_ARRAYS}
                selectedDefinitionId={selectedDefinitionId}
                onEvent={handleEvent}
            />
        </main>
    )
}

export default App