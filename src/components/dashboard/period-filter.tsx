"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { resolveComparisonPeriod, resolvePeriod } from "@/lib/dashboard/period";

function fmt(dateISO: string) {
  return format(new Date(`${dateISO}T00:00:00`), "dd/MM/yyyy", { locale: ptBR });
}

const PRESETS = [
  {
    label: "Este mês",
    range: () => ({ from: startOfMonth(new Date()), to: new Date() }),
  },
  {
    label: "Mês passado",
    range: () => {
      const lastMonth = subMonths(new Date(), 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    },
  },
];

export function PeriodFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const period = resolvePeriod({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });
  const isCustomComparison = Boolean(searchParams.get("compareFrom") && searchParams.get("compareTo"));
  const comparison = resolveComparisonPeriod(period, {
    compareFrom: searchParams.get("compareFrom") ?? undefined,
    compareTo: searchParams.get("compareTo") ?? undefined,
  });

  const [periodOpen, setPeriodOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(`${period.from}T00:00:00`),
    to: new Date(`${period.to}T00:00:00`),
  });

  const [compareOpen, setCompareOpen] = useState(false);
  const [compareRange, setCompareRange] = useState<DateRange | undefined>({
    from: new Date(`${comparison.from}T00:00:00`),
    to: new Date(`${comparison.to}T00:00:00`),
  });

  function applyRange(from: Date, to: Date) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", format(from, "yyyy-MM-dd"));
    params.set("to", format(to, "yyyy-MM-dd"));
    // Changing the main period invalidates any explicit custom comparison —
    // fall back to auto (same-length preceding period) for the new range.
    params.delete("compareFrom");
    params.delete("compareTo");
    router.push(`${pathname}?${params.toString()}`);
    setPeriodOpen(false);
  }

  function applyCompareRange(from: Date, to: Date) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("compareFrom", format(from, "yyyy-MM-dd"));
    params.set("compareTo", format(to, "yyyy-MM-dd"));
    router.push(`${pathname}?${params.toString()}`);
    setCompareOpen(false);
  }

  function resetToAutoComparison() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("compareFrom");
    params.delete("compareTo");
    router.push(`${pathname}?${params.toString()}`);
    setCompareOpen(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
        <PopoverTrigger
          render={
            <Button variant="outline" className="gap-2">
              <CalendarIcon className="size-4" />
              {fmt(period.from)} – {fmt(period.to)}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col gap-2 border-b p-2 sm:flex-row sm:gap-1">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                onClick={() => {
                  const { from, to } = preset.range();
                  setRange({ from, to });
                  applyRange(from, to);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="range"
            locale={ptBR}
            selected={range}
            onSelect={setRange}
            numberOfMonths={2}
            defaultMonth={range?.from}
          />
          <div className="flex justify-end gap-2 border-t p-2">
            <Button
              size="sm"
              disabled={!range?.from || !range?.to}
              onClick={() => range?.from && range?.to && applyRange(range.from, range.to)}
            >
              Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Popover open={compareOpen} onOpenChange={setCompareOpen}>
        <PopoverTrigger
          render={
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              Comparando com {fmt(comparison.from)} – {fmt(comparison.to)}
              {!isCustomComparison && " (automático)"}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex items-center justify-between gap-2 border-b p-2">
            <span className="px-1 text-xs text-muted-foreground">
              Padrão: mesmo número de dias, período imediatamente anterior
            </span>
            <Button variant="ghost" size="sm" onClick={resetToAutoComparison} disabled={!isCustomComparison}>
              Automático
            </Button>
          </div>
          <Calendar
            mode="range"
            locale={ptBR}
            selected={compareRange}
            onSelect={setCompareRange}
            numberOfMonths={2}
            defaultMonth={compareRange?.from}
          />
          <div className="flex justify-end gap-2 border-t p-2">
            <Button
              size="sm"
              disabled={!compareRange?.from || !compareRange?.to}
              onClick={() =>
                compareRange?.from && compareRange?.to && applyCompareRange(compareRange.from, compareRange.to)
              }
            >
              Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
