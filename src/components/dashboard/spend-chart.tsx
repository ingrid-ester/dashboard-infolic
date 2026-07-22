"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Area, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DailySpendPoint = { data: string; spend: number };

const currencyFormat = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function SpendChart({ data }: { data: DailySpendPoint[] }) {
  const chartData = data.map((point) => ({
    ...point,
    label: format(new Date(`${point.data}T00:00:00`), "dd/MM", { locale: ptBR }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investimento diário</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados no período selecionado.</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" fontSize={12} tickLine={false} className="fill-muted-foreground" />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  className="fill-muted-foreground"
                  tickFormatter={(value: number) => currencyFormat(value)}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--popover-foreground)",
                  }}
                  formatter={(value) => currencyFormat(Number(value))}
                />
                <Area
                  type="monotone"
                  dataKey="spend"
                  name="Investimento"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#spendGradient)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
