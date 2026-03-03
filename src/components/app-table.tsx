import * as React from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

function AppTableContainer({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("overflow-hidden rounded-md border", className)} {...props} />
}

function AppTable({ className, ...props }: React.ComponentProps<typeof Table>) {
  return <Table className={cn("text-xs", className)} {...props} />
}

function AppTableHeader({ className, ...props }: React.ComponentProps<typeof TableHeader>) {
  return <TableHeader className={cn("bg-muted/40", className)} {...props} />
}

function AppTableRow({ className, ...props }: React.ComponentProps<typeof TableRow>) {
  return <TableRow className={cn("hover:bg-muted/20", className)} {...props} />
}

function AppTableHead({ className, ...props }: React.ComponentProps<typeof TableHead>) {
  return <TableHead className={cn("h-auto border-b px-2 py-1.5 font-medium", className)} {...props} />
}

function AppTableCell({ className, ...props }: React.ComponentProps<typeof TableCell>) {
  return <TableCell className={cn("border-b p-1", className)} {...props} />
}

const appTableInputClassName =
  "h-7 rounded-sm border-0 bg-transparent px-1.5 text-xs shadow-none focus-visible:ring-1"

export {
  AppTable,
  TableBody as AppTableBody,
  AppTableCell,
  AppTableContainer,
  AppTableHead,
  AppTableHeader,
  AppTableRow,
  appTableInputClassName,
}