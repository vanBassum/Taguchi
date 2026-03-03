import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { type OrthogonalArrayDefinition } from "@/models/orthogonal-arrays"
import { type ParameterRow } from "@/models/parameter-table-model"
import { useMemo, useState } from "react"

type ExportRunsCardProps = {
  definition: OrthogonalArrayDefinition
  rows: ParameterRow[]
  scores: string[]
}

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes("\"") || value.includes("\n") || value.includes("\r")) {
    return `"${value.replaceAll("\"", "\"\"")}"`
  }

  return value
}

type ExportContext = {
  definition: OrthogonalArrayDefinition
  rows: ParameterRow[]
  scores: string[]
}

type Exporter = {
  id: string
  label: string
  description: string
  mimeType: string
  extension: string
  generate: (context: ExportContext) => string
}

const EXPORTERS: Exporter[] = [
  {
    id: "csv",
    label: "CSV",
    description: "Comma-separated text with Run, parameters, and Score columns.",
    mimeType: "text/csv;charset=utf-8",
    extension: "csv",
    generate: ({ definition, rows, scores }) => {
      const header = [
        "Run",
        ...rows.map((row, parameterIndex) => row.parameter || `Param ${parameterIndex + 1}`),
        "Score",
      ]

      const lines = [header]

      definition.runs.forEach((runLevels, runIndex) => {
        const parameterValues = rows.map((row, parameterIndex) => {
          const levelNumber = runLevels[parameterIndex]
          return row.levels[levelNumber - 1] ?? ""
        })

        lines.push([String(runIndex + 1), ...parameterValues, scores[runIndex] ?? ""])
      })

      return lines
        .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
        .join("\n")
    },
  },
  {
    id: "json",
    label: "JSON",
    description: "Structured JSON with runs, resolved parameter values, and scores.",
    mimeType: "application/json;charset=utf-8",
    extension: "json",
    generate: ({ definition, rows, scores }) => {
      const payload = {
        format: "taguchi-runs",
        definitionId: definition.id,
        columns: [
          "Run",
          ...rows.map((row, parameterIndex) => row.parameter || `Param ${parameterIndex + 1}`),
          "Score",
        ],
        runs: definition.runs.map((runLevels, runIndex) => {
          const parameters = rows.map((row, parameterIndex) => {
            const levelNumber = runLevels[parameterIndex]

            return {
              name: row.parameter || `Param ${parameterIndex + 1}`,
              level: levelNumber,
              value: row.levels[levelNumber - 1] ?? "",
            }
          })

          return {
            run: runIndex + 1,
            parameters,
            score: scores[runIndex] ?? "",
          }
        }),
      }

      return JSON.stringify(payload, null, 2)
    },
  },
]

export function ExportRunsCard({ definition, rows, scores }: ExportRunsCardProps) {
  const [selectedExporterId, setSelectedExporterId] = useState(EXPORTERS[0].id)
  const selectedExporter = useMemo(
    () => EXPORTERS.find((exporter) => exporter.id === selectedExporterId) ?? EXPORTERS[0],
    [selectedExporterId]
  )
  const exportContent = useMemo(
    () => selectedExporter.generate({ definition, rows, scores }),
    [definition, rows, scores, selectedExporter]
  )

  const handleDownload = () => {
    const blob = new Blob([exportContent], { type: selectedExporter.mimeType })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    const timestamp = new Date().toISOString().slice(0, 10)

    anchor.href = url
    anchor.download = `taguchi-runs-${timestamp}.${selectedExporter.extension}`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <Card size="sm" className="w-full max-h-[36rem] overflow-hidden">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm">Export Runs</CardTitle>
        <CardDescription className="text-xs">
          Generate all runs using the selected exporter and review the output before downloading.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 overflow-y-auto">
        <Select value={selectedExporterId} onValueChange={setSelectedExporterId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select exporter" />
          </SelectTrigger>
          <SelectContent>
            {EXPORTERS.map((exporter) => (
              <SelectItem key={exporter.id} value={exporter.id}>
                {exporter.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <p className="text-xs text-muted-foreground">{selectedExporter.description}</p>

        <Textarea value={exportContent} readOnly className="min-h-44 font-mono text-xs" />

        <Button type="button" size="sm" onClick={handleDownload}>
          Download {selectedExporter.label}
        </Button>
      </CardContent>
    </Card>
  )
}