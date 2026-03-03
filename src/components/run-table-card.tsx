import {
  AppTable,
  AppTableBody,
  AppTableCell,
  AppTableContainer,
  AppTableHead,
  AppTableHeader,
  AppTableRow,
  appTableInputClassName,
} from "@/components/app-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { type OrthogonalArrayDefinition } from "@/models/orthogonal-arrays"
import { type ParameterRow } from "@/models/parameter-table-model"

type RunTableCardProps = {
  definition: OrthogonalArrayDefinition
  rows: ParameterRow[]
  scores: string[]
  onScoreChanged: (runIndex: number, value: string) => void
}

export function RunTableCard({ definition, rows, scores, onScoreChanged }: RunTableCardProps) {
  return (
    <Card size="sm" className="w-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm">Runs</CardTitle>
        <CardDescription className="text-xs">
          Each row is a run from the selected orthogonal array. Enter a measured score for every run.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AppTableContainer>
          <AppTable>
            <AppTableHeader>
              <AppTableRow>
                <AppTableHead className="min-w-14 border-r">Run</AppTableHead>
                {rows.map((row, parameterIndex) => (
                  <AppTableHead
                    key={`${row.id}-header`}
                    className="min-w-20 [&:not(:last-child)]:border-r"
                  >
                    {row.parameter || `Param ${parameterIndex + 1}`}
                  </AppTableHead>
                ))}
                <AppTableHead className="min-w-24 border-l">Score</AppTableHead>
              </AppTableRow>
            </AppTableHeader>
            <AppTableBody>
              {definition.runs.map((runLevels, runIndex) => (
                <AppTableRow key={`run-${runIndex + 1}`}>
                  <AppTableCell className="border-r text-muted-foreground">{runIndex + 1}</AppTableCell>
                  {rows.map((row, parameterIndex) => {
                    const levelNumber = runLevels[parameterIndex]
                    const value = row.levels[levelNumber - 1] ?? ""

                    return (
                      <AppTableCell
                        key={`run-${runIndex + 1}-param-${parameterIndex + 1}`}
                        className="[&:not(:last-child)]:border-r"
                      >
                        {value}
                      </AppTableCell>
                    )
                  })}
                  <AppTableCell className="border-l">
                    <Input
                      type="number"
                      value={scores[runIndex] ?? ""}
                      onChange={(event) => onScoreChanged(runIndex, event.target.value)}
                      className={appTableInputClassName}
                      aria-label={`Score for run ${runIndex + 1}`}
                    />
                  </AppTableCell>
                </AppTableRow>
              ))}
            </AppTableBody>
          </AppTable>
        </AppTableContainer>
      </CardContent>
    </Card>
  )
}
