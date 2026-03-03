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
  scoreLabel: string
}

const scoreFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 })

const negativeCellClasses = [
  "bg-red-500/10",
  "bg-red-500/20",
  "bg-red-500/30",
  "bg-red-500/40",
  "bg-red-500/50",
]

const positiveCellClasses = [
  "bg-green-500/10",
  "bg-green-500/20",
  "bg-green-500/30",
  "bg-green-500/40",
  "bg-green-500/50",
]

function getCellHeatClass(value: number, average: number, maxDeviation: number): string {
  if (maxDeviation <= 0) {
    return ""
  }

  const deviation = value - average
  const normalizedDeviation = Math.abs(deviation) / maxDeviation

  if (normalizedDeviation < 0.05) {
    return ""
  }

  const bucket = Math.min(
    Math.floor(normalizedDeviation * negativeCellClasses.length),
    negativeCellClasses.length - 1
  )

  return deviation < 0 ? negativeCellClasses[bucket] : positiveCellClasses[bucket]
}

function getScoreValue(
  definition: OrthogonalArrayDefinition,
  parameterIndex: number,
  levelIndex: number,
  scores: string[]
): number | null {
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

  if (count === 0) {
    return null
  }

  return sum
}

export function AverageScoreCard({ definition, rows, scores, scoreLabel }: AverageScoreCardProps) {
  const levelCount = rows[0]?.levels.length ?? 0
  const scoreValues = rows.map((_, parameterIndex) =>
    Array.from({ length: levelCount }, (_, levelIndex) =>
      getScoreValue(definition, parameterIndex, levelIndex, scores)
    )
  )

  const flattenedScoreValues = scoreValues.flat().filter((value): value is number => value !== null)
  const globalAverage =
    flattenedScoreValues.length === 0
      ? null
      : flattenedScoreValues.reduce((sum, value) => sum + value, 0) / flattenedScoreValues.length
  const maxDeviation =
    globalAverage === null
      ? 0
      : flattenedScoreValues.reduce(
          (currentMax, value) => Math.max(currentMax, Math.abs(value - globalAverage)),
          0
        )

  return (
    <Card className="w-full">
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">{`Sum Score by Level (${scoreLabel})`}</CardTitle>
        </div>
        <CardDescription className="text-xs">
          {`Each cell shows the total run score for that parameter at the selected level using ${scoreLabel}.`}
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
                  {Array.from({ length: levelCount }, (_, levelIndex) => {
                    const scoreValue = scoreValues[parameterIndex]?.[levelIndex] ?? null
                    const heatClass =
                      scoreValue === null || globalAverage === null
                        ? ""
                        : getCellHeatClass(scoreValue, globalAverage, maxDeviation)

                    return (
                      <TableCell
                        key={`${row.id}-average-level-${levelIndex + 1}`}
                        className={`min-w-12 [&:not(:last-child)]:border-r ${heatClass}`}
                      >
                        {scoreValue === null ? "—" : scoreFormatter.format(scoreValue)}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
