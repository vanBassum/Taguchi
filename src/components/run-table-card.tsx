import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
        <div className="overflow-hidden rounded-md border">
          <Table className="table-compact">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-14 border-r">Run</TableHead>
                {rows.map((row, parameterIndex) => (
                  <TableHead
                    key={`${row.id}-header`}
                    className="min-w-20 [&:not(:last-child)]:border-r"
                  >
                    {row.parameter || `Param ${parameterIndex + 1}`}
                  </TableHead>
                ))}
                <TableHead className="min-w-24 border-l">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {definition.runs.map((runLevels, runIndex) => (
                <TableRow key={`run-${runIndex + 1}`}>
                  <TableCell className="border-r text-muted-foreground">{runIndex + 1}</TableCell>
                  {rows.map((row, parameterIndex) => {
                    const levelNumber = runLevels[parameterIndex]
                    const value = row.levels[levelNumber - 1] ?? ""

                    return (
                      <TableCell
                        key={`run-${runIndex + 1}-param-${parameterIndex + 1}`}
                        className="[&:not(:last-child)]:border-r"
                      >
                        {value}
                      </TableCell>
                    )
                  })}
                  <TableCell className="border-l">
                    <Input
                      type="number"
                      value={scores[runIndex] ?? ""}
                      onChange={(event) => onScoreChanged(runIndex, event.target.value)}
                      className="table-compact-input"
                      aria-label={`Score for run ${runIndex + 1}`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
