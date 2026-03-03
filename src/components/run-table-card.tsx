import { useState } from "react"

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type OrthogonalArrayDefinition } from "@/models/orthogonal-arrays"
import { type ParameterRow } from "@/models/parameter-table-model"
import { Plus, Trash2 } from "lucide-react"

type ScoreColumn = {
  id: string
  header: string
  scores: string[]
}

type RunTableCardProps = {
  definition: OrthogonalArrayDefinition
  rows: ParameterRow[]
  scoreColumns: ScoreColumn[]
  onClearScores: () => void
  onScoreChanged: (columnIndex: number, runIndex: number, value: string) => void
  onScoreColumnHeaderChanged: (columnIndex: number, value: string) => void
  onAddScoreColumn: () => void
  onRemoveScoreColumn: (columnIndex: number) => void
}

export function RunTableCard({
  definition,
  rows,
  scoreColumns,
  onClearScores,
  onScoreChanged,
  onScoreColumnHeaderChanged,
  onAddScoreColumn,
  onRemoveScoreColumn,
}: RunTableCardProps) {
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)

  return (
    <>
      <Card size="sm" className="w-full">
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm">Runs</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={onAddScoreColumn}
              >
                <Plus />
                Add score
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => setIsClearDialogOpen(true)}
              >
                Clear
              </Button>
            </div>
          </div>
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
                  {scoreColumns.map((column, columnIndex) => (
                    <TableHead key={column.id} className="min-w-36 border-l">
                      <div className="flex items-center gap-1">
                        <Input
                          value={column.header}
                          onChange={(event) =>
                            onScoreColumnHeaderChanged(columnIndex, event.target.value)
                          }
                          className="h-7"
                          aria-label={`Score column ${columnIndex + 1} header`}
                          placeholder={`Score ${columnIndex + 1}`}
                        />
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="ghost"
                          onClick={() => onRemoveScoreColumn(columnIndex)}
                          disabled={scoreColumns.length <= 1}
                          aria-label={`Remove score column ${columnIndex + 1}`}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableHead>
                  ))}
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
                    {scoreColumns.map((column, columnIndex) => (
                      <TableCell key={`${column.id}-run-${runIndex + 1}`} className="border-l">
                        <Input
                          type="number"
                          value={column.scores[runIndex] ?? ""}
                          onChange={(event) =>
                            onScoreChanged(columnIndex, runIndex, event.target.value)
                          }
                          className="table-compact-input"
                          aria-label={`${column.header || `Score ${columnIndex + 1}`} for run ${runIndex + 1}`}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear run scores?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all score inputs in the runs table.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                onClearScores()
                setIsClearDialogOpen(false)
              }}
            >
              Clear scores
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
