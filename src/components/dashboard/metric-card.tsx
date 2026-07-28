import { ArrowDownIcon, ArrowUpIcon, MinusIcon, type LucideIcon } from "lucide-react";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { percentChange } from "@/lib/dashboard/period";

type MetricCardProps = {
  label: string;
  value: number | null;
  previousValue?: number | null;
  format?: (value: number) => string;
  // For metrics where a lower value is the good outcome (e.g. CAC): flips
  // the green/red coloring of the change badge.
  invert?: boolean;
  pendingReason?: string;
  icon?: LucideIcon;
};

const defaultFormat = (value: number) => value.toLocaleString("pt-BR");

function IconBadge({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="flex size-10 items-center justify-center rounded-full border border-accent/40 text-accent">
      <Icon className="size-5" />
    </div>
  );
}

export function MetricCard({
  label,
  value,
  previousValue,
  format = defaultFormat,
  invert = false,
  pendingReason,
  icon,
}: MetricCardProps) {
  if (value === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground">{label}</CardTitle>
          {icon && (
            <CardAction>
              <IconBadge icon={icon} />
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-muted-foreground/50">—</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {pendingReason ?? "Pendente"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const change =
    previousValue !== undefined && previousValue !== null
      ? percentChange(value, previousValue)
      : null;

  const isPositive = change !== null && change > 0;
  const isNegative = change !== null && change < 0;
  const isGood = invert ? isNegative : isPositive;
  const isBad = invert ? isPositive : isNegative;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground">{label}</CardTitle>
        {icon && (
          <CardAction>
            <IconBadge icon={icon} />
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{format(value)}</p>
        {previousValue !== undefined && previousValue !== null && (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {format(previousValue)} no período anterior
            </span>
            {change !== null && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium",
                  isGood && "text-emerald-400",
                  isBad && "text-red-400",
                  !isGood && !isBad && "text-muted-foreground",
                )}
              >
                {isPositive && <ArrowUpIcon className="size-3" />}
                {isNegative && <ArrowDownIcon className="size-3" />}
                {!isPositive && !isNegative && <MinusIcon className="size-3" />}
                {Math.abs(change).toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
