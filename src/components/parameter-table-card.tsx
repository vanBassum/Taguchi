import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
    <Card className="w-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm">Parameters</CardTitle>
        <CardDescription className="text-xs">
          Enter parameter names and level values in the table. Select a different array below to
          change visible size while keeping existing data where possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border">
          <Table className="table-compact">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[5.5rem] border-r"></TableHead>
                {Array.from({ length: levelCount }, (_, index) => (
                  <TableHead
                    key={`header-level-${index + 1}`}
                    className="min-w-12 [&:not(:last-child)]:border-r"
                  >
                    {`Level ${index + 1}`}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={row.id}>
                  <TableCell className="min-w-[5.5rem] border-r">
                    <Input
                      value={row.parameter}
                      onChange={(event) =>
                        onEvent({
                          type: "parameterNameChanged",
                          rowIndex,
                          value: event.target.value,
                        })
                      }
                      className="table-compact-input"
                      aria-label={`Parameter name ${rowIndex + 1}`}
                    />
                  </TableCell>
                  {row.levels.map((levelValue, levelIndex) => (
                    <TableCell
                      key={`${row.id}-level-${levelIndex}`}
                      className="min-w-12 [&:not(:last-child)]:border-r"
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
                        className="table-compact-input"
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
