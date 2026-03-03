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
import { type CSSProperties } from "react"

type AverageScoreCardProps = {
  definition: OrthogonalArrayDefinition
  rows: ParameterRow[]
  scores: string[]
}

const scoreFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 })

function getAverageScoreValue(
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

  return count > 0 ? sum / count : null
}

function getHeatmapCellStyle(
  value: number | null,
  minScore: number,
  maxScore: number
): CSSProperties | undefined {
  if (value === null || !Number.isFinite(minScore) || !Number.isFinite(maxScore) || minScore === maxScore) {
    return undefined
  }

  const intensity = (value - minScore) / (maxScore - minScore)
  const clampedIntensity = Math.min(Math.max(intensity, 0), 1)
  const coolColor = "color-mix(in oklch, var(--chart-1) 72%, var(--chart-2))"
  const warmColor = "var(--destructive)"
  const paletteColor = `color-mix(in oklch, ${warmColor} ${(clampedIntensity * 100).toFixed(1)}%, ${coolColor})`
  const pastelPalette = `color-mix(in oklch, ${paletteColor} 56%, var(--card))`
  const paletteMix = 26 + clampedIntensity * 24

  return {
    backgroundColor: `color-mix(in oklch, ${pastelPalette} ${paletteMix.toFixed(1)}%, var(--card))`,
  }
}

export function AverageScoreCard({ definition, rows, scores }: AverageScoreCardProps) {
  const levelCount = rows[0]?.levels.length ?? 0
  const averageScores = rows.map((_, parameterIndex) =>
    Array.from({ length: levelCount }, (_, levelIndex) =>
      getAverageScoreValue(definition, parameterIndex, levelIndex, scores)
    )
  )
  const numericAverageScores = averageScores.flat().filter((score): score is number => score !== null)
  const minAverageScore = Math.min(...numericAverageScores)
  const maxAverageScore = Math.max(...numericAverageScores)

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
                  {Array.from({ length: levelCount }, (_, levelIndex) => {
                    const averageScore = averageScores[parameterIndex]?.[levelIndex] ?? null

                    return (
                      <TableCell
                        key={`${row.id}-average-level-${levelIndex + 1}`}
                        className="min-w-12 [&:not(:last-child)]:border-r"
                        style={getHeatmapCellStyle(averageScore, minAverageScore, maxAverageScore)}
                      >
                        {averageScore === null ? "—" : scoreFormatter.format(averageScore)}
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
