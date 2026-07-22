import { WalletIcon } from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { SpendChart } from "@/components/dashboard/spend-chart";
import { RankingTable } from "@/components/dashboard/ranking-table";

type DailySpendPoint = { data: string; spend: number };
type VideoRetentionMetric = {
  adName: string;
  campaignName: string;
  plays: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  p100: number;
};

type MarketingTabProps = {
  investimento: number;
  previousInvestimento: number;
  dailySpend: DailySpendPoint[];
  videoRetention: VideoRetentionMetric[];
};

const currencyFormat = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const pctFormat = (value: number) => `${value.toFixed(1)}%`;

export function MarketingTab({
  investimento,
  previousInvestimento,
  dailySpend,
  videoRetention,
}: MarketingTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Investimento"
          value={investimento}
          previousValue={previousInvestimento}
          format={currencyFormat}
          icon={WalletIcon}
        />
      </div>

      <SpendChart data={dailySpend} />

      <RankingTable
        title="Retenção de Vídeo (Anúncios Ativos)"
        rows={videoRetention}
        emptyMessage="Nenhum anúncio de vídeo ativo no momento."
        columns={[
          { header: "Anúncio", render: (r) => r.adName, sortValue: (r) => r.adName },
          { header: "Campanha", render: (r) => r.campaignName, sortValue: (r) => r.campaignName },
          {
            header: "Plays",
            align: "right",
            render: (r) => r.plays.toLocaleString("pt-BR"),
            sortValue: (r) => r.plays,
          },
          { header: "25%", align: "right", render: (r) => pctFormat(r.p25), sortValue: (r) => r.p25 },
          { header: "50%", align: "right", render: (r) => pctFormat(r.p50), sortValue: (r) => r.p50 },
          { header: "75%", align: "right", render: (r) => pctFormat(r.p75), sortValue: (r) => r.p75 },
          { header: "95%", align: "right", render: (r) => pctFormat(r.p95), sortValue: (r) => r.p95 },
          { header: "100%", align: "right", render: (r) => pctFormat(r.p100), sortValue: (r) => r.p100 },
        ]}
      />
    </div>
  );
}
