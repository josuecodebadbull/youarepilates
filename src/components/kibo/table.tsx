"use client";

import type { Cell, Column, ColumnDef, Header, HeaderGroup, Row, SortingState, Table } from "@tanstack/react-table";
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { createContext, memo, useContext } from "react";

import { Button } from "@/components/kibo/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/kibo/ui/dropdown-menu";
import {
  TableBody as TableBodyRaw,
  TableCell as TableCellRaw,
  TableHeader as TableHeaderRaw,
  TableHead as TableHeadRaw,
  Table as TableRaw,
  TableRow as TableRowRaw,
} from "@/components/kibo/ui/table";
import { cn } from "@/lib/utils";

export type { ColumnDef } from "@tanstack/react-table";

const TableContext = createContext<{
  data: unknown[];
  columns: ColumnDef<unknown, unknown>[];
  table: Table<unknown> | null;
}>({
  data: [],
  columns: [],
  table: null,
});

export type TableProviderProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  children: ReactNode;
  className?: string;
};

/** Wraps @tanstack/react-table with a sortable, styled `<table>` — drop it around
 * TableHeader/TableBody to get click-to-sort columns out of the box. */
export function TableProvider<TData, TValue>({ columns, data, children, className }: TableProviderProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <TableContext.Provider value={{ data, columns: columns as never, table: table as never }}>
      <TableRaw className={className}>{children}</TableRaw>
    </TableContext.Provider>
  );
}

export type TableHeaderProps = {
  className?: string;
  children: (props: { header: Header<unknown, unknown> }) => ReactNode;
};

export const TableHeader = ({ className, children }: TableHeaderProps) => {
  const { table } = useContext(TableContext);

  return (
    <TableHeaderRaw className={className}>
      {table?.getHeaderGroups().map((headerGroup: HeaderGroup<unknown>) => (
        <TableRowRaw key={headerGroup.id}>
          {headerGroup.headers.map((header) => children({ header }))}
        </TableRowRaw>
      ))}
    </TableHeaderRaw>
  );
};

export type TableHeadProps = {
  header: Header<unknown, unknown>;
  className?: string;
};

export const TableHead = memo(({ header, className }: TableHeadProps) => (
  <TableHeadRaw className={className} key={header.id}>
    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
  </TableHeadRaw>
));

TableHead.displayName = "TableHead";

export interface TableColumnHeaderProps<TData, TValue> extends HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

/** A sortable column header: click to cycle asc/desc via a small dropdown. Use as a
 * column's `header` in your ColumnDef, e.g. `header: ({ column }) => <TableColumnHeader column={column} title="Nombre" />`. */
export function TableColumnHeader<TData, TValue>({ column, title, className }: TableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="-ml-3 h-8" size="sm" variant="ghost">
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDownIcon className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUpIcon className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDownIcon className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            Ascendente
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            Descendente
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export type TableCellProps = {
  cell: Cell<unknown, unknown>;
  className?: string;
};

export const TableCell = ({ cell, className }: TableCellProps) => (
  <TableCellRaw className={className}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCellRaw>
);

export type TableRowProps = {
  row: Row<unknown>;
  children: (props: { cell: Cell<unknown, unknown> }) => ReactNode;
  className?: string;
};

export const TableRow = ({ row, children, className }: TableRowProps) => (
  <TableRowRaw className={className} data-state={row.getIsSelected() && "selected"} key={row.id}>
    {row.getVisibleCells().map((cell) => children({ cell }))}
  </TableRowRaw>
);

export type TableBodyProps = {
  children: (props: { row: Row<unknown> }) => ReactNode;
  className?: string;
  emptyMessage?: string;
};

export const TableBody = ({ children, className, emptyMessage = "Sin resultados." }: TableBodyProps) => {
  const { columns, table } = useContext(TableContext);
  const rows = table?.getRowModel().rows;

  return (
    <TableBodyRaw className={className}>
      {rows?.length ? (
        rows.map((row) => children({ row }))
      ) : (
        <TableRowRaw>
          <TableCellRaw className="h-24 text-center text-muted-foreground" colSpan={columns.length}>
            {emptyMessage}
          </TableCellRaw>
        </TableRowRaw>
      )}
    </TableBodyRaw>
  );
};
