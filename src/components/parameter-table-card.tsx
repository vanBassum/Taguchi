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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  onClearValues: () => void
  onEvent: (event: ParameterTableEvent) => void
}

export function ParameterTableCard({
  rows,
  definitions,
  selectedDefinitionId,
  onClearValues,
  onEvent,
}: ParameterTableCardProps) {
  const levelCount = rows[0]?.levels.length ?? 0
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm">Parameters</CardTitle>
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

      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear parameter values?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all level values and keep parameter names unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                onClearValues()
                setIsClearDialogOpen(false)
              }}
            >
              Clear values
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
