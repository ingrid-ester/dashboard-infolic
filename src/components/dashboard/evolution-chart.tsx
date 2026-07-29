"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type EvolutionPoint = { data: string; leads: number; vendas: number; sqls: number };

export function EvolutionChart({ data }: { data: EvolutionPoint[] }) {
  const chartData = data.map((point) => ({
    ...point,
    label: format(new Date(`${point.data}T00:00:00`), "dd/MM", { locale: ptBR }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução: Leads, SQLs e Vendas</CardTitle>
        <CardDescription>Vendas e SQLs aguardando integração com o CRM — aparecem zerados por enquanto.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados no período selecionado.</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" fontSize={12} tickLine={false} className="fill-muted-foreground" />
                <YAxis fontSize={12} tickLine={false} allowDecimals={false} className="fill-muted-foreground" />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--popover-foreground)" }} />
                <Legend wrapperStyle={{ color: "var(--muted-foreground)", fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="leads"
                  name="Leads"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#leadsGradient)"
                />
                <Line
                  type="monotone"
                  dataKey="vendas"
                  name="Vendas"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="sqls"
                  name="SQLs"
                  stroke="var(--chart-3)"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
