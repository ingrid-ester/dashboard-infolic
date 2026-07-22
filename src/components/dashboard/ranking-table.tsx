"use client";

import { useMemo, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Column<T> = {
  header: string;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
  // Omit to leave a column unsortable (e.g. one that renders composite
  // JSX with no single sortable value).
  sortValue?: (row: T) => string | number;
};

type RankingTableProps<T> = {
  title: string;
  rows: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  totalLabel?: string;
  totalValue?: React.ReactNode;
  // Shows a 1st/2nd/3rd place badge next to the top 3 rows. Only makes
  // sense for tables where being at the top is a good thing (creative/
  // salesperson rankings) — not for breakdowns like loss reasons.
  rankBadge?: boolean;
};

const RANK_BADGE_STYLES = [
  "border-amber-400/60 bg-amber-400/15 text-amber-300",
  "border-slate-300/50 bg-slate-300/10 text-slate-300",
  "border-orange-600/50 bg-orange-600/15 text-orange-400",
];

function RankBadge({ position }: { position: number }) {
  const style = RANK_BADGE_STYLES[position];
  if (!style) return null;
  return (
    <span
      className={cn(
        "flex size-6 items-center justify-center rounded-full border text-xs font-semibold tabular-nums",
        style,
      )}
    >
      {position + 1}
    </span>
  );
}

export function RankingTable<T>({
  title,
  rows,
  columns,
  emptyMessage = "Sem dados no período selecionado.",
  totalLabel,
  totalValue,
  rankBadge = false,
}: RankingTableProps<T>) {
  // First click on a column sorts biggest/last-alphabetically first (the
  // more useful default for "who invested the most" style questions);
  // clicking the same column again flips it.
  const [sort, setSort] = useState<{ index: number; dir: "asc" | "desc" } | null>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = columns[sort.index];
    if (!col?.sortValue) return rows;

    const withKeys = rows.map((row) => ({ row, key: col.sortValue!(row) }));
    withKeys.sort((a, b) => {
      if (typeof a.key === "string" || typeof b.key === "string") {
        return String(a.key).localeCompare(String(b.key));
      }
      return a.key - b.key;
    });
    const sorted = withKeys.map((w) => w.row);
    return sort.dir === "desc" ? sorted.reverse() : sorted;
  }, [rows, sort, columns]);

  function toggleSort(index: number) {
    if (!columns[index]?.sortValue) return;
    setSort((prev) => (prev?.index === index ? { index, dir: prev.dir === "desc" ? "asc" : "desc" } : { index, dir: "desc" }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {rankBadge && <TableHead className="w-10" />}
                {columns.map((col, i) => (
                  <TableHead
                    key={col.header}
                    className={cn(
                      col.align === "right" && "text-right",
                      col.sortValue && "cursor-pointer select-none hover:text-foreground",
                    )}
                    onClick={() => toggleSort(i)}
                  >
                    <span
                      className={cn(
                        "inline-flex items-center gap-1",
                        col.align === "right" && "flex-row-reverse",
                      )}
                    >
                      {col.header}
                      {sort?.index === i &&
                        (sort.dir === "desc" ? (
                          <ArrowDownIcon className="size-3" />
                        ) : (
                          <ArrowUpIcon className="size-3" />
                        ))}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.map((row, i) => (
                <TableRow key={i}>
                  {rankBadge && (
                    <TableCell>
                      <RankBadge position={i} />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell
                      key={col.header}
                      className={col.align === "right" ? "text-right tabular-nums" : undefined}
                    >
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {totalLabel !== undefined && (
                <TableRow className="border-t-2 font-semibold">
                  <TableCell colSpan={columns.length - 1 + (rankBadge ? 1 : 0)}>{totalLabel}</TableCell>
                  <TableCell
                    className={cn(
                      "tabular-nums",
                      columns[columns.length - 1]?.align === "right" && "text-right",
                    )}
                  >
                    {totalValue}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
