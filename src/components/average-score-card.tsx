import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type OrthogonalArrayDefinition } from "@/models/orthogonal-arrays"
import { type ParameterRow } from "@/models/parameter-table-model"

type AverageScoreCardProps = {
  definition: OrthogonalArrayDefinition
  rows: ParameterRow[]
  scores: string[]
}

const scoreFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 })

function getAverageScore(
  definition: OrthogonalArrayDefinition,
  parameterIndex: number,
  levelIndex: number,
  scores: string[]
): string {
  let sum = 0
  let count = 0

  definition.runs.forEach((runLevels, runIndex) => {
    if (runLevels[parameterIndex] !== levelIndex + 1) {
      return
    }

    const score = Number.parseFloat(scores[runIndex] ?? "")

    if (!Number.isFinite(score)) {
      return
    }

    sum += score
    count += 1
  })

  return count > 0 ? scoreFormatter.format(sum / count) : "—"
}

export function AverageScoreCard({ definition, rows, scores }: AverageScoreCardProps) {
  const levelCount = rows[0]?.levels.length ?? 0

  return (
    <Card className="w-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm">Average Score by Level</CardTitle>
        <CardDescription className="text-xs">
          Each cell shows the mean run score for that parameter at the selected level.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border">
          <Table className="table-compact">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[5.5rem] border-r"></TableHead>
                {Array.from({ length: levelCount }, (_, levelIndex) => (
                  <TableHead
                    key={`average-level-header-${levelIndex + 1}`}
                    className="min-w-12 [&:not(:last-child)]:border-r"
                  >
                    {`Level ${levelIndex + 1}`}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, parameterIndex) => (
                <TableRow key={row.id}>
                  <TableCell className="min-w-[5.5rem] border-r">
                    {row.parameter || `Param ${parameterIndex + 1}`}
                  </TableCell>
                  {Array.from({ length: levelCount }, (_, levelIndex) => (
                    <TableCell
                      key={`${row.id}-average-level-${levelIndex + 1}`}
                      className="min-w-12 [&:not(:last-child)]:border-r"
                    >
                      {getAverageScore(definition, parameterIndex, levelIndex, scores)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
