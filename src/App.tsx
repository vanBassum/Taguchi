import { AverageScoreCard } from "@/components/average-score-card"
import { ParameterTableCard } from "@/components/parameter-table-card"
import { PresetSwitchCard } from "@/components/preset-switch-card"
import { RunTableCard } from "@/components/run-table-card"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { TaguchiAppStateProvider } from "@/lib/taguchi-app-state-context"
import { useTaguchiAppState } from "@/lib/use-taguchi-app-state"
import { ORTHOGONAL_ARRAYS } from "@/models/orthogonal-arrays"

export function App() {
    const appState = useTaguchiAppState()
    const {
        selectedDefinitionId,
        selectedDefinition,
        visibleRows,
        runScoreColumns,
        hasPendingImportConflict,
        handleEvent,
        handleScoreChanged,
        handleScoreColumnHeaderChanged,
        handleAddScoreColumn,
        handleRemoveScoreColumn,
        handleClearParameterValues,
        handleClearRunScores,
        handleOverwriteImportedProject,
        handleKeepExistingProject,
    } = appState

    return (
        <TaguchiAppStateProvider value={appState}>
            <main className="min-h-screen bg-background p-4">
            <div className="mx-auto grid w-full max-w-6xl items-start gap-4 lg:grid-cols-[30rem_1fr]">
                <div className="grid gap-4">
                    <PresetSwitchCard />
                    <ParameterTableCard
                        rows={visibleRows}
                        definitions={ORTHOGONAL_ARRAYS}
                        selectedDefinitionId={selectedDefinitionId}
                        onClearValues={handleClearParameterValues}
                        onEvent={handleEvent}
                    />
                    {runScoreColumns.map((scoreColumn, columnIndex) => (
                        <AverageScoreCard
                            key={scoreColumn.id}
                            definition={selectedDefinition}
                            rows={visibleRows}
                            scores={scoreColumn.scores}
                            scoreLabel={scoreColumn.header.trim() || `Score ${columnIndex + 1}`}
                        />
                    ))}
                </div>
                <div className="grid gap-4">
                    <RunTableCard
                        definition={selectedDefinition}
                        rows={visibleRows}
                        scoreColumns={runScoreColumns}
                        onClearScores={handleClearRunScores}
                        onScoreChanged={handleScoreChanged}
                        onScoreColumnHeaderChanged={handleScoreColumnHeaderChanged}
                        onAddScoreColumn={handleAddScoreColumn}
                        onRemoveScoreColumn={handleRemoveScoreColumn}
                    />
                </div>
            </div>

            <AlertDialog open={hasPendingImportConflict} onOpenChange={() => {}}>
                <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Project already exists</AlertDialogTitle>
                        <AlertDialogDescription>
                            A project with this shared GUID already exists. Do you want to overwrite local data with the shared URL data?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleKeepExistingProject}>Keep existing</AlertDialogCancel>
                        <AlertDialogAction onClick={handleOverwriteImportedProject}>Overwrite</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            </main>
        </TaguchiAppStateProvider>
    )
}

export default App