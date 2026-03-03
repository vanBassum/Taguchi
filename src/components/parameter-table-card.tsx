import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type OrthogonalArrayDefinition } from "@/models/orthogonal-arrays"
import { type ParameterRow, type ParameterTableEvent } from "@/models/parameter-table-model"

type ParameterTableCardProps = {
  rows: ParameterRow[]
  definitions: OrthogonalArrayDefinition[]
  selectedDefinitionId: string
  onEvent: (event: ParameterTableEvent) => void
}

export function ParameterTableCard({
  rows,
  definitions,
  selectedDefinitionId,
  onEvent,
}: ParameterTableCardProps) {
  const levelCount = rows[0]?.levels.length ?? 0

  return (
    <Card size="sm" className="w-full max-w-md">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm">Parameters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border">
          <Table className="text-xs">
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="h-auto border-r border-b px-2 py-1.5 font-medium"> </TableHead>
                {Array.from({ length: levelCount }, (_, index) => (
                  <TableHead
                    key={`header-level-${index + 1}`}
                    className="h-auto border-b px-2 py-1.5 font-medium [&:not(:last-child)]:border-r"
                  >
                    {`Level ${index + 1}`}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={row.id} className="hover:bg-muted/20">
                  <TableCell className="border-r border-b p-1">
                    <Input
                      value={row.parameter}
                      onChange={(event) =>
                        onEvent({
                          type: "parameterNameChanged",
                          rowIndex,
                          value: event.target.value,
                        })
                      }
                      className="h-7 rounded-sm border-0 bg-transparent px-1.5 text-xs shadow-none focus-visible:ring-1"
                      aria-label={`Parameter name ${rowIndex + 1}`}
                    />
                  </TableCell>
                  {row.levels.map((levelValue, levelIndex) => (
                    <TableCell
                      key={`${row.id}-level-${levelIndex}`}
                      className="border-b p-1 [&:not(:last-child)]:border-r"
                    >
                      <Input
                        value={levelValue}
                        onChange={(event) =>
                          onEvent({
                            type: "levelValueChanged",
                            rowIndex,
                            levelIndex,
                            value: event.target.value,
                          })
                        }
                        className="h-7 rounded-sm border-0 bg-transparent px-1.5 text-xs shadow-none focus-visible:ring-1"
                        aria-label={`Level ${levelIndex + 1} value for parameter ${rowIndex + 1}`}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter>
        <Select
          value={selectedDefinitionId}
          onValueChange={(definitionId) => onEvent({ type: "definitionSelected", definitionId })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select definition" />
          </SelectTrigger>
          <SelectContent>
            {definitions.map((definition) => (
              <SelectItem key={definition.id} value={definition.id}>
                {definition.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardFooter>
    </Card>
  )
}
